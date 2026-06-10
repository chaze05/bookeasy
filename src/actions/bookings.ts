"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";
import { prisma } from "@/lib/prisma";
import { uploadPaymentProof } from "@/actions/payments";
import { sendBookingReceivedEmail, sendBookingApprovedEmail } from "@/lib/email";
import type { BookingStatus } from "@/types";

export async function getAvailableSlots(
  businessId: string,
  serviceId: string,
  dateStr: string
): Promise<string[]> {
  const [business, service] = await Promise.all([
    prisma.business.findUnique({
      where: { id: businessId },
      select: {
        business_hours_start: true,
        business_hours_end: true,
        booking_interval: true,
        max_bookings_per_slot: true,
      },
    }),
    prisma.service.findUnique({
      where: { id: serviceId },
      select: { duration: true },
    }),
  ]);
  if (!business || !service) return [];

  const [year, month, day] = dateStr.split("-").map(Number);
  const dayStart = new Date(year, month - 1, day, 0, 0, 0);
  const dayEnd = new Date(year, month - 1, day, 23, 59, 59);

  const existingBookings = await prisma.booking.findMany({
    where: {
      business_id: businessId,
      starts_at: { gte: dayStart, lte: dayEnd },
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
  for (const b of existingBookings) {
    const d = new Date(b.starts_at);
    const slotMin = d.getHours() * 60 + d.getMinutes();
    slotCounts.set(slotMin, (slotCounts.get(slotMin) ?? 0) + 1);
  }

  const now = new Date();
  const isToday =
    now.getFullYear() === year &&
    now.getMonth() + 1 === month &&
    now.getDate() === day;
  const nowMinutes = isToday ? now.getHours() * 60 + now.getMinutes() : 0;

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

  const [business, service, enabledPaymentMethods] = await Promise.all([
    prisma.business.findUnique({
      where: { id: businessId, status: "active" },
      select: { name: true, max_bookings_per_slot: true },
    }),
    prisma.service.findUnique({
      where: { id: serviceId, business_id: businessId, is_active: true },
      select: { name: true, duration: true },
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
  const startsAt = new Date(year, month - 1, day, hour, minute, 0);
  const endsAt = new Date(startsAt.getTime() + service.duration * 60 * 1000);

  if (startsAt <= new Date()) throw new Error("Cannot book in the past.");

  const conflictCount = await prisma.booking.count({
    where: { business_id: businessId, starts_at: startsAt, status: { not: "cancelled" } },
  });
  if (conflictCount >= business.max_bookings_per_slot) {
    throw new Error("This slot is no longer available. Please choose another time.");
  }

  const bookingId = crypto.randomUUID();
  const paymentProofUrl =
    requiresPaymentProof && paymentProof instanceof File
      ? await uploadPaymentProof(bookingId, paymentProof)
      : null;

  await prisma.booking.create({
    data: {
      id: bookingId,
      business_id: businessId,
      service_id: serviceId,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      payment_method_id: requiresPaymentProof ? paymentMethodId : null,
      payment_proof_url: paymentProofUrl,
      notes,
      starts_at: startsAt,
      ends_at: endsAt,
      status: "pending",
    },
  });

  // Dispatch email notification without blocking
  void sendBookingReceivedEmail({
    to: customerEmail,
    customerName,
    businessName: business.name,
    serviceName: service.name,
    date: startsAt.toLocaleDateString(),
    time: timeStr,
  });
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
        business: { select: { name: true } },
        service: { select: { name: true } },
      }
    });

    if (bookingDetails && bookingDetails.customer_email) {
      void sendBookingApprovedEmail({
        to: bookingDetails.customer_email,
        customerName: bookingDetails.customer_name,
        businessName: bookingDetails.business.name,
        serviceName: bookingDetails.service.name,
        date: bookingDetails.starts_at.toLocaleDateString(),
        time: bookingDetails.starts_at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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

  const paymentProofUrl =
    proof instanceof File && proof.size > 0
      ? await uploadPaymentProof(bookingId, proof)
      : null;

  const existingBooking = await prisma.booking.findFirst({
    where: { id: bookingId, business_id: business.id },
    select: { notes: true },
  });
  if (!existingBooking) throw new Error("Booking not found");

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
