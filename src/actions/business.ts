"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";
import { businessSchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/crypto";
import { effectivePlan, PLANS } from "@/lib/plans";
import { z } from "zod";

const bookingSettingsSchema = z
  .object({
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
    min_lead_hours: z.coerce.number().int().min(0).max(720),
    booking_horizon_days: z.coerce.number().int().min(1).max(730),
    buffer_minutes: z.coerce.number().int().min(0).max(240),
    deposit_type: z.enum(["none", "percent", "fixed"]),
    deposit_value: z.coerce.number().min(0).max(1_000_000),
  })
  .refine((data) => data.deposit_type !== "percent" || data.deposit_value <= 100, {
    message: "Deposit percentage must be between 0 and 100",
    path: ["deposit_value"],
  });

export async function updateBusiness(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const parsed = businessSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    contact_email: formData.get("contact_email"),
    currency: formData.get("currency"),
    timezone: formData.get("timezone"),
    logo_url: formData.get("logo_url"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const { logo_url, contact_email, ...rest } = parsed.data;

  const result = await prisma.business.updateMany({
    where: { id, owner_id: user.id },
    data: {
      ...rest,
      contact_email: contact_email || null,
      logo_url: logo_url || null,
      updated_at: new Date(),
    },
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
    contact_email: formData.get("contact_email"),
    currency: formData.get("currency"),
    timezone: formData.get("timezone"),
    logo_url: formData.get("logo_url"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const { logo_url, contact_email, ...rest } = parsed.data;

  await prisma.business.create({
    data: {
      owner_id: user.id,
      ...rest,
      contact_email: contact_email || null,
      logo_url: logo_url || null,
    },
  });

  revalidatePath("/dashboard");
}

const paymongoSettingsSchema = z.object({
  paymongo_enabled: z.string().transform((v) => v === "true"),
  paymongo_secret_key: z.string().optional(),
  paymongo_webhook_secret: z.string().optional(),
});

export async function updatePaymongoSettings(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const parsed = paymongoSettingsSchema.safeParse({
    paymongo_enabled: formData.get("paymongo_enabled"),
    paymongo_secret_key: formData.get("paymongo_secret_key") ?? undefined,
    paymongo_webhook_secret: formData.get("paymongo_webhook_secret") ?? undefined,
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const business = await prisma.business.findFirst({
    where: { owner_id: user.id },
    select: { id: true, paymongo_secret_key_encrypted: true, plan: true, plan_expires_at: true },
  });
  if (!business) throw new Error("No business found");

  if (parsed.data.paymongo_enabled && !PLANS[effectivePlan(business)].onlinePayments) {
    throw new Error("Online payments are available on the Pro plan and above. Upgrade to enable them.");
  }

  const secretKey = parsed.data.paymongo_secret_key?.trim();
  const webhookSecret = parsed.data.paymongo_webhook_secret?.trim();

  if (parsed.data.paymongo_enabled && !secretKey && !business.paymongo_secret_key_encrypted) {
    throw new Error("Paste your PayMongo secret key before enabling online payments");
  }

  await prisma.business.update({
    where: { id: business.id },
    data: {
      paymongo_enabled: parsed.data.paymongo_enabled,
      ...(secretKey ? { paymongo_secret_key_encrypted: encryptSecret(secretKey) } : {}),
      ...(webhookSecret
        ? { paymongo_webhook_secret_encrypted: encryptSecret(webhookSecret) }
        : {}),
      updated_at: new Date(),
    },
  });

  // Keep the public "Pay online" payment method in sync with the toggle.
  const methodLabel = "Pay online (GCash, Maya, card)";
  const existing = await prisma.paymentMethod.findFirst({
    where: { business_id: business.id, type: "paymongo" },
    select: { id: true },
  });
  if (existing) {
    await prisma.paymentMethod.update({
      where: { id: existing.id },
      data: { is_enabled: parsed.data.paymongo_enabled, label: methodLabel, updated_at: new Date() },
    });
  } else {
    await prisma.paymentMethod.create({
      data: {
        business_id: business.id,
        type: "paymongo",
        label: methodLabel,
        is_enabled: parsed.data.paymongo_enabled,
        sort_order: -1,
        details: {},
      },
    });
  }

  revalidatePath("/dashboard/settings");
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
    min_lead_hours: formData.get("min_lead_hours"),
    booking_horizon_days: formData.get("booking_horizon_days"),
    buffer_minutes: formData.get("buffer_minutes"),
    deposit_type: formData.get("deposit_type"),
    deposit_value: formData.get("deposit_value"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const planRecord = await prisma.business.findFirst({
    where: { id, owner_id: user.id },
    select: { plan: true, plan_expires_at: true },
  });
  if (!planRecord) throw new Error("Business not found");
  if (parsed.data.deposit_type !== "none" && !PLANS[effectivePlan(planRecord)].deposits) {
    throw new Error("Deposits are available on the Pro plan and above. Upgrade to enable deposits.");
  }

  const result = await prisma.business.updateMany({
    where: { id, owner_id: user.id },
    data: { ...parsed.data, updated_at: new Date() },
  });
  if (result.count === 0) throw new Error("Business not found");

  revalidatePath("/dashboard/settings");
}
