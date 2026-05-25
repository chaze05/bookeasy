"use client";

import Link from "next/link";
import { LogOut, Bell } from "lucide-react";
import { createClient } from "@/supabase/client";

interface AdminHeaderProps {
  userName: string | null;
  userEmail: string | undefined;
  userAvatar: string | null;
  notifCount?: number;
}

export function AdminHeader({
  userName,
  userEmail,
  userAvatar,
  notifCount = 0,
}: AdminHeaderProps) {
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut({ scope: "local" });
    window.location.assign("/login");
  }

  const displayName = userName ?? userEmail ?? "Admin";
  const initial = displayName.slice(0, 1).toUpperCase();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6">
      <div />

      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <Link
          href="/superadmin/notifications"
          className="relative flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
        >
          <Bell className="h-4 w-4" />
          {notifCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-500 px-1 text-[9px] font-bold text-white">
              {notifCount > 99 ? "99+" : notifCount}
            </span>
          )}
        </Link>

        <div className="h-5 w-px bg-zinc-800" />

        {/* Avatar */}
        {userAvatar ? (
          <img
            src={userAvatar}
            alt=""
            className="h-7 w-7 rounded-full ring-2 ring-violet-500/30"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-300 ring-1 ring-violet-500/30">
            {initial}
          </div>
        )}

        {/* Name */}
        <div className="hidden text-right sm:block">
          <p className="text-xs font-medium leading-none text-zinc-200">{displayName}</p>
          <p className="mt-0.5 text-[10px] text-zinc-500">Platform Administrator</p>
        </div>

        <div className="h-5 w-px bg-zinc-800" />

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </header>
  );
}
