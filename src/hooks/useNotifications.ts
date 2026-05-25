"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/supabase/client";
import type { Notification } from "@/types";

export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = useRef(createClient());

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase.current
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    const items = (data as Notification[]) ?? [];
    setNotifications(items);
    setUnreadCount(items.filter((n) => !n.read_at).length);
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
    if (!userId) return;

    const channel = supabase.current
      .channel(`rt-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => fetchNotifications()
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => fetchNotifications()
      )
      .subscribe();

    return () => {
      supabase.current.removeChannel(channel);
    };
  }, [userId, fetchNotifications]);

  const markRead = useCallback(
    async (id: string) => {
      if (!userId) return;
      const now = new Date().toISOString();
      await supabase.current
        .from("notifications")
        .update({ read_at: now })
        .eq("id", id)
        .eq("user_id", userId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: now } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    },
    [userId]
  );

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    const now = new Date().toISOString();
    await supabase.current
      .from("notifications")
      .update({ read_at: now })
      .eq("user_id", userId)
      .is("read_at", null);
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at ?? now }))
    );
    setUnreadCount(0);
  }, [userId]);

  return {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    refetch: fetchNotifications,
  };
}
