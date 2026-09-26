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
import { buildBookingActionUrl } from "@/lib/booking-tokens";
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

export async function getAvailableSlots(
  businessId: string,
  serviceId: string,
  dateStr: string
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

  const existingBookings = await prisma.booking.findMany({
    where: {
      business_id: businessId,
      starts_at: { gte: dayRange.start, lt: dayRange.end },
      status: { not: "cancelled" },
    },
    select: { starts_at: true },
  });

  const [startHour, startMin] = business.business_hours_start.split(":").map(Number);
  const [endHour, endMin] = business.business_hours_end.split(":").map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  const interval = business.booking_interval;
  const maxPerSlot = business.max_bookings_per_slot;

  const slotCounts = new Map<number, number>();
  for (const booking of existingBookings) {
    const slotMin = getZonedMinutes(new Date(booking.starts_at), timeZone);
    slotCounts.set(slotMin, (slotCounts.get(slotMin) ?? 0) + 1);
  }

  const isToday = dateStr === todayKey;
  const nowMinutes = isToday ? getZonedMinutes(new Date(), timeZone) : -1;

  const slots: string[] = [];
  for (let t = startMinutes; t + service.duration <= endMinutes; t += interval) {
    if (isToday && t <= nowMinutes) continue;
    const count = slotCounts.get(t) ?? 0;
    if (count < maxPerSlot) {
      const h = Math.floor(t / 60).toString().padStart(2, "0");
      const m = (t % 60).toString().padStart(2, "0");
      slots.push(`${h}:${m}`);
    }
  }
  return slots;
}

export async function createPublicBooking(formData: FormData): Promise<void> {
  const businessId = formData.get("businessId") as string;
  const serviceId = formData.get("serviceId") as string;
  const dateStr = formData.get("date") as string;
  const timeStr = formData.get("time") as string;
  const customerName = (formData.get("customerName") as string)?.trim();
  const customerEmail = (formData.get("customerEmail") as string)?.trim();
  const customerPhone = (formData.get("customerPhone") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;
  const paymentMethodId = (formData.get("paymentMethodId") as string)?.trim() || null;
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
        timezone: true,
        max_bookings_per_slot: true,
        business_hours_start: true,
        business_hours_end: true,
        booking_interval: true,
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
  const requiresPaymentProof = Boolean(selectedPaymentMethod && selectedPaymentMethod.type !== "cash");
  const validPaymentMethodIds = new Set(enabledPaymentMethods.map((method) => method.id));

  if (enabledPaymentMethods.length > 0 && (!paymentMethodId || !validPaymentMethodIds.has(paymentMethodId))) {
    throw new Error("Please choose a payment method.");
  }
  if (requiresPaymentProof && !(paymentProof instanceof File)) {
    throw new Error("Please upload a payment proof image.");
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
    inserted = await prisma.$queryRaw<Array<{ id: string }>>`
      WITH slot_lock AS (
        SELECT pg_advisory_xact_lock(
          hashtext(${businessId}),
          hashtext(${startsAt.toISOString()})
        )
      )
      INSERT INTO bookings (
        id, business_id, service_id, customer_name, customer_email, customer_phone,
        payment_method_id, payment_proof_url, notes, starts_at, ends_at, status,
        created_at, updated_at
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

  const emailJobs: Promise<unknown>[] = [
    sendBookingReceivedEmail({
      to: customerEmail,
      businessEmail: business.contact_email ?? undefined,
      customerName,
      businessName: business.name,
      serviceName: service.name,
      date: dateLabel,
      time: timeLabel,
    }),
  ];

  try {
    const ownerEmail = await getBusinessNotificationEmail(businessId);
    if (ownerEmail) {
      const baseUrl = await getAppBaseUrl();
      emailJobs.push(
        sendOwnerNewBookingEmail({
          to: ownerEmail,
          businessName: business.name,
          customerName,
          customerEmail,
          customerPhone,
          serviceName: service.name,
          price: Number(service.price).toFixed(2),
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
      await sendBookingApprovedEmail({
        to: bookingDetails.customer_email,
        businessEmail: bookingDetails.business.contact_email ?? undefined,
        customerName: bookingDetails.customer_name,
        businessName: bookingDetails.business.name,
        serviceName: bookingDetails.service.name,
        date: formatZonedDate(bookingDetails.starts_at, timeZone, { dateStyle: "long" }),
        time: formatZonedTime(bookingDetails.starts_at, timeZone),
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
