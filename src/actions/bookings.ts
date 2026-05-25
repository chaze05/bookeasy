"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";
import { prisma } from "@/lib/prisma";
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

  if (!businessId || !serviceId || !dateStr || !timeStr || !customerName || !customerEmail) {
    throw new Error("Please fill in all required fields.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    throw new Error("Invalid email address.");
  }

  const [business, service] = await Promise.all([
    prisma.business.findUnique({
      where: { id: businessId, status: "active" },
      select: { max_bookings_per_slot: true },
    }),
    prisma.service.findUnique({
      where: { id: serviceId, business_id: businessId, is_active: true },
      select: { duration: true },
    }),
  ]);
  if (!business) throw new Error("Business not found.");
  if (!service) throw new Error("Service not found.");

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

  await prisma.booking.create({
    data: {
      business_id: businessId,
      service_id: serviceId,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      notes,
      starts_at: startsAt,
      ends_at: endsAt,
      status: "pending",
    },
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

  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard");
}
