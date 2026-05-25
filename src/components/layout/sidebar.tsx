"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Briefcase,
  Settings,
  CalendarCheck,
  BarChart3,
  Scissors,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

const navItems = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Bookings",
    href: "/dashboard/bookings",
    icon: CalendarCheck,
  },
  {
    label: "Calendar",
    href: "/dashboard/calendar",
    icon: CalendarDays,
  },
  {
    label: "Services",
    href: "/dashboard/services",
    icon: Scissors,
  },
  {
    label: "Staff",
    href: "/dashboard/staff",
    icon: Users,
  },
  {
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
];

const bottomItems = [
  {
    label: "Business",
    href: "/dashboard/business",
    icon: Briefcase,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

interface SidebarLinkProps {
  href: string;
  icon: React.ElementType;
  label: string;
  exact?: boolean;
  collapsed?: boolean;
}

function SidebarLink({
  href,
  icon: Icon,
  label,
  exact,
  collapsed,
}: SidebarLinkProps) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  const link = (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
        "hover:bg-zinc-800 hover:text-zinc-100",
        isActive
          ? "bg-zinc-800 text-zinc-100"
          : "text-zinc-400",
        collapsed && "justify-center px-2"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          isActive ? "text-emerald-400" : "text-zinc-500 group-hover:text-zinc-300"
        )}
      />
      {!collapsed && <span>{label}</span>}
      {isActive && !collapsed && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

interface SidebarProps {
  collapsed?: boolean;
  onClose?: () => void;
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex h-full flex-col border-r border-zinc-800 bg-zinc-950",
          collapsed ? "w-14" : "w-60"
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex h-14 items-center border-b border-zinc-800",
            collapsed ? "justify-center px-2" : "gap-2.5 px-4"
          )}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500">
            <CalendarCheck className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <span className="text-sm font-semibold text-zinc-100">
              BookEasy
            </span>
          )}
        </div>

        {/* Nav */}
        <ScrollArea className="flex-1 px-2 py-3">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <SidebarLink
                key={item.href}
                {...item}
                collapsed={collapsed}
              />
            ))}
          </nav>
        </ScrollArea>

        {/* Bottom items */}
        <div className="border-t border-zinc-800 px-2 py-3">
          <nav className="flex flex-col gap-1">
            {bottomItems.map((item) => (
              <SidebarLink
                key={item.href}
                {...item}
                collapsed={collapsed}
              />
            ))}
          </nav>
        </div>
      </aside>
    </TooltipProvider>
  );
}
