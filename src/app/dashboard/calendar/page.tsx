import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";
import { WeekCalendar } from "./week-calendar";
import type { BookingWithRelations } from "@/types";

export const metadata = { title: "Calendar" };

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const business = await prisma.business.findFirst({
    where: { owner_id: user.id },
    select: { id: true },
  });

  let bookings: BookingWithRelations[] = [];

  if (business) {
    const from = new Date();
    from.setDate(from.getDate() - 30);
    const to = new Date();
    to.setDate(to.getDate() + 60);

    const raw = await prisma.booking.findMany({
      where: {
        business_id: business.id,
        starts_at: { gte: from, lte: to },
        status: { not: "cancelled" },
      },
      orderBy: { starts_at: "asc" },
      include: {
        service: { select: { name: true, duration: true, price: true, color: true } },
        staff: { select: { full_name: true, avatar_url: true } },
      },
    });
    bookings = serialize(raw) as unknown as BookingWithRelations[];
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Calendar</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Week-by-week view of your appointments.
        </p>
      </div>
      <WeekCalendar bookings={bookings} />
    </div>
  );
}
