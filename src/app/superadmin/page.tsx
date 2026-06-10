import {
  Building2, CheckCircle, XCircle, Users, CalendarCheck, DollarSign, TrendingUp, Activity,
} from "lucide-react";
import { getSuperadminDashboardData } from "@/actions/superadmin";
import { StatCard } from "@/components/dashboard/stat-card";
import { PendingPaymentsPanel } from "@/components/superadmin/pending-payments-panel";
import { RecentBusinessesWidget } from "@/components/superadmin/recent-businesses-widget";
import { RecentBookingsWidget } from "@/components/superadmin/recent-bookings-widget";

export const metadata = { title: "Superadmin Dashboard" };

export default async function SuperadminPage() {
  let data;
  try {
    data = await getSuperadminDashboardData();
  } catch {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-sm text-red-400">You do not have superadmin access.</p>
      </div>
    );
  }

  const { stats, recentBusinesses, recentBookings, pendingPayments } = data as any;

  return (
    <div className="flex flex-col gap-10 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">Platform Overview</h1>
          <p className="mt-1.5 text-sm text-zinc-400">Real-time metrics and administration across BookEasy.</p>
        </div>
        <div className="text-sm text-zinc-400 font-medium bg-zinc-900/60 px-4 py-2.5 rounded-xl border border-zinc-800/80 shadow-sm backdrop-blur-sm">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Top stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Businesses"   value={stats.totalBusinesses}   icon={<Building2   className="h-5 w-5" />} accent="violet"  delay={0} />
        <StatCard title="Active Businesses"  value={stats.activeBusinesses}  icon={<CheckCircle className="h-5 w-5" />} accent="emerald" delay={0.05} />
        <StatCard title="Suspended"          value={stats.suspendedBusinesses} icon={<XCircle   className="h-5 w-5" />} accent="amber"   delay={0.1} />
        <StatCard title="Total Users"        value={stats.totalUsers}        icon={<Users       className="h-5 w-5" />} accent="blue"    delay={0.15} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 -mt-4">
        <StatCard title="Total Bookings"      value={stats.totalBookings.toLocaleString()} icon={<CalendarCheck className="h-5 w-5" />} accent="emerald" delay={0.2} />
        <StatCard title="Platform Revenue"    value={`$${stats.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={<DollarSign className="h-5 w-5" />} accent="emerald" delay={0.25} />
        <StatCard title="New Businesses Today" value={stats.newBusinessesToday} icon={<TrendingUp className="h-5 w-5" />} accent="violet" delay={0.3} />
        <StatCard title="New Bookings Today"  value={stats.newBookingsToday}  icon={<Activity    className="h-5 w-5" />} accent="blue"    delay={0.35} />
      </div>
      
      <hr className="border-zinc-800/60" />
      
      {/* Split Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 xl:col-span-8">
          <PendingPaymentsPanel payments={pendingPayments} />
        </div>
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
          <RecentBusinessesWidget businesses={recentBusinesses} />
          <RecentBookingsWidget bookings={recentBookings} />
        </div>
      </div>
    </div>
  );
}
