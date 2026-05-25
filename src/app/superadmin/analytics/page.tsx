import {
  TrendingUp,
  CalendarCheck,
  DollarSign,
  Building2,
  Users,
  ArrowUp,
} from "lucide-react";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Analytics — Superadmin" };

export default async function SuperadminAnalyticsPage() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOf30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const startOf7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfPrev30 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [
    totalBookings,
    bookingsLast30,
    bookingsPrev30,
    bookingsLast7,
    totalRevenue30Raw,
    totalUsers,
    usersLast30,
    totalBusinesses,
    businessesLast30,
    statusBreakdown,
    topBusinessesRaw,
  ] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.count({ where: { created_at: { gte: startOf30Days } } }),
    prisma.booking.count({ where: { created_at: { gte: startOfPrev30, lt: startOf30Days } } }),
    prisma.booking.count({ where: { created_at: { gte: startOf7Days } } }),
    prisma.booking.findMany({
      where: { created_at: { gte: startOf30Days }, status: { in: ["confirmed", "completed"] } },
      include: { service: { select: { price: true } } },
    }),
    prisma.profile.count(),
    prisma.profile.count({ where: { created_at: { gte: startOf30Days } } }),
    prisma.business.count(),
    prisma.business.count({ where: { created_at: { gte: startOf30Days } } }),
    prisma.booking.groupBy({ by: ["status"], _count: { id: true } }),
    prisma.booking.groupBy({
      by: ["business_id"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
  ]);

  const revenue30 = totalRevenue30Raw.reduce(
    (sum, b) => sum + Number(b.service.price),
    0
  );

  const bookingGrowth = bookingsPrev30 > 0
    ? Math.round(((bookingsLast30 - bookingsPrev30) / bookingsPrev30) * 100)
    : 100;

  // Fetch business names for top businesses
  const topBusinessIds = topBusinessesRaw.map((b) => b.business_id);
  const topBusinessNames = await prisma.business.findMany({
    where: { id: { in: topBusinessIds } },
    select: { id: true, name: true, slug: true },
  });
  const nameMap = new Map(topBusinessNames.map((b) => [b.id, b]));

  const statusMap: Record<string, number> = {};
  for (const s of statusBreakdown) statusMap[s.status] = s._count.id;

  const statCards = [
    {
      title: "Bookings (30d)",
      value: bookingsLast30.toLocaleString(),
      sub: `${bookingGrowth >= 0 ? "+" : ""}${bookingGrowth}% vs prior 30d`,
      positive: bookingGrowth >= 0,
      icon: CalendarCheck,
      accent: "emerald",
    },
    {
      title: "Revenue (30d)",
      value: `$${revenue30.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: "Confirmed & completed",
      positive: true,
      icon: DollarSign,
      accent: "violet",
    },
    {
      title: "New Users (30d)",
      value: usersLast30.toLocaleString(),
      sub: `${totalUsers.toLocaleString()} total`,
      positive: true,
      icon: Users,
      accent: "blue",
    },
    {
      title: "New Businesses (30d)",
      value: businessesLast30.toLocaleString(),
      sub: `${totalBusinesses.toLocaleString()} total`,
      positive: true,
      icon: Building2,
      accent: "amber",
    },
  ];

  const accentMap: Record<string, string> = {
    emerald: "text-emerald-400 bg-emerald-500/10",
    violet: "text-violet-400 bg-violet-500/10",
    blue: "text-blue-400 bg-blue-500/10",
    amber: "text-amber-400 bg-amber-500/10",
  };

  const statusColors: Record<string, string> = {
    confirmed: "bg-emerald-500",
    completed: "bg-blue-500",
    pending: "bg-amber-500",
    cancelled: "bg-red-500",
    no_show: "bg-zinc-500",
  };

  const totalStatusCount = Object.values(statusMap).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Analytics</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Platform performance — last 30 days
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          const cls = accentMap[s.accent] ?? "text-zinc-400 bg-zinc-700/30";
          return (
            <div
              key={s.title}
              className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-500">{s.title}</p>
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${cls}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-100">{s.value}</p>
                <p className={`mt-1 flex items-center gap-1 text-xs ${s.positive ? "text-emerald-400" : "text-red-400"}`}>
                  <ArrowUp className={`h-3 w-3 ${s.positive ? "" : "rotate-180"}`} />
                  {s.sub}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Booking status breakdown */}
        <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-semibold text-zinc-100">Booking Status Breakdown</h2>
          </div>
          <div className="flex flex-col gap-2.5">
            {Object.entries(statusColors).map(([status, color]) => {
              const count = statusMap[status] ?? 0;
              const pct = Math.round((count / totalStatusCount) * 100);
              return (
                <div key={status} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="capitalize text-zinc-400">{status.replace("_", " ")}</span>
                    <span className="font-medium text-zinc-200">{count} <span className="text-zinc-600">({pct}%)</span></span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-zinc-800">
                    <div
                      className={`h-1.5 rounded-full ${color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top businesses */}
        <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-semibold text-zinc-100">Top Businesses by Bookings</h2>
          </div>
          <div className="flex flex-col gap-2">
            {topBusinessesRaw.map((b, i) => {
              const biz = nameMap.get(b.business_id);
              const maxCount = topBusinessesRaw[0]._count.id;
              const pct = Math.round((b._count.id / maxCount) * 100);
              return (
                <div key={b.business_id} className="flex items-center gap-3">
                  <span className="w-4 text-right text-xs font-bold text-zinc-600">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-zinc-200">{biz?.name ?? "Unknown"}</span>
                      <span className="text-zinc-500">{b._count.id} bookings</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-zinc-800">
                      <div
                        className="h-1.5 rounded-full bg-violet-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            {topBusinessesRaw.length === 0 && (
              <p className="text-sm text-zinc-500 py-6 text-center">No booking data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Summary row */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Total Bookings (all time)", value: totalBookings.toLocaleString() },
          { label: "Bookings this week", value: bookingsLast7.toLocaleString() },
          { label: "Total registered users", value: totalUsers.toLocaleString() },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4"
          >
            <p className="text-2xl font-bold text-zinc-100">{s.value}</p>
            <p className="mt-1 text-xs text-zinc-500">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
