"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";
import { serviceSchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";

async function getBusinessId(userId: string): Promise<string> {
  const business = await prisma.business.findFirst({
    where: { owner_id: userId },
    select: { id: true },
  });
  if (!business) throw new Error("No business found");
  return business.id;
}

export async function createService(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const businessId = await getBusinessId(user.id);

  const parsed = serviceSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    duration: formData.get("duration"),
    price: formData.get("price"),
    color: formData.get("color"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  await prisma.service.create({
    data: { business_id: businessId, ...parsed.data },
  });

  revalidatePath("/dashboard/services");
}

export async function updateService(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const parsed = serviceSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    duration: formData.get("duration"),
    price: formData.get("price"),
    color: formData.get("color"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const businessId = await getBusinessId(user.id);

  const result = await prisma.service.updateMany({
    where: { id, business_id: businessId },
    data: { ...parsed.data, updated_at: new Date() },
  });
  if (result.count === 0) throw new Error("Service not found");

  revalidatePath("/dashboard/services");
}

export async function deleteService(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const businessId = await getBusinessId(user.id);

  await prisma.service.deleteMany({ where: { id, business_id: businessId } });
  revalidatePath("/dashboard/services");
}

export async function toggleService(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const businessId = await getBusinessId(user.id);

  await prisma.service.updateMany({
    where: { id, business_id: businessId },
    data: { is_active: isActive, updated_at: new Date() },
  });

  revalidatePath("/dashboard/services");
}
