"use server";

import { createClient } from "@/supabase/server";
import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@/types";

export async function createNotification({
  userId,
  businessId,
  type,
  title,
  message,
}: {
  userId: string;
  businessId?: string;
  type: NotificationType;
  title: string;
  message: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  const isSuperadmin = profile?.role === "superadmin";
  if (user.id !== userId && !isSuperadmin) throw new Error("Forbidden");

  const cleanTitle = title?.trim();
  const cleanMessage = message?.trim();
  if (!cleanTitle || !cleanMessage || cleanTitle.length > 200 || cleanMessage.length > 2000) {
    throw new Error("Invalid notification");
  }

  await prisma.notification.create({
    data: {
      user_id: userId,
      business_id: businessId ?? null,
      type,
      title: cleanTitle,
      message: cleanMessage,
    },
  });
}
