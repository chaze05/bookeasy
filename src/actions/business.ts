"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";
import { businessSchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bookingSettingsSchema = z.object({
  allow_multiple_bookings: z.string().transform((v) => v === "true"),
  max_bookings_per_slot: z.coerce.number().int().min(1).max(100),
  booking_interval: z.coerce.number().int().min(5).max(240),
  business_hours_start: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  business_hours_end: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  realtime_enabled: z.string().transform((v) => v === "true"),
});

export async function updateBusiness(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const parsed = businessSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    timezone: formData.get("timezone"),
    logo_url: formData.get("logo_url"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const { logo_url, ...rest } = parsed.data;

  const result = await prisma.business.updateMany({
    where: { id, owner_id: user.id },
    data: { ...rest, logo_url: logo_url || null, updated_at: new Date() },
  });
  if (result.count === 0) throw new Error("Business not found");

  revalidatePath("/dashboard/business");
  revalidatePath("/dashboard");
}

export async function createBusiness(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const parsed = businessSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    timezone: formData.get("timezone"),
    logo_url: formData.get("logo_url"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const { logo_url, ...rest } = parsed.data;

  await prisma.business.create({
    data: { owner_id: user.id, ...rest, logo_url: logo_url || null },
  });

  revalidatePath("/dashboard");
}

export async function updateBookingSettings(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const parsed = bookingSettingsSchema.safeParse({
    allow_multiple_bookings: formData.get("allow_multiple_bookings"),
    max_bookings_per_slot: formData.get("max_bookings_per_slot"),
    booking_interval: formData.get("booking_interval"),
    business_hours_start: formData.get("business_hours_start"),
    business_hours_end: formData.get("business_hours_end"),
    realtime_enabled: formData.get("realtime_enabled"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const result = await prisma.business.updateMany({
    where: { id, owner_id: user.id },
    data: { ...parsed.data, updated_at: new Date() },
  });
  if (result.count === 0) throw new Error("Business not found");

  revalidatePath("/dashboard/settings");
}
