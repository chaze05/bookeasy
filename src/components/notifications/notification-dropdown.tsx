"use client";

import { Bell, CheckCheck, Calendar, XCircle, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Notification, NotificationType } from "@/types";

const TYPE_ICONS: Record<NotificationType, React.ElementType> = {
  new_booking: Calendar,
  cancelled: XCircle,
  slot_full: AlertCircle,
  system: Bell,
};

const TYPE_COLORS: Record<NotificationType, string> = {
  new_booking: "text-emerald-400",
  cancelled: "text-red-400",
  slot_full: "text-amber-400",
  system: "text-blue-400",
};

interface NotificationDropdownProps {
  userId: string;
}

export function NotificationDropdown({ userId }: NotificationDropdownProps) {
  const { notifications, unreadCount, markRead, markAllRead } =
    useNotifications(userId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-zinc-400 hover:text-zinc-100"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 bg-zinc-900 border-zinc-800 p-0"
      >
        <div className="flex items-center justify-between px-3 py-2.5">
          <DropdownMenuLabel className="p-0 text-sm font-semibold text-zinc-100">
            Notifications
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllRead}
              className="h-auto p-0 text-xs text-zinc-500 hover:text-emerald-400"
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>

        <DropdownMenuSeparator className="bg-zinc-800" />

        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Bell className="h-8 w-8 text-zinc-700" />
              <p className="text-sm text-zinc-500">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <NotificationItem key={n.id} notification={n} onRead={markRead} />
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: (id: string) => void;
}) {
  const Icon = TYPE_ICONS[notification.type] ?? Bell;
  const colorClass = TYPE_COLORS[notification.type] ?? "text-zinc-400";
  const isUnread = !notification.read_at;

  return (
    <button
      className={`flex w-full gap-3 px-3 py-3 text-left transition-colors hover:bg-zinc-800/60 focus:outline-none ${
        isUnread ? "bg-zinc-800/30" : ""
      }`}
      onClick={() => isUnread && onRead(notification.id)}
    >
      <span className={`mt-0.5 shrink-0 ${colorClass}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center justify-between gap-2">
          <span
            className={`text-sm font-medium truncate block ${
              isUnread ? "text-zinc-100" : "text-zinc-400"
            }`}
          >
            {notification.title}
          </span>
          {isUnread && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
          )}
        </span>
        <span className="mt-0.5 text-xs text-zinc-500 line-clamp-1 block">
          {notification.message}
        </span>
        <span className="mt-1 text-[10px] text-zinc-600 block">
          {formatDistanceToNow(new Date(notification.created_at), {
            addSuffix: true,
          })}
        </span>
      </span>
    </button>
  );
}
