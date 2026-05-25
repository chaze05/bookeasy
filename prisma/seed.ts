/**
 * Seed script — creates three auth accounts (superadmin + 2 business owners)
 * with separate businesses, services, staff, and bookings.
 *
 * Accounts created:
 *   admin@bookeasy.app        / Admin123!   → superadmin
 *   owner@glowbeauty.com      / Owner123!   → owner of Glow Beauty Studio
 *   owner@fitzonefit.com      / Owner123!   → owner of FitZone Performance
 *
 * Run: npm run seed
 */
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

// ─── helpers ────────────────────────────────────────────────────────────────

function daysFromNow(d: number, h = 9, m = 0) {
  const dt = new Date();
  dt.setDate(dt.getDate() + d);
  dt.setHours(h, m, 0, 0);
  return dt;
}

function addMinutes(date: Date, mins: number) {
  return new Date(date.getTime() + mins * 60_000);
}

const names = [
  ["Emma Wilson",     "emma.wilson@email.com",   "+1-555-0101"],
  ["Liam Johnson",    "liam.j@email.com",        "+1-555-0102"],
  ["Olivia Davis",    "olivia.d@email.com",       "+1-555-0103"],
  ["Noah Martinez",   "noah.m@email.com",         "+1-555-0104"],
  ["Ava Thompson",    "ava.t@email.com",           "+1-555-0105"],
  ["James Garcia",    "james.g@email.com",         "+1-555-0106"],
  ["Sophia Anderson", "sophia.a@email.com",        "+1-555-0107"],
  ["Benjamin Lee",    "ben.lee@email.com",          "+1-555-0108"],
  ["Isabella White",  "i.white@email.com",          "+1-555-0109"],
  ["Lucas Harris",    "lucas.h@email.com",          "+1-555-0110"],
  ["Mia Clark",       "mia.clark@email.com",        "+1-555-0111"],
  ["Ethan Lewis",     "ethan.l@email.com",          "+1-555-0112"],
] as const;

// ─── Supabase Admin auth helpers ─────────────────────────────────────────────

function adminHeaders() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set");
  return { url, headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" } };
}

async function listAuthUsers(): Promise<Array<{ id: string; email: string }>> {
  const { url, headers } = adminHeaders();
  const res = await fetch(`${url}/auth/v1/admin/users?page=1&per_page=200`, { headers });
  const data = (await res.json()) as { users?: Array<{ id: string; email: string }> };
  return data.users ?? [];
}

async function upsertAuthUser(
  email: string,
  password: string,
  existingUsers: Array<{ id: string; email: string }>
): Promise<{ id: string; email: string }> {
  const existing = existingUsers.find((u) => u.email === email);
  if (existing) {
    console.log(`  → ${email} already exists`);
    return existing;
  }

  const { url, headers } = adminHeaders();
  const res = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  const data = (await res.json()) as { id?: string; email?: string; message?: string };
  if (!data.id) throw new Error(`Failed to create ${email}: ${data.message ?? JSON.stringify(data)}`);
  console.log(`  → created ${email}`);
  return { id: data.id, email: data.email! };
}

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // ── 1. Auth users ────────────────────────────────────────────────────────
    console.log("\n🔐 Auth users");
    const existing = await listAuthUsers();

    const [adminUser, glowOwner, fitzoneOwner] = await Promise.all([
      upsertAuthUser("admin@bookeasy.app",   "Admin123!", existing),
      upsertAuthUser("owner@glowbeauty.com", "Owner123!", existing),
      upsertAuthUser("owner@fitzonefit.com", "Owner123!", existing),
    ]);

    // ── 2. Profiles ──────────────────────────────────────────────────────────
    console.log("\n👤 Profiles");
    await Promise.all([
      prisma.profile.upsert({
        where: { id: adminUser.id },
        update: { role: "superadmin", full_name: "Admin User" },
        create: { id: adminUser.id, full_name: "Admin User", role: "superadmin" },
      }),
      prisma.profile.upsert({
        where: { id: glowOwner.id },
        update: { role: "owner", full_name: "Jessica Lee" },
        create: { id: glowOwner.id, full_name: "Jessica Lee", role: "owner" },
      }),
      prisma.profile.upsert({
        where: { id: fitzoneOwner.id },
        update: { role: "owner", full_name: "Marcus Reid" },
        create: { id: fitzoneOwner.id, full_name: "Marcus Reid", role: "owner" },
      }),
    ]);
    console.log("  ✓ superadmin, 2 owners");

    // ── 3. Business 1: Glow Beauty Studio ───────────────────────────────────
    console.log("\n💅 Glow Beauty Studio");
    const biz1 = await prisma.business.upsert({
      where: { slug: "glow-beauty-studio" },
      update: { owner_id: glowOwner.id },
      create: {
        owner_id: glowOwner.id,
        name: "Glow Beauty Studio",
        slug: "glow-beauty-studio",
        description: "Premium hair, skin & nail care in the heart of the city.",
        timezone: "America/New_York",
        booking_interval: 30,
        business_hours_start: "09:00",
        business_hours_end: "19:00",
        status: "active",
      },
    });

    const [s1a, s1b, s1c, s1d] = await Promise.all([
      prisma.service.upsert({ where: { id: "00000000-0000-0000-0001-000000000001" }, update: {}, create: { id: "00000000-0000-0000-0001-000000000001", business_id: biz1.id, name: "Haircut & Style",     description: "Wash, cut and blow-dry finish.",                   duration: 60,  price: 55,  color: "#f472b6", is_active: true } }),
      prisma.service.upsert({ where: { id: "00000000-0000-0000-0001-000000000002" }, update: {}, create: { id: "00000000-0000-0000-0001-000000000002", business_id: biz1.id, name: "Balayage & Colour",   description: "Hand-painted highlights with gloss finish.",          duration: 180, price: 165, color: "#fb923c", is_active: true } }),
      prisma.service.upsert({ where: { id: "00000000-0000-0000-0001-000000000003" }, update: {}, create: { id: "00000000-0000-0000-0001-000000000003", business_id: biz1.id, name: "Signature Facial",    description: "Deep-cleanse & hydrating mask treatment.",            duration: 75,  price: 75,  color: "#34d399", is_active: true } }),
      prisma.service.upsert({ where: { id: "00000000-0000-0000-0001-000000000004" }, update: {}, create: { id: "00000000-0000-0000-0001-000000000004", business_id: biz1.id, name: "Gel Manicure",        description: "Long-lasting colour with cuticle care.",              duration: 45,  price: 40,  color: "#a78bfa", is_active: true } }),
    ]);
    console.log("  ✓ 4 services");

    const [st1a, st1b] = await Promise.all([
      prisma.staff.upsert({ where: { id: "00000000-0000-0000-0002-000000000001" }, update: {}, create: { id: "00000000-0000-0000-0002-000000000001", business_id: biz1.id, full_name: "Sarah Johnson", email: "sarah@glowbeauty.com", role: "staff", is_active: true } }),
      prisma.staff.upsert({ where: { id: "00000000-0000-0000-0002-000000000002" }, update: {}, create: { id: "00000000-0000-0000-0002-000000000002", business_id: biz1.id, full_name: "Maria Garcia",  email: "maria@glowbeauty.com", role: "staff", is_active: true } }),
    ]);
    console.log("  ✓ 2 staff");

    // Payment methods — all 5 types, always present
    await Promise.all([
      prisma.paymentMethod.upsert({ where: { id: "00000000-0000-0000-0005-000000000001" }, update: {}, create: { id: "00000000-0000-0000-0005-000000000001", business_id: biz1.id, type: "gcash",        label: "GCash",                  is_enabled: true, sort_order: 0, details: { number: "0917-111-2233", account_name: "Jessica Lee" } } }),
      prisma.paymentMethod.upsert({ where: { id: "00000000-0000-0000-0005-000000000002" }, update: {}, create: { id: "00000000-0000-0000-0005-000000000002", business_id: biz1.id, type: "maya",         label: "Maya",                   is_enabled: true, sort_order: 1, details: { number: "0917-111-2233", account_name: "Jessica Lee" } } }),
      prisma.paymentMethod.upsert({ where: { id: "00000000-0000-0000-0005-000000000003" }, update: {}, create: { id: "00000000-0000-0000-0005-000000000003", business_id: biz1.id, type: "bank_transfer", label: "Bank Transfer",           is_enabled: true, sort_order: 2, details: { bank_name: "BPI", account_number: "0123-4567-89", account_name: "Jessica Lee", branch: "Makati" } } }),
      prisma.paymentMethod.upsert({ where: { id: "00000000-0000-0000-0005-000000000004" }, update: {}, create: { id: "00000000-0000-0000-0005-000000000004", business_id: biz1.id, type: "stripe",       label: "Credit / Debit Card",    is_enabled: true, sort_order: 3, details: { publishable_key: "pk_test_demo", webhook_endpoint: "" } } }),
      prisma.paymentMethod.upsert({ where: { id: "00000000-0000-0000-0005-000000000005" }, update: {}, create: { id: "00000000-0000-0000-0005-000000000005", business_id: biz1.id, type: "wise",         label: "Wise",                   is_enabled: true, sort_order: 4, details: { email: "pay@glowbeauty.com", payment_link: "https://wise.com/pay/glowbeauty" } } }),
    ]);
    console.log("  ✓ 5 payment methods");

    // Clear and recreate bookings so re-runs don't duplicate
    await prisma.booking.deleteMany({ where: { business_id: biz1.id } });
    const biz1Bookings = [
      { days: -10, h: 10, name: 0,  svc: s1a, staff: st1a, status: "completed" as const },
      { days: -8,  h: 14, name: 1,  svc: s1b, staff: st1a, status: "completed" as const },
      { days: -6,  h: 11, name: 2,  svc: s1c, staff: st1b, status: "completed" as const },
      { days: -5,  h: 16, name: 3,  svc: s1d, staff: st1b, status: "cancelled" as const },
      { days: -3,  h: 9,  name: 4,  svc: s1a, staff: st1a, status: "completed" as const },
      { days: -2,  h: 13, name: 5,  svc: s1b, staff: st1a, status: "no_show"   as const },
      { days: -1,  h: 10, name: 6,  svc: s1c, staff: st1b, status: "completed" as const },
      { days:  0,  h: 9,  name: 7,  svc: s1a, staff: st1a, status: "confirmed" as const },
      { days:  0,  h: 11, name: 8,  svc: s1d, staff: st1b, status: "confirmed" as const },
      { days:  0,  h: 15, name: 9,  svc: s1c, staff: st1b, status: "pending"   as const },
      { days:  1,  h: 10, name: 0,  svc: s1b, staff: st1a, status: "confirmed" as const },
      { days:  2,  h: 14, name: 1,  svc: s1a, staff: st1a, status: "confirmed" as const },
      { days:  3,  h: 11, name: 2,  svc: s1c, staff: st1b, status: "pending"   as const },
      { days:  5,  h: 9,  name: 3,  svc: s1d, staff: st1b, status: "confirmed" as const },
      { days:  7,  h: 13, name: 4,  svc: s1b, staff: st1a, status: "confirmed" as const },
    ];
    for (const b of biz1Bookings) {
      const starts = daysFromNow(b.days, b.h);
      const [n, e, p] = names[b.name];
      await prisma.booking.create({
        data: {
          business_id: biz1.id,
          service_id: b.svc.id,
          staff_id: b.staff.id,
          customer_name: n,
          customer_email: e,
          customer_phone: p,
          starts_at: starts,
          ends_at: addMinutes(starts, b.svc.duration),
          status: b.status,
        },
      });
    }
    console.log("  ✓ 15 bookings");

    // ── 4. Business 2: FitZone Performance ──────────────────────────────────
    console.log("\n🏋️  FitZone Performance");
    const biz2 = await prisma.business.upsert({
      where: { slug: "fitzone-performance" },
      update: { owner_id: fitzoneOwner.id },
      create: {
        owner_id: fitzoneOwner.id,
        name: "FitZone Performance",
        slug: "fitzone-performance",
        description: "Elite personal training & group fitness coaching.",
        timezone: "America/Los_Angeles",
        booking_interval: 60,
        business_hours_start: "06:00",
        business_hours_end: "21:00",
        status: "active",
      },
    });

    const [s2a, s2b, s2c, s2d] = await Promise.all([
      prisma.service.upsert({ where: { id: "00000000-0000-0000-0003-000000000001" }, update: {}, create: { id: "00000000-0000-0000-0003-000000000001", business_id: biz2.id, name: "Personal Training", description: "1-on-1 tailored strength & conditioning session.", duration: 60, price: 85, color: "#ef4444", is_active: true } }),
      prisma.service.upsert({ where: { id: "00000000-0000-0000-0003-000000000002" }, update: {}, create: { id: "00000000-0000-0000-0003-000000000002", business_id: biz2.id, name: "Group HIIT Class",   description: "High intensity interval training, max 10 people.", duration: 45, price: 30, color: "#f97316", is_active: true } }),
      prisma.service.upsert({ where: { id: "00000000-0000-0000-0003-000000000003" }, update: {}, create: { id: "00000000-0000-0000-0003-000000000003", business_id: biz2.id, name: "Nutrition Consult",  description: "Personalised meal plan & macro coaching.",           duration: 45, price: 65, color: "#22c55e", is_active: true } }),
      prisma.service.upsert({ where: { id: "00000000-0000-0000-0003-000000000004" }, update: {}, create: { id: "00000000-0000-0000-0003-000000000004", business_id: biz2.id, name: "Recovery Session",   description: "Foam rolling, stretching & mobility work.",         duration: 30, price: 40, color: "#3b82f6", is_active: true } }),
    ]);
    console.log("  ✓ 4 services");

    const [st2a, st2b] = await Promise.all([
      prisma.staff.upsert({ where: { id: "00000000-0000-0000-0004-000000000001" }, update: {}, create: { id: "00000000-0000-0000-0004-000000000001", business_id: biz2.id, full_name: "Mike Chen",   email: "mike@fitzonefit.com", role: "staff", is_active: true } }),
      prisma.staff.upsert({ where: { id: "00000000-0000-0000-0004-000000000002" }, update: {}, create: { id: "00000000-0000-0000-0004-000000000002", business_id: biz2.id, full_name: "Alex Rivera", email: "alex@fitzonefit.com", role: "staff", is_active: true } }),
    ]);
    console.log("  ✓ 2 staff");

    // Payment methods — all 5 types, always present
    await Promise.all([
      prisma.paymentMethod.upsert({ where: { id: "00000000-0000-0000-0006-000000000001" }, update: {}, create: { id: "00000000-0000-0000-0006-000000000001", business_id: biz2.id, type: "gcash",        label: "GCash",                  is_enabled: true, sort_order: 0, details: { number: "0918-222-3344", account_name: "Marcus Reid" } } }),
      prisma.paymentMethod.upsert({ where: { id: "00000000-0000-0000-0006-000000000002" }, update: {}, create: { id: "00000000-0000-0000-0006-000000000002", business_id: biz2.id, type: "maya",         label: "Maya",                   is_enabled: true, sort_order: 1, details: { number: "0918-222-3344", account_name: "Marcus Reid" } } }),
      prisma.paymentMethod.upsert({ where: { id: "00000000-0000-0000-0006-000000000003" }, update: {}, create: { id: "00000000-0000-0000-0006-000000000003", business_id: biz2.id, type: "bank_transfer", label: "Bank Transfer",           is_enabled: true, sort_order: 2, details: { bank_name: "BDO", account_number: "9876-5432-10", account_name: "Marcus Reid", branch: "BGC Taguig" } } }),
      prisma.paymentMethod.upsert({ where: { id: "00000000-0000-0000-0006-000000000004" }, update: {}, create: { id: "00000000-0000-0000-0006-000000000004", business_id: biz2.id, type: "stripe",       label: "Credit / Debit Card",    is_enabled: true, sort_order: 3, details: { publishable_key: "pk_test_demo", webhook_endpoint: "" } } }),
      prisma.paymentMethod.upsert({ where: { id: "00000000-0000-0000-0006-000000000005" }, update: {}, create: { id: "00000000-0000-0000-0006-000000000005", business_id: biz2.id, type: "wise",         label: "Wise",                   is_enabled: true, sort_order: 4, details: { email: "pay@fitzonefit.com", payment_link: "https://wise.com/pay/fitzonefit" } } }),
    ]);
    console.log("  ✓ 5 payment methods");

    await prisma.booking.deleteMany({ where: { business_id: biz2.id } });
    const biz2Bookings = [
      { days: -12, h: 7,  name: 5,  svc: s2a, staff: st2a, status: "completed" as const },
      { days: -10, h: 18, name: 6,  svc: s2b, staff: st2b, status: "completed" as const },
      { days: -7,  h: 8,  name: 7,  svc: s2c, staff: st2a, status: "completed" as const },
      { days: -5,  h: 6,  name: 8,  svc: s2a, staff: st2a, status: "completed" as const },
      { days: -4,  h: 17, name: 9,  svc: s2b, staff: st2b, status: "cancelled" as const },
      { days: -3,  h: 9,  name: 10, svc: s2d, staff: st2a, status: "completed" as const },
      { days: -2,  h: 7,  name: 11, svc: s2a, staff: st2a, status: "no_show"   as const },
      { days: -1,  h: 18, name: 0,  svc: s2b, staff: st2b, status: "completed" as const },
      { days:  0,  h: 7,  name: 1,  svc: s2a, staff: st2a, status: "confirmed" as const },
      { days:  0,  h: 9,  name: 2,  svc: s2d, staff: st2b, status: "confirmed" as const },
      { days:  0,  h: 18, name: 3,  svc: s2b, staff: st2b, status: "pending"   as const },
      { days:  1,  h: 7,  name: 4,  svc: s2a, staff: st2a, status: "confirmed" as const },
      { days:  2,  h: 8,  name: 5,  svc: s2c, staff: st2a, status: "confirmed" as const },
      { days:  4,  h: 17, name: 6,  svc: s2b, staff: st2b, status: "confirmed" as const },
      { days:  6,  h: 7,  name: 7,  svc: s2a, staff: st2a, status: "confirmed" as const },
    ];
    for (const b of biz2Bookings) {
      const starts = daysFromNow(b.days, b.h);
      const [n, e, p] = names[b.name];
      await prisma.booking.create({
        data: {
          business_id: biz2.id,
          service_id: b.svc.id,
          staff_id: b.staff.id,
          customer_name: n,
          customer_email: e,
          customer_phone: p,
          starts_at: starts,
          ends_at: addMinutes(starts, b.svc.duration),
          status: b.status,
        },
      });
    }
    console.log("  ✓ 15 bookings");

    console.log(`
✅ Seed complete!

┌─────────────────────────────────────────────────────────────┐
│  Test Accounts                                              │
├─────────────────────────────────────────────────────────────┤
│  Superadmin  admin@bookeasy.app        Admin123!            │
│  Glow owner  owner@glowbeauty.com      Owner123!            │
│  Fitzone     owner@fitzonefit.com      Owner123!            │
├─────────────────────────────────────────────────────────────┤
│  /glow-beauty-studio   — public booking page                │
│  /fitzone-performance  — public booking page                │
│  /superadmin           — platform admin panel               │
└─────────────────────────────────────────────────────────────┘
`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error("\n❌ Seed failed:", e.message);
  process.exit(1);
});
