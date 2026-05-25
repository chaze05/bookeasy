"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";
import type { UserRole, SuperadminStats, BusinessWithOwner, Profile } from "@/types";

async function assertSuperadmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (profile?.role !== "superadmin") throw new Error("Forbidden");
  return { user };
}

export async function getAdminStats(): Promise<SuperadminStats> {
  await assertSuperadmin();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalBusinesses,
    activeBusinesses,
    suspendedBusinesses,
    totalUsers,
    totalBookings,
    newBusinessesToday,
    newBookingsToday,
    revenueData,
  ] = await Promise.all([
    prisma.business.count(),
    prisma.business.count({ where: { status: "active" } }),
    prisma.business.count({ where: { status: "suspended" } }),
    prisma.profile.count(),
    prisma.booking.count(),
    prisma.business.count({ where: { created_at: { gte: today } } }),
    prisma.booking.count({ where: { created_at: { gte: today } } }),
    prisma.booking.findMany({
      where: { status: { in: ["completed", "confirmed"] } },
      include: { service: { select: { price: true } } },
    }),
  ]);

  const totalRevenue = revenueData.reduce(
    (sum, b) => sum + Number(b.service.price),
    0
  );

  return {
    totalBusinesses,
    activeBusinesses,
    suspendedBusinesses,
    totalUsers,
    totalBookings,
    totalRevenue,
    newBusinessesToday,
    newBookingsToday,
  };
}

export async function getAllBusinesses(): Promise<BusinessWithOwner[]> {
  await assertSuperadmin();

  const businesses = await prisma.business.findMany({
    orderBy: { created_at: "desc" },
  });

  const ownerIds = [...new Set(businesses.map((b) => b.owner_id))];
  const profiles = await prisma.profile.findMany({
    where: { id: { in: ownerIds } },
    select: { id: true, full_name: true, avatar_url: true },
  });

  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  return serialize(
    businesses.map((b) => ({
      ...b,
      owner: profileMap.get(b.owner_id) ?? null,
    }))
  ) as unknown as BusinessWithOwner[];
}

export async function getAllUsers(): Promise<Profile[]> {
  await assertSuperadmin();

  const users = await prisma.profile.findMany({
    orderBy: { created_at: "desc" },
  });
  return serialize(users) as unknown as Profile[];
}

export async function suspendBusiness(id: string) {
  await assertSuperadmin();
  await prisma.business.update({
    where: { id },
    data: { status: "suspended", updated_at: new Date() },
  });
  revalidatePath("/superadmin/businesses");
}

export async function reactivateBusiness(id: string) {
  await assertSuperadmin();
  await prisma.business.update({
    where: { id },
    data: { status: "active", updated_at: new Date() },
  });
  revalidatePath("/superadmin/businesses");
}

export async function updateUserRole(userId: string, role: UserRole) {
  await assertSuperadmin();
  await prisma.profile.update({
    where: { id: userId },
    data: { role, updated_at: new Date() },
  });
  revalidatePath("/superadmin/users");
}
