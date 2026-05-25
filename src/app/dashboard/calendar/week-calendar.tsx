"use client";

import { useState } from "react";
import {
  format,
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  isSameDay,
  isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BookingWithRelations, BookingStatus } from "@/types";

const statusVariant: Record<
  BookingStatus,
  "success" | "warning" | "destructive" | "secondary" | "outline"
> = {
  confirmed: "success",
  pending: "warning",
  cancelled: "destructive",
  no_show: "secondary",
  completed: "outline",
};

interface WeekCalendarProps {
  bookings: BookingWithRelations[];
}

export function WeekCalendar({ bookings }: WeekCalendarProps) {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [direction, setDirection] = useState(0);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  function prev() {
    setDirection(-1);
    setWeekStart((w) => subWeeks(w, 1));
  }

  function next() {
    setDirection(1);
    setWeekStart((w) => addWeeks(w, 1));
  }

  function goToday() {
    setDirection(0);
    setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  }

  const bookingsForDay = (day: Date) =>
    bookings.filter((b) => isSameDay(new Date(b.starts_at), day));

  const totalThisWeek = days.reduce(
    (sum, d) => sum + bookingsForDay(d).length,
    0
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Nav bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={prev}
            className="border-zinc-700 bg-zinc-900 hover:bg-zinc-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={next}
            className="border-zinc-700 bg-zinc-900 hover:bg-zinc-800"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="ml-2 text-sm font-semibold text-zinc-100">
            {format(weekStart, "MMM d")} –{" "}
            {format(addDays(weekStart, 6), "MMM d, yyyy")}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">{totalThisWeek} booking{totalThisWeek !== 1 ? "s" : ""} this week</span>
          <Button
            variant="outline"
            size="sm"
            onClick={goToday}
            className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
          >
            Today
          </Button>
        </div>
      </div>

      {/* Week grid */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={weekStart.toISOString()}
          initial={{ opacity: 0, x: direction * 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -30 }}
          transition={{ duration: 0.2 }}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7"
        >
          {days.map((day) => {
            const dayBookings = bookingsForDay(day);
            const today = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={`flex flex-col gap-2 rounded-xl border p-3 min-h-[180px] ${
                  today
                    ? "border-emerald-500/40 bg-emerald-500/5"
                    : "border-zinc-800 bg-zinc-900"
                }`}
              >
                {/* Day header */}
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                      today
                        ? "bg-emerald-500 text-white"
                        : "text-zinc-400"
                    }`}
                  >
                    {format(day, "d")}
                  </div>
                  <span className="text-xs font-medium text-zinc-500">
                    {format(day, "EEE")}
                  </span>
                  {dayBookings.length > 0 && (
                    <span className="ml-auto text-xs text-zinc-600">
                      {dayBookings.length}
                    </span>
                  )}
                </div>

                {/* Bookings */}
                {dayBookings.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center">
                    <span className="text-xs text-zinc-700">Free</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5 overflow-y-auto">
                    {dayBookings.map((b) => (
                      <div
                        key={b.id}
                        className="rounded-lg p-2 text-xs"
                        style={{
                          backgroundColor: b.service.color + "20",
                          borderLeft: `2px solid ${b.service.color}`,
                        }}
                      >
                        <p className="font-medium text-zinc-100 leading-tight">
                          {format(new Date(b.starts_at), "h:mm a")}
                        </p>
                        <p className="text-zinc-400 truncate mt-0.5">
                          {b.customer_name}
                        </p>
                        <p className="text-zinc-500 truncate">{b.service.name}</p>
                        <Badge
                          variant={statusVariant[b.status]}
                          className="mt-1 text-[10px] px-1.5 py-0"
                        >
                          {b.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Legend */}
      <div className="flex items-center gap-1 text-xs text-zinc-600">
        <CalendarDays className="h-3.5 w-3.5" />
        <span>Showing confirmed and pending bookings only</span>
      </div>
    </div>
  );
}
