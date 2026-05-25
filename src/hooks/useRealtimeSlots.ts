"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/supabase/client";
import { format } from "date-fns";

export interface SlotAvailability {
  time: string;
  bookingCount: number;
  maxBookings: number;
  isAvailable: boolean;
}

export function useRealtimeSlots(
  businessId: string | null,
  date: Date | null,
  options: {
    interval?: number;
    maxPerSlot?: number;
    allowMultiple?: boolean;
    hoursStart?: string;
    hoursEnd?: string;
  } = {}
) {
  const {
    interval = 30,
    maxPerSlot = 1,
    allowMultiple = false,
    hoursStart = "09:00",
    hoursEnd = "18:00",
  } = options;

  const [slots, setSlots] = useState<SlotAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useRef(createClient());

  const parseMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + (m ?? 0);
  };

  const fetchSlots = useCallback(async () => {
    if (!businessId || !date) {
      setLoading(false);
      return;
    }
    const dateStr = format(date, "yyyy-MM-dd");

    const { data: bookingsData } = await supabase.current
      .from("bookings")
      .select("starts_at")
      .eq("business_id", businessId)
      .gte("starts_at", `${dateStr}T00:00:00`)
      .lte("starts_at", `${dateStr}T23:59:59`)
      .in("status", ["pending", "confirmed"]);

    const slotCounts = new Map<string, number>();
    for (const b of (bookingsData ?? []) as { starts_at: string }[]) {
      const t = format(new Date(b.starts_at), "HH:mm");
      slotCounts.set(t, (slotCounts.get(t) ?? 0) + 1);
    }

    const result: SlotAvailability[] = [];
    const startMin = parseMinutes(hoursStart);
    const endMin = parseMinutes(hoursEnd);
    let current = startMin;

    while (current < endMin) {
      const h = String(Math.floor(current / 60)).padStart(2, "0");
      const m = String(current % 60).padStart(2, "0");
      const time = `${h}:${m}`;
      const count = slotCounts.get(time) ?? 0;
      const max = allowMultiple ? maxPerSlot : 1;
      result.push({ time, bookingCount: count, maxBookings: max, isAvailable: count < max });
      current += interval;
    }

    setSlots(result);
    setLoading(false);
  }, [businessId, date, interval, maxPerSlot, allowMultiple, hoursStart, hoursEnd]);

  useEffect(() => {
    fetchSlots();
    if (!businessId) return;

    const channel = supabase.current
      .channel(`rt-slots-${businessId}-${date ? format(date, "yyyy-MM-dd") : "none"}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `business_id=eq.${businessId}`,
        },
        () => fetchSlots()
      )
      .subscribe();

    return () => {
      supabase.current.removeChannel(channel);
    };
  }, [businessId, date, fetchSlots]);

  return { slots, loading, refetch: fetchSlots };
}
