"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const staffSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  role: z.enum(["owner", "staff"]).default("staff"),
});

async function getBusinessId(userId: string): Promise<string> {
  const business = await prisma.business.findFirst({
    where: { owner_id: userId },
    select: { id: true },
  });
  if (!business) throw new Error("No business found");
  return business.id;
}

export async function createStaffMember(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const businessId = await getBusinessId(user.id);

  const parsed = staffSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email") || undefined,
    role: formData.get("role"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  await prisma.staff.create({
    data: {
      business_id: businessId,
      full_name: parsed.data.full_name,
      email: parsed.data.email || null,
      role: parsed.data.role,
    },
  });

  revalidatePath("/dashboard/staff");
}

export async function updateStaffMember(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const parsed = staffSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email") || undefined,
    role: formData.get("role"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const businessId = await getBusinessId(user.id);

  await prisma.staff.updateMany({
    where: { id, business_id: businessId },
    data: {
      full_name: parsed.data.full_name,
      email: parsed.data.email || null,
      role: parsed.data.role,
      updated_at: new Date(),
    },
  });

  revalidatePath("/dashboard/staff");
}

export async function deleteStaffMember(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const businessId = await getBusinessId(user.id);

  await prisma.staff.deleteMany({ where: { id, business_id: businessId } });
  revalidatePath("/dashboard/staff");
}

export async function toggleStaffMember(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const businessId = await getBusinessId(user.id);

  await prisma.staff.updateMany({
    where: { id, business_id: businessId },
    data: { is_active: isActive, updated_at: new Date() },
  });

  revalidatePath("/dashboard/staff");
}
