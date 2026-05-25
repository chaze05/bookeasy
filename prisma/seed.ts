/**
 * Seed script — creates two sample businesses with services, staff, and bookings.
 * Also promotes the first Supabase auth user to superadmin.
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
  ["Emma Wilson", "emma.wilson@email.com", "+1-555-0101"],
  ["Liam Johnson", "liam.j@email.com", "+1-555-0102"],
  ["Olivia Davis", "olivia.d@email.com", "+1-555-0103"],
  ["Noah Martinez", "noah.m@email.com", "+1-555-0104"],
  ["Ava Thompson", "ava.t@email.com", "+1-555-0105"],
  ["James Garcia", "james.g@email.com", "+1-555-0106"],
  ["Sophia Anderson", "sophia.a@email.com", "+1-555-0107"],
  ["Benjamin Lee", "ben.lee@email.com", "+1-555-0108"],
  ["Isabella White", "i.white@email.com", "+1-555-0109"],
  ["Lucas Harris", "lucas.h@email.com", "+1-555-0110"],
  ["Mia Clark", "mia.clark@email.com", "+1-555-0111"],
  ["Ethan Lewis", "ethan.l@email.com", "+1-555-0112"],
];

// ─── get first Supabase auth user ────────────────────────────────────────────

async function getFirstAuthUser(): Promise<{ id: string; email: string }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set");

  const res = await fetch(`${url}/auth/v1/admin/users?page=1&per_page=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  const data = (await res.json()) as { users?: Array<{ id: string; email: string }> };
  if (!data.users?.length) throw new Error("No auth users found — sign up first.");
  return data.users[0];
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
    // 1. Superadmin ──────────────────────────────────────────────────────────
    const authUser = await getFirstAuthUser();
    console.log(`\n👤 Auth user: ${authUser.email} (${authUser.id})`);

    await prisma.profile.upsert({
      where: { id: authUser.id },
      update: { role: "superadmin" },
      create: { id: authUser.id, full_name: "Admin User", role: "superadmin" },
    });
    console.log("✓  Profile set to superadmin");

    // ── Business 1: Glow Beauty Studio ──────────────────────────────────────
    const biz1 = await prisma.business.upsert({
      where: { slug: "glow-beauty-studio" },
      update: {},
      create: {
        owner_id: authUser.id,
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
    console.log(`\n💅 Business 1: ${biz1.name}`);

    const [s1a, s1b, s1c, s1d] = await Promise.all([
      prisma.service.upsert({ where: { id: "00000000-0000-0000-0001-000000000001" }, update: {}, create: { id: "00000000-0000-0000-0001-000000000001", business_id: biz1.id, name: "Haircut & Style", description: "Wash, cut and blow-dry finish.", duration: 60, price: 55, color: "#f472b6", is_active: true } }),
      prisma.service.upsert({ where: { id: "00000000-0000-0000-0001-000000000002" }, update: {}, create: { id: "00000000-0000-0000-0001-000000000002", business_id: biz1.id, name: "Balayage & Colour", description: "Hand-painted highlights with gloss finish.", duration: 180, price: 165, color: "#fb923c", is_active: true } }),
      prisma.service.upsert({ where: { id: "00000000-0000-0000-0001-000000000003" }, update: {}, create: { id: "00000000-0000-0000-0001-000000000003", business_id: biz1.id, name: "Signature Facial", description: "Deep-cleanse & hydrating mask treatment.", duration: 75, price: 75, color: "#34d399", is_active: true } }),
      prisma.service.upsert({ where: { id: "00000000-0000-0000-0001-000000000004" }, update: {}, create: { id: "00000000-0000-0000-0001-000000000004", business_id: biz1.id, name: "Gel Manicure", description: "Long-lasting colour with cuticle care.", duration: 45, price: 40, color: "#a78bfa", is_active: true } }),
    ]);
    console.log("  ✓ 4 services");

    const [st1a, st1b] = await Promise.all([
      prisma.staff.upsert({ where: { id: "00000000-0000-0000-0002-000000000001" }, update: {}, create: { id: "00000000-0000-0000-0002-000000000001", business_id: biz1.id, full_name: "Sarah Johnson", email: "sarah@glowbeauty.com", role: "staff", is_active: true } }),
      prisma.staff.upsert({ where: { id: "00000000-0000-0000-0002-000000000002" }, update: {}, create: { id: "00000000-0000-0000-0002-000000000002", business_id: biz1.id, full_name: "Maria Garcia", email: "maria@glowbeauty.com", role: "staff", is_active: true } }),
    ]);
    console.log("  ✓ 2 staff");

    // bookings for biz1
    const biz1Bookings = [
      { days: -10, h: 10, name: 0, svc: s1a, staff: st1a, status: "completed" as const },
      { days: -8,  h: 14, name: 1, svc: s1b, staff: st1a, status: "completed" as const },
      { days: -6,  h: 11, name: 2, svc: s1c, staff: st1b, status: "completed" as const },
      { days: -5,  h: 16, name: 3, svc: s1d, staff: st1b, status: "cancelled" as const },
      { days: -3,  h: 9,  name: 4, svc: s1a, staff: st1a, status: "completed" as const },
      { days: -2,  h: 13, name: 5, svc: s1b, staff: st1a, status: "no_show" as const },
      { days: -1,  h: 10, name: 6, svc: s1c, staff: st1b, status: "completed" as const },
      { days:  0,  h: 9,  name: 7, svc: s1a, staff: st1a, status: "confirmed" as const },
      { days:  0,  h: 11, name: 8, svc: s1d, staff: st1b, status: "confirmed" as const },
      { days:  0,  h: 15, name: 9, svc: s1c, staff: st1b, status: "pending"   as const },
      { days:  1,  h: 10, name: 0, svc: s1b, staff: st1a, status: "confirmed" as const },
      { days:  2,  h: 14, name: 1, svc: s1a, staff: st1a, status: "confirmed" as const },
      { days:  3,  h: 11, name: 2, svc: s1c, staff: st1b, status: "pending"   as const },
      { days:  5,  h: 9,  name: 3, svc: s1d, staff: st1b, status: "confirmed" as const },
      { days:  7,  h: 13, name: 4, svc: s1b, staff: st1a, status: "confirmed" as const },
    ];
    for (const b of biz1Bookings) {
      const starts = daysFromNow(b.days, b.h);
      const ends = addMinutes(starts, b.svc.duration);
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
          ends_at: ends,
          status: b.status,
        },
      });
    }
    console.log("  ✓ 15 bookings");

    // ── Business 2: FitZone Performance ─────────────────────────────────────
    const biz2 = await prisma.business.upsert({
      where: { slug: "fitzone-performance" },
      update: {},
      create: {
        owner_id: authUser.id,
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
    console.log(`\n🏋️  Business 2: ${biz2.name}`);

    const [s2a, s2b, s2c, s2d] = await Promise.all([
      prisma.service.upsert({ where: { id: "00000000-0000-0000-0003-000000000001" }, update: {}, create: { id: "00000000-0000-0000-0003-000000000001", business_id: biz2.id, name: "Personal Training", description: "1-on-1 tailored strength & conditioning session.", duration: 60, price: 85, color: "#ef4444", is_active: true } }),
      prisma.service.upsert({ where: { id: "00000000-0000-0000-0003-000000000002" }, update: {}, create: { id: "00000000-0000-0000-0003-000000000002", business_id: biz2.id, name: "Group HIIT Class", description: "High intensity interval training, max 10 people.", duration: 45, price: 30, color: "#f97316", is_active: true } }),
      prisma.service.upsert({ where: { id: "00000000-0000-0000-0003-000000000003" }, update: {}, create: { id: "00000000-0000-0000-0003-000000000003", business_id: biz2.id, name: "Nutrition Consult", description: "Personalised meal plan & macro coaching.", duration: 45, price: 65, color: "#22c55e", is_active: true } }),
      prisma.service.upsert({ where: { id: "00000000-0000-0000-0003-000000000004" }, update: {}, create: { id: "00000000-0000-0000-0003-000000000004", business_id: biz2.id, name: "Recovery Session", description: "Foam rolling, stretching & mobility work.", duration: 30, price: 40, color: "#3b82f6", is_active: true } }),
    ]);
    console.log("  ✓ 4 services");

    const [st2a, st2b] = await Promise.all([
      prisma.staff.upsert({ where: { id: "00000000-0000-0000-0004-000000000001" }, update: {}, create: { id: "00000000-0000-0000-0004-000000000001", business_id: biz2.id, full_name: "Mike Chen", email: "mike@fitzonefit.com", role: "staff", is_active: true } }),
      prisma.staff.upsert({ where: { id: "00000000-0000-0000-0004-000000000002" }, update: {}, create: { id: "00000000-0000-0000-0004-000000000002", business_id: biz2.id, full_name: "Alex Rivera", email: "alex@fitzonefit.com", role: "staff", is_active: true } }),
    ]);
    console.log("  ✓ 2 staff");

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
      const ends = addMinutes(starts, b.svc.duration);
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
          ends_at: ends,
          status: b.status,
        },
      });
    }
    console.log("  ✓ 15 bookings");

    console.log("\n✅ Seed complete!\n");
    console.log("  Business 1 booking link: /glow-beauty-studio");
    console.log("  Business 2 booking link: /fitzone-performance");
    console.log("  Superadmin panel:        /superadmin");
    console.log(`  Your account (${authUser.email}) is now a superadmin.\n`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error("\n❌ Seed failed:", e.message);
  process.exit(1);
});
