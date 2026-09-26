"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifyManageToken } from "@/lib/booking-tokens";
import { getAvailableSlots } from "@/actions/bookings";
import { safeTimeZone, zonedTimeToUtc } from "@/lib/timezone";

const MANAGEABLE_STATUSES = ["pending", "confirmed"];

async function loadBookingByToken(token: string) {
  const verified = verifyManageToken(token);
  if (!verified) throw new Error("This link is invalid or has expired.");

  const booking = await prisma.booking.findUnique({
    where: { id: verified.bookingId },
    include: {
      business: {
        select: {
          id: true,
          name: true,
          timezone: true,
          max_bookings_per_slot: true,
          business_hours_start: true,
          business_hours_end: true,
          booking_interval: true,
        },
      },
      service: { select: { id: true, name: true, duration: true } },
    },
  });
  if (!booking) throw new Error("We couldn't find this booking.");
  return booking;
}

export async function getManageSlots(token: string, dateStr: string): Promise<string[]> {
  const booking = await loadBookingByToken(token);
  if (!MANAGEABLE_STATUSES.includes(booking.status)) return [];
  return getAvailableSlots(booking.business_id, booking.service_id, dateStr);
}

export async function rescheduleBooking(
  token: string,
  dateStr: string,
  timeStr: string
): Promise<void> {
  const booking = await loadBookingByToken(token);
  if (!MANAGEABLE_STATUSES.includes(booking.status)) {
    throw new Error("This booking can no longer be changed.");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || !/^\d{2}:\d{2}$/.test(timeStr)) {
    throw new Error("Invalid date or time.");
  }

  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);
  if (hour > 23 || minute > 59) throw new Error("Invalid time.");

  const timeZone = safeTimeZone(booking.business.timezone);
  const [startHour, startMin] = booking.business.business_hours_start.split(":").map(Number);
  const [endHour, endMin] = booking.business.business_hours_end.split(":").map(Number);
  const requestedMinutes = hour * 60 + minute;
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  if (requestedMinutes < startMinutes || requestedMinutes + booking.service.duration > endMinutes) {
    throw new Error("That time is outside business hours.");
  }
  if ((requestedMinutes - startMinutes) % booking.business.booking_interval !== 0) {
    throw new Error("Please choose an available time slot.");
  }

  const startsAt = zonedTimeToUtc(year, month, day, hour, minute, timeZone);
  const endsAt = new Date(startsAt.getTime() + booking.service.duration * 60_000);
  if (startsAt <= new Date()) throw new Error("Cannot move a booking into the past.");

  // Atomic slot lock + capacity check + update, pooler-safe (single statement).
  const updated = await prisma.$queryRaw<Array<{ id: string }>>`
    WITH slot_lock AS (
      SELECT pg_advisory_xact_lock(
        hashtext(${booking.business_id}),
        hashtext(${startsAt.toISOString()})
      )
    )
    UPDATE bookings
    SET starts_at = ${startsAt}::timestamptz,
        ends_at = ${endsAt}::timestamptz,
        updated_at = now()
    WHERE id = ${booking.id}::uuid
      AND status IN ('pending', 'confirmed')
      AND (
        SELECT count(*) FROM bookings
        WHERE business_id = ${booking.business_id}::uuid
          AND starts_at = ${startsAt}::timestamptz
          AND status <> 'cancelled'
          AND id <> ${booking.id}::uuid
      ) < ${booking.business.max_bookings_per_slot}
    RETURNING id
  `;

  if (updated.length === 0) {
    throw new Error("That slot is no longer available. Please choose another time.");
  }

  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard");
}

export async function cancelBookingByToken(token: string): Promise<void> {
  const booking = await loadBookingByToken(token);
  if (!MANAGEABLE_STATUSES.includes(booking.status)) {
    throw new Error("This booking can no longer be changed.");
  }

  const result = await prisma.booking.updateMany({
    where: { id: booking.id, status: { in: MANAGEABLE_STATUSES } },
    data: { status: "cancelled", updated_at: new Date() },
  });
  if (result.count === 0) {
    throw new Error("This booking can no longer be changed.");
  }

  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard");
}
