"use client";

import { useState } from "react";
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
  LayoutTemplate,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
        { label: "Notifications", href: "/superadmin/notifications", icon: Bell, badge: notifCount },
      ],
    },
    {
      label: "Platform",
      items: [
        { label: "Homepage", href: "/superadmin/homepage", icon: LayoutTemplate },
        { label: "Payments", href: "/superadmin/payments", icon: CreditCard },
        { label: "Settings", href: "/superadmin/settings", icon: Settings },
      ],
    },
  ];
}

function AdminLink({
  href,
  icon: Icon,
  label,
  exact,
  badge,
  collapsed,
}: NavItem & { collapsed: boolean }) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  const link = (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
        "hover:bg-zinc-800 hover:text-zinc-100",
        isActive ? "bg-zinc-800 text-zinc-100" : "text-zinc-400",
        collapsed && "justify-center px-2"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          isActive ? "text-violet-400" : "text-zinc-500"
        )}
      />
      {!collapsed && <span className="flex-1">{label}</span>}
      {!collapsed && badge != null && badge > 0 && (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-500 px-1 text-[10px] font-bold text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
      {!collapsed && isActive && (badge == null || badge === 0) && (
        <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
      )}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">
        {label}
        {badge != null && badge > 0 ? ` (${badge > 99 ? "99+" : badge})` : ""}
      </TooltipContent>
    </Tooltip>
  );
}

interface AdminSidebarProps {
  notifCount?: number;
}

export function AdminSidebar({ notifCount = 0 }: AdminSidebarProps) {
  const navSections = buildNavSections(notifCount);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex h-full shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 transition-[width]",
          collapsed ? "w-16" : "w-60"
        )}
      >
        <div
          className={cn(
            "flex h-14 items-center border-b border-zinc-800",
            collapsed ? "justify-center px-2" : "gap-2.5 px-4"
          )}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-500">
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-semibold text-zinc-100">Superadmin</p>
              <p className="text-[10px] text-zinc-500">Platform management</p>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <div className="flex flex-col gap-5">
            {navSections.map((section) => (
              <div key={section.label}>
                <p
                  className={cn(
                    "mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600",
                    collapsed && "sr-only"
                  )}
                >
                  {section.label}
                </p>
                <div className="flex flex-col gap-0.5">
                  {section.items.map((item) => (
                    <AdminLink key={item.href} {...item} collapsed={collapsed} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <div className="border-t border-zinc-800 p-2">
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className={cn(
              "flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100",
              collapsed ? "justify-center px-2" : "gap-3"
            )}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
