import { redirect } from "next/navigation";
import { BarChart3, TrendingUp, Users, DollarSign, CalendarCheck, Percent } from "lucide-react";
import { createClient } from "@/supabase/server";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/dashboard/stat-card";

export const metadata = { title: "Analytics" };

interface TopService {
  name: string;
  count: number;
  revenue: number;
  color: string;
}

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const business = await prisma.business.findFirst({
    where: { owner_id: user.id },
    select: { id: true },
  });

  if (!business) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <BarChart3 className="h-10 w-10 text-zinc-700" />
        <p className="text-sm text-zinc-500">Set up your business to see analytics.</p>
      </div>
    );
  }

  const businessId = business.id;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [
    totalBookings,
    monthBookings,
    lastMonthBookings,
    cancelledMonth,
    confirmedMonthData,
    lastMonthRevenueData,
    allBookingsForTopServices,
    uniqueCustomersGroups,
  ] = await Promise.all([
    prisma.booking.count({
      where: { business_id: businessId, status: { not: "cancelled" } },
    }),
    prisma.booking.count({
      where: { business_id: businessId, starts_at: { gte: startOfMonth }, status: { not: "cancelled" } },
    }),
    prisma.booking.count({
      where: { business_id: businessId, starts_at: { gte: startOfLastMonth, lte: endOfLastMonth }, status: { not: "cancelled" } },
    }),
    prisma.booking.count({
      where: { business_id: businessId, starts_at: { gte: startOfMonth }, status: "cancelled" },
    }),
    prisma.booking.findMany({
      where: { business_id: businessId, starts_at: { gte: startOfMonth }, status: "confirmed" },
      include: { service: { select: { price: true } } },
    }),
    prisma.booking.findMany({
      where: { business_id: businessId, starts_at: { gte: startOfLastMonth, lte: endOfLastMonth }, status: "confirmed" },
      include: { service: { select: { price: true } } },
    }),
    prisma.booking.findMany({
      where: { business_id: businessId, status: { not: "cancelled" } },
      select: { service_id: true, service: { select: { name: true, color: true, price: true } } },
    }),
    prisma.booking.groupBy({
      by: ["customer_email"],
      where: { business_id: businessId, status: { not: "cancelled" } },
    }),
  ]);

  const monthRevenue = confirmedMonthData.reduce(
    (sum: number, b: { service: { price: unknown } }) => sum + Number(b.service.price),
    0
  );
  const lastMonthRevenue = lastMonthRevenueData.reduce(
    (sum: number, b: { service: { price: unknown } }) => sum + Number(b.service.price),
    0
  );

  const revenueTrend =
    lastMonthRevenue > 0
      ? Math.round(((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : 0;
  const bookingTrend =
    lastMonthBookings > 0
      ? Math.round(((monthBookings - lastMonthBookings) / lastMonthBookings) * 100)
      : 0;

  const totalThisMonth = monthBookings + cancelledMonth;
  const completionRate =
    totalThisMonth > 0 ? Math.round((monthBookings / totalThisMonth) * 100) : 100;

  const uniqueCustomers = uniqueCustomersGroups.length;

  // Build top services map
  const serviceMap = new Map<string, TopService>();
  for (const b of allBookingsForTopServices) {
    const key = b.service_id;
    const existing = serviceMap.get(key) ?? {
      name: b.service.name,
      count: 0,
      revenue: 0,
      color: b.service.color,
    };
    existing.count++;
    existing.revenue += Number(b.service.price);
    serviceMap.set(key, existing);
  }

  const topServices = Array.from(serviceMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const maxCount = topServices[0]?.count ?? 1;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Analytics</h1>
        <p className="mt-1 text-sm text-zinc-500">Performance overview for this month.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="This Month's Bookings" value={monthBookings} icon={<CalendarCheck className="h-5 w-5" />} trend={bookingTrend} trendLabel="vs last month" accent="emerald" delay={0} />
        <StatCard title="Monthly Revenue" value={`$${monthRevenue.toFixed(0)}`} icon={<DollarSign className="h-5 w-5" />} trend={revenueTrend} trendLabel="vs last month" accent="violet" delay={0.05} />
        <StatCard title="Total Customers" value={uniqueCustomers} icon={<Users className="h-5 w-5" />} accent="blue" delay={0.1} />
        <StatCard title="Completion Rate" value={`${completionRate}%`} icon={<Percent className="h-5 w-5" />} accent="amber" delay={0.15} />
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-2 border-b border-zinc-800 px-5 py-4">
          <TrendingUp className="h-4 w-4 text-zinc-500" />
          <h2 className="text-sm font-semibold text-zinc-100">Top Services</h2>
          <span className="ml-auto text-xs text-zinc-500">All time</span>
        </div>

        {topServices.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <BarChart3 className="h-8 w-8 text-zinc-700" />
            <p className="text-sm text-zinc-500">No data yet</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {topServices.map((svc, i) => (
              <div key={svc.name} className="flex items-center gap-4 px-5 py-4">
                <span className="w-5 text-xs font-semibold text-zinc-600">#{i + 1}</span>
                <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: svc.color }} />
                <span className="flex-1 text-sm text-zinc-100">{svc.name}</span>
                <div className="flex items-center gap-6 text-xs text-zinc-500">
                  <span>{svc.count} booking{svc.count !== 1 ? "s" : ""}</span>
                  <span className="text-emerald-400">${svc.revenue.toFixed(0)}</span>
                </div>
                <div className="hidden sm:block w-24 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(svc.count / maxCount) * 100}%`, backgroundColor: svc.color }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Confirmed this month", value: monthBookings, color: "text-emerald-400" },
          { label: "Cancelled this month", value: cancelledMonth, color: "text-red-400" },
          { label: "All-time bookings", value: totalBookings, color: "text-zinc-100" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-xs uppercase tracking-wide text-zinc-500">{item.label}</p>
            <p className={`mt-2 text-3xl font-bold ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
