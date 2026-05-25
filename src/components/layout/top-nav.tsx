"use client";

import { Search, LogOut, User, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";

interface TopNavProps {
  userId: string;
  userEmail?: string | null;
  userAvatar?: string | null;
  userName?: string | null;
  businessName?: string | null;
}

export function TopNav({
  userId,
  userEmail,
  userAvatar,
  userName,
  businessName,
}: TopNavProps) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    router.push("/login");
    router.refresh();
  }

  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : userEmail?.slice(0, 2).toUpperCase() ?? "?";

  return (
    <header className="flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 lg:px-6">
      {/* Left: business name */}
      <div className="flex items-center gap-2">
        {businessName && (
          <div className="flex items-center gap-1.5">
            <Building2 className="h-4 w-4 text-zinc-500" />
            <span className="text-sm font-medium text-zinc-300">
              {businessName}
            </span>
          </div>
        )}
      </div>

      {/* Right: actions + user menu */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-zinc-400 hover:text-zinc-100"
        >
          <Search className="h-4 w-4" />
        </Button>

        <NotificationDropdown userId={userId} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-7 w-7">
                {userAvatar && (
                  <AvatarImage src={userAvatar} alt={userName ?? ""} />
                )}
                <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-zinc-900 border-zinc-800"
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                {userName && (
                  <p className="text-sm font-medium text-zinc-100">
                    {userName}
                  </p>
                )}
                <p className="text-xs text-zinc-500">{userEmail}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem
              className="gap-2 text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
              onClick={() => router.push("/dashboard/settings")}
            >
              <User className="h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem
              className="gap-2 text-red-400 focus:bg-red-950/50 focus:text-red-300"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
