"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

const navItems = [
  { label: "Dashboard", href: "/superadmin", icon: LayoutDashboard, exact: true },
  { label: "Businesses", href: "/superadmin/businesses", icon: Building2 },
  { label: "Users", href: "/superadmin/users", icon: Users },
];

function AdminLink({
  href,
  icon: Icon,
  label,
  exact,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
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
          <span>{label}</span>
          {isActive && (
            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-400" />
          )}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

export function AdminSidebar() {
  return (
    <TooltipProvider delayDuration={0}>
      <aside className="flex h-full w-60 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950">
        {/* Header */}
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
        <nav className="flex-1 px-2 py-3">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => (
              <AdminLink key={item.href} {...item} />
            ))}
          </div>
        </nav>

        {/* Back to dashboard */}
        <div className="border-t border-zinc-800 px-2 py-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 transition-all hover:bg-zinc-800 hover:text-zinc-300"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Back to Dashboard
          </Link>
        </div>
      </aside>
    </TooltipProvider>
  );
}
