"use client";

import { motion } from "framer-motion";
import { format, isAfter } from "date-fns";
import { Clock, CalendarX } from "lucide-react";
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

interface TodayScheduleProps {
  bookings: BookingWithRelations[];
}

export function TodaySchedule({ bookings }: TodayScheduleProps) {
  const now = new Date();
  const upcoming = bookings.filter((b) => isAfter(new Date(b.starts_at), now));
  const past = bookings.filter((b) => !isAfter(new Date(b.starts_at), now));

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-zinc-500" />
          <h2 className="text-sm font-semibold text-zinc-100">Today's Schedule</h2>
        </div>
        <span className="text-xs text-zinc-500">
          {bookings.length} appointment{bookings.length !== 1 ? "s" : ""}
        </span>
      </div>

      {bookings.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <CalendarX className="h-8 w-8 text-zinc-700" />
          <p className="text-sm text-zinc-500">No appointments today</p>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-800/60">
          {[...upcoming, ...past].map((booking, i) => {
            const isPast = !isAfter(new Date(booking.starts_at), now);
            return (
              <motion.li
                key={booking.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`flex items-center gap-3 px-5 py-3 ${isPast ? "opacity-50" : ""}`}
              >
                <div className="w-14 shrink-0 text-right">
                  <p className="text-xs font-semibold text-zinc-300">
                    {format(new Date(booking.starts_at), "h:mm")}
                  </p>
                  <p className="text-[10px] text-zinc-600">
                    {format(new Date(booking.starts_at), "a")}
                  </p>
                </div>

                <div
                  className="h-8 w-0.5 shrink-0 rounded-full"
                  style={{ backgroundColor: booking.service.color }}
                />

                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback
                    className="text-[10px] font-semibold"
                    style={{ backgroundColor: booking.service.color + "25", color: booking.service.color }}
                  >
                    {booking.customer_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-100">
                    {booking.customer_name}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {booking.service.name} · {booking.service.duration} min
                    {booking.staff ? ` · ${booking.staff.full_name}` : ""}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge variant={statusVariant[booking.status]} className="text-[10px]">
                    {booking.status}
                  </Badge>
                  <span className="text-[10px] font-medium text-emerald-400">
                    ${Number(booking.service.price).toFixed(0)}
                  </span>
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
