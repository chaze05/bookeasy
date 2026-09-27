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

const availabilitySchema = z
  .object({
    windows: z
      .array(
        z.object({
          day_of_week: z.coerce.number().int().min(0).max(6),
          start_time: z.string().regex(/^\d{2}:\d{2}$/),
          end_time: z.string().regex(/^\d{2}:\d{2}$/),
        })
      )
      .max(21),
  })
  .refine((data) => data.windows.every((w) => w.end_time > w.start_time), {
    message: "End time must be after start time",
  });

function timeToDate(value: string): Date {
  const [hour, minute] = value.split(":").map(Number);
  return new Date(Date.UTC(1970, 0, 1, hour, minute, 0));
}

export async function saveStaffAvailability(staffId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const businessId = await getBusinessId(user.id);

  const staff = await prisma.staff.findFirst({
    where: { id: staffId, business_id: businessId },
    select: { id: true },
  });
  if (!staff) throw new Error("Staff member not found");

  let windows: unknown;
  try {
    windows = JSON.parse(String(formData.get("windows") ?? "[]"));
  } catch {
    throw new Error("Invalid schedule data");
  }

  const parsed = availabilitySchema.safeParse({ windows });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  // Sequential (not a transaction) — interactive transactions are unreliable
  // through the Supabase transaction pooler; a partial save is harmless here.
  await prisma.availability.deleteMany({ where: { staff_id: staff.id, business_id: businessId } });
  if (parsed.data.windows.length > 0) {
    await prisma.availability.createMany({
      data: parsed.data.windows.map((w) => ({
        business_id: businessId,
        staff_id: staff.id,
        day_of_week: w.day_of_week,
        start_time: timeToDate(w.start_time),
        end_time: timeToDate(w.end_time),
        is_active: true,
      })),
    });
  }

  revalidatePath("/dashboard/staff");
}

export async function addBlockedDate(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const businessId = await getBusinessId(user.id);

  const dateStr = String(formData.get("blocked_on") ?? "");
  const staffIdRaw = String(formData.get("staff_id") ?? "all");
  const reason = String(formData.get("reason") ?? "").trim() || null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) throw new Error("Choose a valid date");

  let staffId: string | null = null;
  if (staffIdRaw !== "all") {
    const staff = await prisma.staff.findFirst({
      where: { id: staffIdRaw, business_id: businessId },
      select: { id: true },
    });
    if (!staff) throw new Error("Staff member not found");
    staffId = staff.id;
  }

  const [year, month, day] = dateStr.split("-").map(Number);
  const blockedOn = new Date(Date.UTC(year, month - 1, day));

  await prisma.blockedDate.deleteMany({
    where: { business_id: businessId, staff_id: staffId, blocked_on: blockedOn },
  });
  await prisma.blockedDate.create({
    data: { business_id: businessId, staff_id: staffId, blocked_on: blockedOn, reason },
  });

  revalidatePath("/dashboard/staff");
}

export async function deleteBlockedDate(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const businessId = await getBusinessId(user.id);
  await prisma.blockedDate.deleteMany({ where: { id, business_id: businessId } });

  revalidatePath("/dashboard/staff");
}
