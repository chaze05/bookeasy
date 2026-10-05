"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const addonSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  price: z.coerce.number().min(0).max(1_000_000),
  max_quantity: z.coerce.number().int().min(1).max(50),
});

async function getBusinessId(userId: string): Promise<string> {
  const business = await prisma.business.findFirst({
    where: { owner_id: userId },
    select: { id: true },
  });
  if (!business) throw new Error("No business found");
  return business.id;
}

async function requireOwner() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return getBusinessId(user.id);
}

export async function createAddon(formData: FormData) {
  const businessId = await requireOwner();
  const serviceId = String(formData.get("service_id") ?? "");

  const service = await prisma.service.findFirst({
    where: { id: serviceId, business_id: businessId },
    select: { id: true },
  });
  if (!service) throw new Error("Service not found");

  const parsed = addonSchema.safeParse({
    name: formData.get("name"),
    price: formData.get("price"),
    max_quantity: formData.get("max_quantity") ?? 1,
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  await prisma.serviceAddon.create({
    data: {
      business_id: businessId,
      service_id: service.id,
      name: parsed.data.name,
      price: parsed.data.price,
      max_quantity: parsed.data.max_quantity,
    },
  });

  revalidatePath("/dashboard/services");
}

export async function updateAddon(id: string, formData: FormData) {
  const businessId = await requireOwner();

  const parsed = addonSchema.safeParse({
    name: formData.get("name"),
    price: formData.get("price"),
    max_quantity: formData.get("max_quantity") ?? 1,
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const result = await prisma.serviceAddon.updateMany({
    where: { id, business_id: businessId },
    data: {
      name: parsed.data.name,
      price: parsed.data.price,
      max_quantity: parsed.data.max_quantity,
      updated_at: new Date(),
    },
  });
  if (result.count === 0) throw new Error("Add-on not found");

  revalidatePath("/dashboard/services");
}

export async function deleteAddon(id: string) {
  const businessId = await requireOwner();
  await prisma.serviceAddon.deleteMany({ where: { id, business_id: businessId } });
  revalidatePath("/dashboard/services");
}

export async function toggleAddon(id: string, isActive: boolean) {
  const businessId = await requireOwner();
  await prisma.serviceAddon.updateMany({
    where: { id, business_id: businessId },
    data: { is_active: isActive, updated_at: new Date() },
  });
  revalidatePath("/dashboard/services");
}
