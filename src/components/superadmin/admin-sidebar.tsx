"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  CalendarCheck,
  CreditCard,
  BarChart3,
  Settings,
  ShieldCheck,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  exact?: boolean;
  badge?: number;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

function buildNavSections(notifCount: number): NavSection[] {
  return [
    {
      label: "Overview",
      items: [
        { label: "Dashboard", href: "/superadmin", icon: LayoutDashboard, exact: true },
        { label: "Analytics", href: "/superadmin/analytics", icon: BarChart3 },
      ],
    },
    {
      label: "Management",
      items: [
        { label: "Businesses", href: "/superadmin/businesses", icon: Building2 },
        { label: "Users", href: "/superadmin/users", icon: Users },
        { label: "Bookings", href: "/superadmin/bookings", icon: CalendarCheck },
        {
          label: "Notifications",
          href: "/superadmin/notifications",
          icon: Bell,
          badge: notifCount,
        },
      ],
    },
    {
      label: "Platform",
      items: [
        { label: "Payments", href: "/superadmin/payments", icon: CreditCard },
        { label: "Settings", href: "/superadmin/settings", icon: Settings },
      ],
    },
  ];
}

function AdminLink({ href, icon: Icon, label, exact, badge }: NavItem) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
        "hover:bg-zinc-800 hover:text-zinc-100",
        isActive ? "bg-zinc-800 text-zinc-100" : "text-zinc-400"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          isActive ? "text-violet-400" : "text-zinc-500"
        )}
      />
      <span className="flex-1">{label}</span>

      {/* Badge — new activity count */}
      {badge != null && badge > 0 && (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-500 px-1 text-[10px] font-bold text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      )}

      {/* Active dot (only when no badge) */}
      {isActive && (badge == null || badge === 0) && (
        <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
      )}
    </Link>
  );
}

interface AdminSidebarProps {
  notifCount?: number;
}

export function AdminSidebar({ notifCount = 0 }: AdminSidebarProps) {
  const navSections = buildNavSections(notifCount);

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2.5 border-b border-zinc-800 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500">
          <ShieldCheck className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-zinc-100">Superadmin</p>
          <p className="text-[10px] text-zinc-500">Platform management</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <div className="flex flex-col gap-5">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                {section.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => (
                  <AdminLink key={item.href} {...item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </aside>
  );
}
