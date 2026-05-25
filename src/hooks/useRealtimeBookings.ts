"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/supabase/client";
import type { BookingWithRelations } from "@/types";

export function useRealtimeBookings(businessId: string | null) {
  const [bookings, setBookings] = useState<BookingWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useRef(createClient());

  const fetchBookings = useCallback(async () => {
    if (!businessId) {
      setLoading(false);
      return;
    }
    const { data } = await supabase.current
      .from("bookings")
      .select(
        "*, service:services(name,duration,price,color), staff:staff(full_name,avatar_url)"
      )
      .eq("business_id", businessId)
      .order("starts_at", { ascending: false })
      .limit(50);

    setBookings((data as unknown as BookingWithRelations[]) ?? []);
    setLoading(false);
  }, [businessId]);

  useEffect(() => {
    fetchBookings();
    if (!businessId) return;

    const channel = supabase.current
      .channel(`rt-bookings-${businessId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `business_id=eq.${businessId}`,
        },
        () => fetchBookings()
      )
      .subscribe();

    return () => {
      supabase.current.removeChannel(channel);
    };
  }, [businessId, fetchBookings]);

  return { bookings, loading, refetch: fetchBookings };
}
