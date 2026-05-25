"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional().or(z.literal("")),
  avatar_url: z
    .string()
    .url("Invalid URL")
    .optional()
    .or(z.literal("")),
});

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const parsed = profileSchema.safeParse({
    full_name: formData.get("full_name"),
    phone: formData.get("phone") || undefined,
    avatar_url: formData.get("avatar_url") || undefined,
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  await prisma.profile.update({
    where: { id: user.id },
    data: {
      full_name: parsed.data.full_name,
      phone: parsed.data.phone || null,
      avatar_url: parsed.data.avatar_url || null,
      updated_at: new Date(),
    },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
}

export async function updatePassword(formData: FormData) {
  // Password change goes through Supabase Auth — Prisma can't touch auth.users
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const password = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;

  if (!password || password.length < 8)
    throw new Error("Password must be at least 8 characters");
  if (password !== confirm)
    throw new Error("Passwords do not match");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(error.message);
}
