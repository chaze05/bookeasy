"use server";

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
  await prisma.notification.create({
    data: {
      user_id: userId,
      business_id: businessId ?? null,
      type,
      title,
      message,
    },
  });
}
