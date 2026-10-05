import Link from "next/link";
import { CalendarCheck, CheckCircle2, Clock, MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { verifyManageToken } from "@/lib/booking-tokens";
import { getAvailableSlots } from "@/actions/bookings";
import {
  formatZonedDate,
  formatZonedTime,
  getZonedDateKey,
  safeTimeZone,
} from "@/lib/timezone";
import { formatMoney } from "@/lib/utils";
import { ManageBookingPanel } from "./manage-booking-panel";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Manage your booking",
  robots: { index: false, follow: false },
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-100 shadow-2xl shadow-black/40">
        <Link href="/" className="mb-6 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500">
            <CalendarCheck className="h-4 w-4 text-white" />
          </span>
          <span className="text-sm font-semibold tracking-tight">
            Book<span className="text-emerald-400">Easy</span>
          </span>
        </Link>
        {children}
      </div>
    </main>
  );
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending confirmation",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
  no_show: "No-show",
};

export default async function ManageBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;
  const verified = verifyManageToken(token);

  if (!verified) {
    return (
      <Shell>
        <h1 className="text-lg font-semibold">Link expired or invalid</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          This booking link is no longer valid. Please contact the business directly to change your
          appointment.
        </p>
      </Shell>
    );
  }

  const booking = await prisma.booking.findUnique({
    where: { id: verified.bookingId },
    include: {
      business: {
        select: {
          name: true,
          slug: true,
          timezone: true,
          currency: true,
          business_hours_start: true,
          business_hours_end: true,
        },
      },
      service: { select: { name: true, duration: true } },
    },
  });

  if (!booking) {
    return (
      <Shell>
        <h1 className="text-lg font-semibold">Booking not found</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          We couldn&apos;t find this booking. It may have been removed.
        </p>
      </Shell>
    );
  }

  const timeZone = safeTimeZone(booking.business.timezone);
  const canManage = booking.status === "pending" || booking.status === "confirmed";
  const todayKey = getZonedDateKey(new Date(), timeZone);
  const initialDate = getZonedDateKey(booking.starts_at, timeZone);
  const deposit = Number(booking.deposit_amount ?? 0);
  const total = Number(booking.amount_total ?? 0);

  // Pre-load slots for the booking's current date so the panel is useful
  // immediately (respecting the assigned staff and excluding this booking).
  let initialSlots: string[] = [];
  if (canManage) {
    try {
      initialSlots = await getAvailableSlots(
        booking.business_id,
        booking.service_id,
        initialDate,
        booking.staff_id,
        booking.id
      );
    } catch {
      initialSlots = [];
    }
  }

  return (
    <Shell>
      <h1 className="text-lg font-semibold">Manage your booking</h1>
      <p className="mt-1 text-sm text-zinc-500">{booking.business.name}</p>

      <div className="mt-5 flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-zinc-100">{booking.service.name}</span>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
            {STATUS_LABEL[booking.status] ?? booking.status}
          </span>
        </div>
        <div className="flex flex-col gap-1.5 text-sm text-zinc-400">
          <span className="flex items-center gap-2">
            <CalendarCheck className="h-3.5 w-3.5 text-zinc-600" />
            {formatZonedDate(booking.starts_at, timeZone, { dateStyle: "full" })}
          </span>
          <span className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-zinc-600" />
            {formatZonedTime(booking.starts_at, timeZone)} · {booking.service.duration} min
            {booking.party_size > 1 ? ` · ${booking.party_size} guests` : ""}
          </span>
          <span className="flex items-center gap-2 text-xs text-zinc-600">
            <MapPin className="h-3.5 w-3.5" />
            Times shown in {timeZone}
          </span>
        </div>
        {total > 0 && (
          <div className="border-t border-zinc-800 pt-3 text-xs text-zinc-500">
            {deposit > 0 ? (
              <>
                Deposit {formatMoney(deposit, booking.business.currency)} · Balance{" "}
                {formatMoney(total - deposit, booking.business.currency)} at the appointment
              </>
            ) : (
              <>Price {formatMoney(total, booking.business.currency)}</>
            )}
          </div>
        )}
      </div>

      {canManage ? (
        <div className="mt-6">
          <ManageBookingPanel
            token={token}
            timeZone={timeZone}
            initialDate={initialDate}
            initialSlots={initialSlots}
            todayKey={todayKey}
            businessHours={`${booking.business.business_hours_start} – ${booking.business.business_hours_end}`}
          />
        </div>
      ) : (
        <p className="mt-6 flex items-start gap-2 border-t border-zinc-800 pt-5 text-sm text-zinc-400">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
          This booking is {STATUS_LABEL[booking.status]?.toLowerCase() ?? booking.status} and can no
          longer be changed online. Please contact the business if you need help.
        </p>
      )}

      <p className="mt-6 text-center text-xs text-zinc-600">
        Need a different service?{" "}
        <Link href={`/${booking.business.slug}`} className="text-emerald-400 hover:text-emerald-300">
          Book again
        </Link>
      </p>
    </Shell>
  );
}
