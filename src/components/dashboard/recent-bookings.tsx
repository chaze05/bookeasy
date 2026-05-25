"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { CalendarClock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { BookingWithRelations, BookingStatus } from "@/types";

const statusVariant: Record<BookingStatus, "success" | "warning" | "destructive" | "secondary" | "outline"> = {
  confirmed: "success",
  pending: "warning",
  cancelled: "destructive",
  no_show: "secondary",
  completed: "outline",
};

interface RecentBookingsProps {
  bookings: BookingWithRelations[];
}

export function RecentBookings({ bookings }: RecentBookingsProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-zinc-500" />
          <h2 className="text-sm font-semibold text-zinc-100">Recent Bookings</h2>
        </div>
        <Link
          href="/dashboard/bookings"
          className="flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {bookings.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <CalendarClock className="h-8 w-8 text-zinc-700" />
          <p className="text-sm text-zinc-500">No bookings yet</p>
          <p className="text-xs text-zinc-600">Share your booking link to get started</p>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-800">
          {bookings.map((booking, i) => (
            <motion.li
              key={booking.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-zinc-800/50"
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback
                  className="text-xs font-medium"
                  style={{ backgroundColor: booking.service.color + "20", color: booking.service.color }}
                >
                  {booking.customer_name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="truncate text-sm font-medium text-zinc-100">
                  {booking.customer_name}
                </p>
                <p className="truncate text-xs text-zinc-500">
                  {booking.customer_email}
                </p>
                <p className="truncate text-xs text-zinc-600">
                  {booking.service.name} · {booking.service.duration} min
                  {booking.staff ? ` · ${booking.staff.full_name}` : ""}
                </p>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1">
                <Badge variant={statusVariant[booking.status]}>
                  {booking.status}
                </Badge>
                <span className="text-xs font-semibold text-emerald-400">
                  ${Number(booking.service.price).toFixed(2)}
                </span>
                <span className="text-xs text-zinc-600">
                  {format(new Date(booking.starts_at), "MMM d, h:mm a")}
                </span>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
