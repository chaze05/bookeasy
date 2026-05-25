import {
  Building2,
  CheckCircle,
  XCircle,
  Users,
  CalendarCheck,
  DollarSign,
  TrendingUp,
  Activity,
} from "lucide-react";
import { getAdminStats } from "@/actions/superadmin";
import { StatCard } from "@/components/dashboard/stat-card";

export const metadata = { title: "Superadmin Dashboard" };

export default async function SuperadminPage() {
  let stats;
  try {
    stats = await getAdminStats();
  } catch {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-sm text-red-400">
          You do not have superadmin access.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Platform Overview</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Real-time metrics across all businesses on BookEasy.
        </p>
      </div>

      {/* Top stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Businesses"   value={stats.totalBusinesses}   icon={<Building2   className="h-5 w-5" />} accent="violet"  delay={0} />
        <StatCard title="Active Businesses"  value={stats.activeBusinesses}  icon={<CheckCircle className="h-5 w-5" />} accent="emerald" delay={0.05} />
        <StatCard title="Suspended"          value={stats.suspendedBusinesses} icon={<XCircle   className="h-5 w-5" />} accent="amber"   delay={0.1} />
        <StatCard title="Total Users"        value={stats.totalUsers}        icon={<Users       className="h-5 w-5" />} accent="blue"    delay={0.15} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Bookings"      value={stats.totalBookings.toLocaleString()} icon={<CalendarCheck className="h-5 w-5" />} accent="emerald" delay={0.2} />
        <StatCard title="Platform Revenue"    value={`$${stats.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={<DollarSign className="h-5 w-5" />} accent="emerald" delay={0.25} />
        <StatCard title="New Businesses Today" value={stats.newBusinessesToday} icon={<TrendingUp className="h-5 w-5" />} accent="violet" delay={0.3} />
        <StatCard title="New Bookings Today"  value={stats.newBookingsToday}  icon={<Activity    className="h-5 w-5" />} accent="blue"    delay={0.35} />
      </div>
    </div>
  );
}
