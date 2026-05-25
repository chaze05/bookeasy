"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";

export type PaymentType = "stripe" | "gcash" | "maya" | "wise" | "bank_transfer";

export interface PaymentMethodConfig {
  id?: string;
  business_id: string;
  type: PaymentType;
  label: string;
  is_enabled: boolean;
  details: Record<string, string>;
  sort_order: number;
}

async function assertSuperadmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (profile?.role !== "superadmin") throw new Error("Forbidden");
}

async function assertBusinessOwner(businessId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const business = await prisma.business.findFirst({
    where: { id: businessId, owner_id: user.id },
    select: { id: true },
  });
  if (!business) throw new Error("Forbidden");
}

export async function getBusinessPaymentMethods(businessId: string) {
  const methods = await prisma.paymentMethod.findMany({
    where: { business_id: businessId, is_enabled: true },
    orderBy: { sort_order: "asc" },
  });
  return serialize(methods) as PaymentMethodConfig[];
}

export async function getAllPaymentMethodsAdmin() {
  await assertSuperadmin();
  const methods = await prisma.paymentMethod.findMany({
    orderBy: [{ business_id: "asc" }, { sort_order: "asc" }],
    include: { business: { select: { name: true, slug: true } } },
  });
  return serialize(methods);
}

export async function upsertPaymentMethod(data: PaymentMethodConfig) {
  await assertBusinessOwner(data.business_id);

  if (data.id) {
    await prisma.paymentMethod.update({
      where: { id: data.id },
      data: {
        label: data.label,
        is_enabled: data.is_enabled,
        details: data.details,
        sort_order: data.sort_order,
        updated_at: new Date(),
      },
    });
  } else {
    await prisma.paymentMethod.create({
      data: {
        business_id: data.business_id,
        type: data.type,
        label: data.label,
        is_enabled: data.is_enabled,
        details: data.details,
        sort_order: data.sort_order,
      },
    });
  }
  revalidatePath("/dashboard/settings");
}

export async function deletePaymentMethod(id: string, businessId: string) {
  await assertBusinessOwner(businessId);
  await prisma.paymentMethod.delete({ where: { id } });
  revalidatePath("/dashboard/settings");
}

// Superadmin: toggle a single method by id
export async function adminTogglePaymentMethod(id: string, is_enabled: boolean) {
  await assertSuperadmin();
  await prisma.paymentMethod.update({
    where: { id },
    data: { is_enabled, updated_at: new Date() },
  });
  revalidatePath("/superadmin/payments");
}

// Superadmin: enable/disable a payment type platform-wide (all businesses)
export async function adminTogglePaymentType(type: string, is_enabled: boolean) {
  await assertSuperadmin();
  await prisma.paymentMethod.updateMany({
    where: { type },
    data: { is_enabled, updated_at: new Date() },
  });
  revalidatePath("/superadmin/payments");
}
