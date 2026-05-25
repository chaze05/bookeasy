import { format, formatDistanceToNow } from "date-fns";
import {
  Bell,
  Building2,
  UserPlus,
  CalendarCheck,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Notifications — Superadmin" };

export default async function SuperadminNotificationsPage() {
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    newBusinessesRaw,
    newUsersRaw,
    recentBookingsRaw,
    totalBusinesses,
    totalUsers,
    newBiz24h,
    newUsers24h,
  ] = await Promise.all([
    // Business sign-ups — last 30 days
    prisma.business.findMany({
      orderBy: { created_at: "desc" },
      take: 50,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        created_at: true,
        _count: { select: { services: true, staff: true } },
      },
    }),
    // User registrations — last 30 days
    prisma.profile.findMany({
      orderBy: { created_at: "desc" },
      take: 50,
      select: {
        id: true,
        full_name: true,
        role: true,
        created_at: true,
      },
    }),
    // Recent bookings — last 7 days
    prisma.booking.findMany({
      where: { created_at: { gte: since7d } },
      orderBy: { created_at: "desc" },
      take: 30,
      select: {
        id: true,
        customer_name: true,
        status: true,
        created_at: true,
        business: { select: { name: true } },
        service: { select: { name: true } },
      },
    }),
    prisma.business.count(),
    prisma.profile.count(),
    prisma.business.count({ where: { created_at: { gte: since24h } } }),
    prisma.profile.count({ where: { created_at: { gte: since24h } } }),
  ]);

  const newBusinesses = serialize(newBusinessesRaw) as typeof newBusinessesRaw;
  const newUsers = serialize(newUsersRaw) as typeof newUsersRaw;
  const recentBookings = serialize(recentBookingsRaw) as typeof recentBookingsRaw;

  const STATUS_BADGE: Record<string, "success" | "destructive" | "warning" | "outline"> = {
    active: "success",
    suspended: "destructive",
    pending: "warning",
  };

  const BOOKING_STATUS_ICON: Record<string, React.ElementType> = {
    confirmed: CheckCircle,
    completed: CheckCircle,
    cancelled: XCircle,
    pending: AlertCircle,
    no_show: XCircle,
  };

  const BOOKING_STATUS_COLOR: Record<string, string> = {
    confirmed: "text-emerald-400",
    completed: "text-blue-400",
    cancelled: "text-red-400",
    pending: "text-amber-400",
    no_show: "text-zinc-500",
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15">
          <Bell className="h-5 w-5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Notifications</h1>
          <p className="text-sm text-zinc-500">
            Platform activity — sign-ups, registrations, and bookings
          </p>
        </div>
      </div>

      {/* 24h summary pills */}
      <div className="flex flex-wrap gap-3">
        {[
          {
            label: "New businesses today",
            value: newBiz24h,
            icon: Building2,
            color: "violet",
          },
          {
            label: "New users today",
            value: newUsers24h,
            icon: UserPlus,
            color: "blue",
          },
          {
            label: "Total businesses",
            value: totalBusinesses,
            icon: Building2,
            color: "zinc",
          },
          {
            label: "Total users",
            value: totalUsers,
            icon: UserPlus,
            color: "zinc",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3"
          >
            <s.icon
              className={`h-4 w-4 ${s.color === "violet" ? "text-violet-400" : s.color === "blue" ? "text-blue-400" : "text-zinc-500"}`}
            />
            <div>
              <p className="text-lg font-bold text-zinc-100">{s.value}</p>
              <p className="text-xs text-zinc-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Three-column activity feed */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Business Sign-ups ── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-zinc-100">Business Sign-ups</h2>
            <span className="ml-auto rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
              {newBusinesses.length}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {newBusinesses.length === 0 ? (
              <EmptyState label="No businesses registered yet" />
            ) : (
              newBusinesses.map((b) => {
                const isNew = new Date(b.created_at) >= since24h;
                return (
                  <div
                    key={b.id}
                    className="relative flex flex-col gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 p-3.5"
                  >
                    {isNew && (
                      <span className="absolute right-3 top-3 rounded-full bg-violet-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-400">
                        New
                      </span>
                    )}
                    <div className="flex items-center gap-2 pr-10">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-xs font-bold text-violet-300">
                        {b.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-100">{b.name}</p>
                        <p className="text-[10px] text-zinc-500">/{b.slug}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge variant={STATUS_BADGE[b.status] ?? "outline"} className="text-[10px]">
                        {b.status}
                      </Badge>
                      <p className="text-[10px] text-zinc-600">
                        {b._count.services} svc · {b._count.staff} staff
                      </p>
                    </div>

                    <Timestamp ts={b.created_at} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── User Registrations ── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-zinc-100">User Registrations</h2>
            <span className="ml-auto rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
              {newUsers.length}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {newUsers.length === 0 ? (
              <EmptyState label="No users registered yet" />
            ) : (
              newUsers.map((u) => {
                const isNew = new Date(u.created_at) >= since24h;
                const initial = u.full_name
                  ? u.full_name.slice(0, 1).toUpperCase()
                  : u.id.slice(0, 1).toUpperCase();

                return (
                  <div
                    key={u.id}
                    className="relative flex flex-col gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 p-3.5"
                  >
                    {isNew && (
                      <span className="absolute right-3 top-3 rounded-full bg-blue-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-400">
                        New
                      </span>
                    )}
                    <div className="flex items-center gap-2 pr-10">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-xs font-bold text-blue-300">
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-100">
                          {u.full_name ?? "—"}
                        </p>
                        <p className="text-[10px] capitalize text-zinc-500">{u.role}</p>
                      </div>
                    </div>
                    <Timestamp ts={u.created_at} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Recent Bookings ── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-zinc-100">Recent Bookings</h2>
            <span className="ml-auto rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
              {recentBookings.length}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {recentBookings.length === 0 ? (
              <EmptyState label="No bookings in the last 7 days" />
            ) : (
              recentBookings.map((b) => {
                const StatusIcon = BOOKING_STATUS_ICON[b.status] ?? AlertCircle;
                const statusColor = BOOKING_STATUS_COLOR[b.status] ?? "text-zinc-500";
                return (
                  <div
                    key={b.id}
                    className="flex flex-col gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 p-3.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-100">
                          {b.customer_name}
                        </p>
                        <p className="truncate text-[10px] text-zinc-500">
                          {b.service.name} · {b.business.name}
                        </p>
                      </div>
                      <StatusIcon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${statusColor}`} />
                    </div>
                    <Timestamp ts={b.created_at} />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Timestamp({ ts }: { ts: string | Date }) {
  const date = new Date(ts);
  return (
    <p className="flex items-center gap-1 text-[10px] text-zinc-600">
      <Clock className="h-2.5 w-2.5" />
      <span title={format(date, "PPpp")}>
        {formatDistanceToNow(date, { addSuffix: true })}
      </span>
    </p>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 py-8 text-center">
      <p className="text-xs text-zinc-600">{label}</p>
    </div>
  );
}
