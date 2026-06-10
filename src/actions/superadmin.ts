"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/supabase/server";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";
import type { UserRole, SuperadminStats, BusinessWithOwner, Profile } from "@/types";

export type SuperadminUser = Profile & {
  email: string | null;
};

const DEFAULT_RESET_PASSWORD = "password";

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

async function getAdminStatsInternal(): Promise<SuperadminStats> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalBusinesses, activeBusinesses, suspendedBusinesses, totalUsers,
    totalBookings, newBusinessesToday, newBookingsToday, revenueData,
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
    (sum, b) => sum + Number(b.service.price), 0
  );

  return {
    totalBusinesses, activeBusinesses, suspendedBusinesses, totalUsers,
    totalBookings, totalRevenue, newBusinessesToday, newBookingsToday,
  };
}

export async function getAdminStats(): Promise<SuperadminStats> {
  await assertSuperadmin();
  return getAdminStatsInternal();
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

export async function getAllUsers(): Promise<SuperadminUser[]> {
  await assertSuperadmin();

  const users = await prisma.profile.findMany({
    orderBy: { created_at: "desc" },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase admin credentials are not configured");
  }

  const supabaseAdmin = createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const authUsers = new Map<string, string | null>();
  const perPage = 1000;
  let page = 1;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) throw error;

    for (const user of data.users) {
      authUsers.set(user.id, user.email ?? null);
    }

    if (data.users.length < perPage) break;
    page += 1;
  }

  return serialize(
    users.map((user) => ({
      ...user,
      email: authUsers.get(user.id) ?? null,
    }))
  ) as unknown as SuperadminUser[];
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

export async function resetUserPassword(userId: string) {
  await assertSuperadmin();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase admin credentials are not configured");
  }

  const user = await prisma.profile.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) throw new Error("User not found");

  const supabaseAdmin = createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: DEFAULT_RESET_PASSWORD,
  });

  if (error) throw error;

  revalidatePath("/superadmin/users");
}

export async function getSuperadminDashboardData() {
  await assertSuperadmin();
  
  const [stats, businesses, recentBookings, pendingPayments] = await Promise.all([
    getAdminStatsInternal(),
    prisma.business.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
    }),
    prisma.booking.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: { business: { select: { name: true } }, service: { select: { name: true, price: true } } }
    }),
    prisma.subscriptionPayment.findMany({
      where: { status: 'pending' },
      orderBy: { created_at: 'desc' },
      include: { business: { select: { id: true, name: true, status: true } } }
    })
  ]);

  const ownerIds = [...new Set(businesses.map((b) => b.owner_id))];
  const profiles = await prisma.profile.findMany({
    where: { id: { in: ownerIds } },
    select: { id: true, full_name: true, avatar_url: true },
  });
  const profileMap = new Map(profiles.map((p) => [p.id, p]));
  const recentBusinesses = businesses.map((b) => ({
    ...b,
    owner: profileMap.get(b.owner_id) ?? null,
  }));
  
  return serialize({ stats, recentBusinesses, recentBookings, pendingPayments });
}

export async function adminApproveSubscriptionPayment(id: string) {
  await assertSuperadmin();
  const payment = await prisma.subscriptionPayment.update({
    where: { id },
    data: { status: 'approved', notes: 'Approved by admin' },
  });
  
  await prisma.business.update({
    where: { id: payment.business_id },
    data: { status: 'active', updated_at: new Date() },
  });
  revalidatePath('/superadmin');
}

export async function adminRejectSubscriptionPayment(id: string, notes?: string) {
  await assertSuperadmin();
  await prisma.subscriptionPayment.update({
    where: { id },
    data: { status: 'rejected', notes: notes || 'Rejected by admin' },
  });
  revalidatePath('/superadmin');
}
