"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";
import { prisma } from "@/lib/prisma";
import { uploadPaymentProof } from "@/lib/storage";
import {
  sendBookingReceivedEmail,
  sendBookingApprovedEmail,
  sendOwnerNewBookingEmail,
} from "@/lib/email";
import { getAppBaseUrl, getBusinessNotificationEmail } from "@/lib/notify";
import { buildBookingActionUrl, buildManageUrl } from "@/lib/booking-tokens";
import { createPaymongoCheckout } from "@/lib/paymongo";
import { decryptSecret } from "@/lib/crypto";
import {
  formatZonedDate,
  formatZonedTime,
  getZonedDateKey,
  getZonedDayRange,
  getZonedMinutes,
  safeTimeZone,
  zonedTimeToUtc,
} from "@/lib/timezone";
import type { BookingStatus } from "@/types";

function timeToMinutes(value: Date): number {
  return value.getUTCHours() * 60 + value.getUTCMinutes();
}

interface StaffSchedule {
  windowsByStaff: Map<string, Array<[number, number]>>;
  busyByStaff: Map<string, Array<[number, number]>>;
  staffIds: string[];
  businessBlocked: boolean;
}

/**
 * Loads the day's staff schedule in business-local minutes:
 * availability windows, blocked staff, and busy intervals per staff.
 */
async function loadStaffSchedule(
  businessId: string,
  dateKey: string,
  timeZone: string,
  staffFilter?: string | null
): Promise<StaffSchedule> {
  const [year, month, day] = dateKey.split("-").map(Number);
  const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const dateOnly = new Date(Date.UTC(year, month - 1, day));
  const dayRange = getZonedDayRange(dateKey, timeZone);

  const [staffList, availabilityRows, blockedRows, existingBookings] = await Promise.all([
    prisma.staff.findMany({
      where: { business_id: businessId, is_active: true, ...(staffFilter ? { id: staffFilter } : {}) },
      select: { id: true },
    }),
    prisma.availability.findMany({
      where: {
        business_id: businessId,
        is_active: true,
        day_of_week: dayOfWeek,
        ...(staffFilter ? { staff_id: staffFilter } : {}),
      },
      select: { staff_id: true, start_time: true, end_time: true },
    }),
    prisma.blockedDate.findMany({
      where: { business_id: businessId, blocked_on: dateOnly },
      select: { staff_id: true },
    }),
    prisma.booking.findMany({
      where: {
        business_id: businessId,
        starts_at: { gte: dayRange.start, lt: dayRange.end },
        status: { not: "cancelled" },
      },
      select: { staff_id: true, starts_at: true, ends_at: true },
    }),
  ]);

  const businessBlocked = blockedRows.some((row) => row.staff_id === null);
  const blockedStaff = new Set(
    blockedRows.map((row) => row.staff_id).filter((id): id is string => Boolean(id))
  );

  const windowsByStaff = new Map<string, Array<[number, number]>>();
  const hasAnyAvailability = availabilityRows.length > 0;
  for (const row of availabilityRows) {
    if (blockedStaff.has(row.staff_id)) continue;
    const window: [number, number] = [timeToMinutes(row.start_time), timeToMinutes(row.end_time)];
    const existing = windowsByStaff.get(row.staff_id) ?? [];
    existing.push(window);
    windowsByStaff.set(row.staff_id, existing);
  }

  const busyByStaff = new Map<string, Array<[number, number]>>();
  for (const booking of existingBookings) {
    if (!booking.staff_id) continue;
    const start = getZonedMinutes(new Date(booking.starts_at), timeZone);
    const durationMinutes = Math.round(
      (new Date(booking.ends_at).getTime() - new Date(booking.starts_at).getTime()) / 60_000
    );
    const interval: [number, number] = [start, start + durationMinutes];
    const existing = busyByStaff.get(booking.staff_id) ?? [];
    existing.push(interval);
    busyByStaff.set(booking.staff_id, existing);
  }

  // If the owner has not configured any availability rows at all, treat
  // staff as available in business hours so booking still works out of the
  // box. When filtering by a specific staff member, their own missing rows
  // mean "not available" instead.
  if (!hasAnyAvailability && !staffFilter) {
    for (const staff of staffList) {
      if (!blockedStaff.has(staff.id)) {
        windowsByStaff.set(staff.id, [[0, 24 * 60]]);
      }
    }
  }

  return {
    windowsByStaff,
    busyByStaff,
    staffIds: staffList.map((staff) => staff.id),
    businessBlocked,
  };
}

export async function getAvailableSlots(
  businessId: string,
  serviceId: string,
  dateStr: string,
  staffId?: string | null
): Promise<string[]> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return [];

  const [business, service] = await Promise.all([
    prisma.business.findUnique({
      where: { id: businessId },
      select: {
        business_hours_start: true,
        business_hours_end: true,
        booking_interval: true,
        max_bookings_per_slot: true,
        timezone: true,
      },
    }),
    prisma.service.findUnique({
      where: { id: serviceId, business_id: businessId, is_active: true },
      select: { duration: true },
    }),
  ]);
  if (!business || !service) return [];

  const timeZone = safeTimeZone(business.timezone);
  const todayKey = getZonedDateKey(new Date(), timeZone);
  if (dateStr < todayKey) return [];

  let dayRange: { start: Date; end: Date };
  try {
    dayRange = getZonedDayRange(dateStr, timeZone);
  } catch {
    return [];
  }

  const [startHour, startMin] = business.business_hours_start.split(":").map(Number);
  const [endHour, endMin] = business.business_hours_end.split(":").map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  const interval = business.booking_interval;
  const isToday = dateStr === todayKey;
  const nowMinutes = isToday ? getZonedMinutes(new Date(), timeZone) : -1;

  const schedule = await loadStaffSchedule(businessId, dateStr, timeZone, staffId);
  if (schedule.businessBlocked) return [];

  // No staff (or none matching): fall back to business capacity per slot.
  if (schedule.staffIds.length === 0) {
    if (staffId) return [];

    const existingBookings = await prisma.booking.findMany({
      where: {
        business_id: businessId,
        starts_at: { gte: dayRange.start, lt: dayRange.end },
        status: { not: "cancelled" },
      },
      select: { starts_at: true },
    });
    const slotCounts = new Map<number, number>();
    for (const booking of existingBookings) {
      const slotMin = getZonedMinutes(new Date(booking.starts_at), timeZone);
      slotCounts.set(slotMin, (slotCounts.get(slotMin) ?? 0) + 1);
    }

    const fallbackSlots: string[] = [];
    for (let t = startMinutes; t + service.duration <= endMinutes; t += interval) {
      if (isToday && t <= nowMinutes) continue;
      if ((slotCounts.get(t) ?? 0) < business.max_bookings_per_slot) {
        fallbackSlots.push(`${Math.floor(t / 60).toString().padStart(2, "0")}:${(t % 60).toString().padStart(2, "0")}`);
      }
    }
    return fallbackSlots;
  }

  const slots: string[] = [];
  for (let t = startMinutes; t + service.duration <= endMinutes; t += interval) {
    if (isToday && t <= nowMinutes) continue;
    const slotEnd = t + service.duration;

    const hasFreeStaff = schedule.staffIds.some((id) => {
      const windows = schedule.windowsByStaff.get(id) ?? [];
      const inWindow = windows.some(([windowStart, windowEnd]) => t >= windowStart && slotEnd <= windowEnd);
      if (!inWindow) return false;
      const busy = schedule.busyByStaff.get(id) ?? [];
      const overlapping = busy.some(([busyStart, busyEnd]) => busyStart < slotEnd && busyEnd > t);
      return !overlapping;
    });

    if (hasFreeStaff) {
      slots.push(`${Math.floor(t / 60).toString().padStart(2, "0")}:${(t % 60).toString().padStart(2, "0")}`);
    }
  }
  return slots;
}

export async function createPublicBooking(
  formData: FormData
): Promise<{ bookingId: string; checkoutUrl?: string }> {
  const businessId = formData.get("businessId") as string;
  const serviceId = formData.get("serviceId") as string;
  const dateStr = formData.get("date") as string;
  const timeStr = formData.get("time") as string;
  const customerName = (formData.get("customerName") as string)?.trim();
  const customerEmail = (formData.get("customerEmail") as string)?.trim();
  const customerPhone = (formData.get("customerPhone") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;
  const paymentMethodId = (formData.get("paymentMethodId") as string)?.trim() || null;
  const requestedStaffId = (formData.get("staffId") as string)?.trim() || null;
  const paymentProof = formData.get("paymentProof");

  if (!businessId || !serviceId || !dateStr || !timeStr || !customerName || !customerEmail) {
    throw new Error("Please fill in all required fields.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    throw new Error("Invalid email address.");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || !/^\d{2}:\d{2}$/.test(timeStr)) {
    throw new Error("Invalid date or time.");
  }

  const [business, service, enabledPaymentMethods] = await Promise.all([
    prisma.business.findUnique({
      where: { id: businessId, status: "active" },
      select: {
        name: true,
        contact_email: true,
        currency: true,
        timezone: true,
        max_bookings_per_slot: true,
        business_hours_start: true,
        business_hours_end: true,
        booking_interval: true,
        deposit_type: true,
        deposit_value: true,
        paymongo_enabled: true,
        paymongo_secret_key_encrypted: true,
      },
    }),
    prisma.service.findUnique({
      where: { id: serviceId, business_id: businessId, is_active: true },
      select: { name: true, duration: true, price: true },
    }),
    prisma.paymentMethod.findMany({
      where: { business_id: businessId, is_enabled: true },
      select: { id: true, type: true },
    }),
  ]);
  if (!business) throw new Error("Business not found.");
  if (!service) throw new Error("Service not found.");

  const selectedPaymentMethod = enabledPaymentMethods.find((method) => method.id === paymentMethodId);
  const isOnlinePayment = selectedPaymentMethod?.type === "paymongo";
  const requiresPaymentProof = Boolean(
    selectedPaymentMethod && selectedPaymentMethod.type !== "cash" && !isOnlinePayment
  );
  const validPaymentMethodIds = new Set(enabledPaymentMethods.map((method) => method.id));

  if (enabledPaymentMethods.length > 0 && (!paymentMethodId || !validPaymentMethodIds.has(paymentMethodId))) {
    throw new Error("Please choose a payment method.");
  }
  if (requiresPaymentProof && !(paymentProof instanceof File)) {
    throw new Error("Please upload a payment proof image.");
  }
  if (isOnlinePayment && (!business.paymongo_enabled || !business.paymongo_secret_key_encrypted)) {
    throw new Error("Online payment is not available right now. Please choose another payment method.");
  }

  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);
  if (hour > 23 || minute > 59) throw new Error("Invalid time.");

  const timeZone = safeTimeZone(business.timezone);

  const [startHour, startMin] = business.business_hours_start.split(":").map(Number);
  const [endHour, endMin] = business.business_hours_end.split(":").map(Number);
  const requestedMinutes = hour * 60 + minute;
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  if (requestedMinutes < startMinutes || requestedMinutes + service.duration > endMinutes) {
    throw new Error("That time is outside business hours.");
  }
  if ((requestedMinutes - startMinutes) % business.booking_interval !== 0) {
    throw new Error("Please choose an available time slot.");
  }

  const startsAt = zonedTimeToUtc(year, month, day, hour, minute, timeZone);
  const endsAt = new Date(startsAt.getTime() + service.duration * 60_000);
  if (startsAt <= new Date()) throw new Error("Cannot book in the past.");

  // Staff assignment: honour the customer's choice, otherwise auto-assign a
  // free staff member. Availability windows, blocked dates and existing
  // bookings are all respected.
  let assignedStaffId: string | null = null;
  {
    const schedule = await loadStaffSchedule(businessId, dateStr, timeZone, requestedStaffId);
    if (schedule.businessBlocked) {
      throw new Error("This date is not available for booking.");
    }

    const slotStart = requestedMinutes;
    const slotEnd = requestedMinutes + service.duration;

    if (requestedStaffId) {
      if (!schedule.staffIds.includes(requestedStaffId)) {
        throw new Error("That staff member is not available.");
      }
      const windows = schedule.windowsByStaff.get(requestedStaffId) ?? [];
      const inWindow = windows.some(([windowStart, windowEnd]) => slotStart >= windowStart && slotEnd <= windowEnd);
      const busy = schedule.busyByStaff.get(requestedStaffId) ?? [];
      const overlapping = busy.some(([busyStart, busyEnd]) => busyStart < slotEnd && busyEnd > slotStart);
      if (!inWindow || overlapping) {
        throw new Error("That staff member is not available at this time. Please pick another time or staff.");
      }
      assignedStaffId = requestedStaffId;
    } else if (schedule.staffIds.length > 0) {
      assignedStaffId =
        schedule.staffIds.find((id) => {
          const windows = schedule.windowsByStaff.get(id) ?? [];
          if (!windows.some(([windowStart, windowEnd]) => slotStart >= windowStart && slotEnd <= windowEnd)) {
            return false;
          }
          const busy = schedule.busyByStaff.get(id) ?? [];
          return !busy.some(([busyStart, busyEnd]) => busyStart < slotEnd && busyEnd > slotStart);
        }) ?? null;

      if (!assignedStaffId) {
        throw new Error("This slot is no longer available. Please choose another time.");
      }
    }
  }

  const amountTotal = Number(service.price);
  const rawDeposit = Number(business.deposit_value);
  let depositAmount = 0;
  if (business.deposit_type === "percent" && rawDeposit > 0) {
    depositAmount = Math.round(amountTotal * rawDeposit) / 100;
  } else if (business.deposit_type === "fixed" && rawDeposit > 0) {
    depositAmount = rawDeposit;
  }
  depositAmount = Math.min(Math.max(depositAmount, 0), amountTotal);

  const bookingId = crypto.randomUUID();
  let paymentProofUrl: string | null = null;
  if (requiresPaymentProof && paymentProof instanceof File) {
    try {
      paymentProofUrl = await uploadPaymentProof(bookingId, paymentProof);
    } catch (error) {
      console.error("[createPublicBooking] payment proof upload failed:", {
        name: error instanceof Error ? error.name : typeof error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        fileType: paymentProof.type,
        fileSize: paymentProof.size,
      });
      throw error;
    }
  }

  // Atomic insert: advisory lock + capacity check + insert in ONE statement.
  // A single statement is its own implicit transaction, so the xact-scoped
  // lock is held for the whole check-and-insert. This avoids interactive
  // transactions, which are unreliable through the Supabase transaction pooler.
  let inserted: Array<{ id: string }>;
  try {
    if (assignedStaffId) {
      // Staff assigned: the constraint is no overlapping booking for that
      // staff member (different staff can serve guests in parallel).
      inserted = await prisma.$queryRaw<Array<{ id: string }>>`
        WITH slot_lock AS (
          SELECT pg_advisory_xact_lock(
            hashtext(${businessId}),
            hashtext(${startsAt.toISOString()})
          )
        )
        INSERT INTO bookings (
          id, business_id, service_id, staff_id, customer_name, customer_email,
          customer_phone, payment_method_id, payment_proof_url, amount_total,
          deposit_amount, notes, starts_at, ends_at, status, created_at, updated_at
        )
        SELECT
          ${bookingId}::uuid,
          ${businessId}::uuid,
          ${serviceId}::uuid,
          ${assignedStaffId}::uuid,
          ${customerName},
          ${customerEmail},
          ${customerPhone},
          ${requiresPaymentProof ? paymentMethodId : null}::uuid,
          ${paymentProofUrl},
          ${amountTotal}::numeric,
          ${depositAmount}::numeric,
          ${notes},
          ${startsAt}::timestamptz,
          ${endsAt}::timestamptz,
          'pending',
          now(),
          now()
        FROM slot_lock
        WHERE NOT EXISTS (
          SELECT 1 FROM bookings existing
          WHERE existing.staff_id = ${assignedStaffId}::uuid
            AND existing.status <> 'cancelled'
            AND existing.starts_at < ${endsAt}::timestamptz
            AND existing.ends_at > ${startsAt}::timestamptz
        )
        RETURNING id
      `;
    } else {
      // No staff: fall back to the business-level capacity per slot.
      inserted = await prisma.$queryRaw<Array<{ id: string }>>`
        WITH slot_lock AS (
          SELECT pg_advisory_xact_lock(
            hashtext(${businessId}),
            hashtext(${startsAt.toISOString()})
          )
        )
        INSERT INTO bookings (
          id, business_id, service_id, customer_name, customer_email, customer_phone,
          payment_method_id, payment_proof_url, amount_total, deposit_amount, notes,
          starts_at, ends_at, status, created_at, updated_at
        )
        SELECT
          ${bookingId}::uuid,
          ${businessId}::uuid,
          ${serviceId}::uuid,
          ${customerName},
          ${customerEmail},
          ${customerPhone},
          ${requiresPaymentProof ? paymentMethodId : null}::uuid,
          ${paymentProofUrl},
          ${amountTotal}::numeric,
          ${depositAmount}::numeric,
          ${notes},
          ${startsAt}::timestamptz,
          ${endsAt}::timestamptz,
          'pending',
          now(),
          now()
        FROM slot_lock
        WHERE (
          SELECT count(*) FROM bookings
          WHERE business_id = ${businessId}::uuid
            AND starts_at = ${startsAt}::timestamptz
            AND status <> 'cancelled'
        ) < ${business.max_bookings_per_slot}
        RETURNING id
      `;
    }
  } catch (error) {
    console.error("[createPublicBooking] insert failed:", {
      name: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      code: (error as { code?: string }).code,
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }

  if (inserted.length === 0) {
    throw new Error("This slot is no longer available. Please choose another time.");
  }

  const dateLabel = formatZonedDate(startsAt, timeZone, { dateStyle: "long" });
  const timeLabel = formatZonedTime(startsAt, timeZone);

  let baseUrl: string | undefined;
  let manageUrl: string | undefined;
  try {
    baseUrl = await getAppBaseUrl();
    manageUrl = buildManageUrl(baseUrl, bookingId);
  } catch (error) {
    console.error("Failed to build booking links:", error);
  }

  // Online payment (PayMongo): create a hosted checkout session and record it.
  let checkoutUrl: string | undefined;
  if (isOnlinePayment) {
    if (!baseUrl || !manageUrl || !business.paymongo_secret_key_encrypted) {
      throw new Error("Online payment is not available right now. Please choose another payment method.");
    }
    try {
      const chargeAmount = depositAmount > 0 ? depositAmount : amountTotal;
      const session = await createPaymongoCheckout({
        secretKey: decryptSecret(business.paymongo_secret_key_encrypted),
        amount: Math.round(chargeAmount * 100),
        description: `${service.name} — ${business.name}`,
        referenceNumber: bookingId,
        successUrl: `${manageUrl}&payment=success`,
        cancelUrl: `${manageUrl}&payment=cancel`,
        metadata: { booking_id: bookingId, business_id: businessId },
      });
      checkoutUrl = session.checkoutUrl;

      await prisma.payment.create({
        data: {
          booking_id: bookingId,
          business_id: businessId,
          provider: "paymongo",
          provider_ref: session.id,
          checkout_url: session.checkoutUrl,
          amount: chargeAmount,
          currency: "PHP",
          status: "pending",
        },
      });
    } catch (error) {
      // Don't leave a pending booking behind if checkout could not be created.
      await prisma.booking.delete({ where: { id: bookingId } }).catch(() => {});
      console.error("[createPublicBooking] PayMongo checkout failed:", {
        name: error instanceof Error ? error.name : typeof error,
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  const emailJobs: Promise<unknown>[] = [
    sendBookingReceivedEmail({
      to: customerEmail,
      businessEmail: business.contact_email ?? undefined,
      customerName,
      businessName: business.name,
      serviceName: service.name,
      date: dateLabel,
      time: timeLabel,
      manageUrl,
    }),
  ];

  try {
    const ownerEmail = await getBusinessNotificationEmail(businessId);
    if (ownerEmail && baseUrl) {
      emailJobs.push(
        sendOwnerNewBookingEmail({
          to: ownerEmail,
          businessName: business.name,
          customerName,
          customerEmail,
          customerPhone,
          serviceName: service.name,
          price: amountTotal.toFixed(2),
          currency: business.currency,
          depositAmount: depositAmount.toFixed(2),
          balanceAmount: (amountTotal - depositAmount).toFixed(2),
          date: dateLabel,
          time: timeLabel,
          notes,
          confirmUrl: buildBookingActionUrl(baseUrl, bookingId, "confirm"),
          declineUrl: buildBookingActionUrl(baseUrl, bookingId, "decline"),
        })
      );
    }
  } catch (error) {
    console.error("Failed to prepare owner notification email:", error);
  }

  await Promise.allSettled(emailJobs);

  return { bookingId, checkoutUrl };
}

export async function updateBookingStatus(id: string, status: BookingStatus) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Verify the booking belongs to the user's business
  const business = await prisma.business.findFirst({
    where: { owner_id: user.id },
    select: { id: true },
  });
  if (!business) throw new Error("No business found");

  const result = await prisma.booking.updateMany({
    where: { id, business_id: business.id },
    data: { status, updated_at: new Date() },
  });
  if (result.count === 0) throw new Error("Booking not found");

  if (status === "confirmed") {
    const bookingDetails = await prisma.booking.findUnique({
      where: { id },
      include: {
        business: { select: { name: true, timezone: true, contact_email: true } },
        service: { select: { name: true } },
      }
    });

    if (bookingDetails && bookingDetails.customer_email) {
      const timeZone = safeTimeZone(bookingDetails.business.timezone);
      let manageUrl: string | undefined;
      try {
        manageUrl = buildManageUrl(await getAppBaseUrl(), bookingDetails.id);
      } catch (error) {
        console.error("Failed to build manage link:", error);
      }
      await sendBookingApprovedEmail({
        to: bookingDetails.customer_email,
        businessEmail: bookingDetails.business.contact_email ?? undefined,
        customerName: bookingDetails.customer_name,
        businessName: bookingDetails.business.name,
        serviceName: bookingDetails.service.name,
        date: formatZonedDate(bookingDetails.starts_at, timeZone, { dateStyle: "long" }),
        time: formatZonedTime(bookingDetails.starts_at, timeZone),
        manageUrl,
      });
    }
  }

  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard");
}

export async function completeBookingWithPayment(formData: FormData) {
  const bookingId = String(formData.get("bookingId") ?? "");
  const paymentMethodId = String(formData.get("paymentMethodId") ?? "");
  const paymentNotes = String(formData.get("paymentNotes") ?? "").trim();
  const proof = formData.get("paymentProof");

  if (!bookingId) throw new Error("Booking is required");
  if (!paymentMethodId) throw new Error("Please select how payment was received.");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const business = await prisma.business.findFirst({
    where: { owner_id: user.id },
    select: { id: true },
  });
  if (!business) throw new Error("No business found");

  const method = await prisma.paymentMethod.findFirst({
    where: { id: paymentMethodId, business_id: business.id, is_enabled: true },
    select: { id: true, type: true },
  });
  if (!method) throw new Error("Payment method not found");

  const requiresProof = method.type !== "cash";
  if (requiresProof && (!(proof instanceof File) || proof.size === 0)) {
    throw new Error("Please upload proof of payment.");
  }

  const existingBooking = await prisma.booking.findFirst({
    where: { id: bookingId, business_id: business.id },
    select: { notes: true },
  });
  if (!existingBooking) throw new Error("Booking not found");

  const paymentProofUrl =
    proof instanceof File && proof.size > 0
      ? await uploadPaymentProof(bookingId, proof)
      : null;

  const notes = paymentNotes
    ? [existingBooking.notes, `Payment note: ${paymentNotes}`].filter(Boolean).join("\n")
    : existingBooking.notes;

  const result = await prisma.booking.updateMany({
    where: { id: bookingId, business_id: business.id },
    data: {
      status: "completed",
      payment_method_id: method.id,
      payment_proof_url: paymentProofUrl,
      notes,
      updated_at: new Date(),
    },
  });
  if (result.count === 0) throw new Error("Booking not found");

  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard");
}
