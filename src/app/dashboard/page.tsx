import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { CalendarCheck, DollarSign, Users, CalendarDays } from "lucide-react";
import { createClient } from "@/supabase/server";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";
import { StatCard } from "@/components/dashboard/stat-card";
import { RecentBookings } from "@/components/dashboard/recent-bookings";
import { TodaySchedule } from "@/components/dashboard/today-schedule";
import { BookingUrlBanner } from "@/components/dashboard/booking-url-banner";
import type { BookingWithRelations } from "@/types";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const business = await prisma.business.findFirst({
    where: { owner_id: user.id },
    select: { id: true, name: true, slug: true },
  });

  if (!business) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15">
          <CalendarCheck className="h-7 w-7 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Welcome to BookEasy</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Let&apos;s set up your business to get started.
          </p>
        </div>
      </div>
    );
  }

  const businessId = business.id;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalBookings,
    todayBookings,
    weekBookings,
    todayRaw,
    recentRaw,
    activeStaff,
  ] = await Promise.all([
    prisma.booking.count({
      where: { business_id: businessId, status: { not: "cancelled" } },
    }),
    prisma.booking.count({
      where: {
        business_id: businessId,
        starts_at: { gte: startOfToday },
        status: { not: "cancelled" },
      },
    }),
    prisma.booking.findMany({
      where: {
        business_id: businessId,
        starts_at: { gte: startOfWeek },
        status: "confirmed",
      },
      include: { service: { select: { price: true } } },
    }),
    prisma.booking.findMany({
      where: {
        business_id: businessId,
        starts_at: { gte: startOfToday, lte: endOfToday },
        status: { not: "cancelled" },
      },
      orderBy: { starts_at: "asc" },
      include: {
        service: { select: { name: true, duration: true, price: true, color: true } },
        staff: { select: { full_name: true, avatar_url: true } },
      },
    }),
    prisma.booking.findMany({
      where: { business_id: businessId },
      orderBy: { created_at: "desc" },
      take: 8,
      include: {
        service: { select: { name: true, duration: true, price: true, color: true } },
        staff: { select: { full_name: true, avatar_url: true } },
      },
    }),
    prisma.staff.count({
      where: { business_id: businessId, is_active: true },
    }),
  ]);

  const weekRevenue = weekBookings.reduce(
    (sum: number, b: { service: { price: unknown } }) => sum + Number(b.service.price),
    0
  );

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") ? "http" : "https";
  const bookingUrl = `${proto}://${host}/${business.slug}`;

  const todayBookingsList = serialize(todayRaw) as unknown as BookingWithRelations[];
  const recentBookings = serialize(recentRaw) as unknown as BookingWithRelations[];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-zinc-100">{business.name}</h1>
        <p className="text-sm text-zinc-500">Here&apos;s what&apos;s happening today.</p>
      </div>

      <BookingUrlBanner url={bookingUrl} slug={business.slug} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Today's Bookings"  value={todayBookings}                icon={<CalendarCheck className="h-5 w-5" />} accent="emerald" delay={0} />
        <StatCard title="Total Bookings"    value={totalBookings}                icon={<CalendarDays  className="h-5 w-5" />} accent="blue"    delay={0.05} />
        <StatCard title="Week Revenue"      value={`$${weekRevenue.toFixed(2)}`} icon={<DollarSign   className="h-5 w-5" />} accent="violet"  delay={0.1} />
        <StatCard title="Active Staff"      value={activeStaff}                  icon={<Users        className="h-5 w-5" />} accent="amber"   delay={0.15} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <TodaySchedule bookings={todayBookingsList} />
        <RecentBookings bookings={recentBookings} />
      </div>
    </div>
  );
}
