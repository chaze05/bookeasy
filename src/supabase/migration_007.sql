-- ============================================================
-- Migration 007: Lock down public (anon key) access
-- ============================================================
-- The app performs all reads/writes through Prisma using the
-- database credentials, which bypass row level security. The
-- public anon key is only used by the browser for:
--   * Supabase Auth
--   * reading the signed-in user's own profile (proxy role check)
--   * reading/updating the signed-in user's own notifications
--
-- The policies dropped below were reachable with the public anon
-- key via PostgREST and exposed other tenants' data or allowed
-- anonymous writes. Safe to re-run.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Remove public read policies that leak other tenants' data
-- ------------------------------------------------------------
-- Exposed all active staff rows (including email addresses)
drop policy if exists "public can read active staff" on public.staff;

-- Exposed every business's enabled payment methods, including
-- `details` (bank / GCash / Maya account numbers, Stripe keys)
drop policy if exists "public read enabled payment methods" on public.payment_methods;

-- Exposed active services, availability schedules and blocked dates
drop policy if exists "public can read active services" on public.services;
drop policy if exists "public can read availability" on public.availability;
drop policy if exists "public can read blocked dates" on public.blocked_dates;

-- Homepage content is server-rendered via Prisma; no anon read needed
drop policy if exists "public read homepage sections" on public.homepage_config;

-- ------------------------------------------------------------
-- 2. Remove anonymous write policies
-- ------------------------------------------------------------
-- All writes go through server actions -> Prisma, so anon INSERT
-- is pure attack surface (booking spam, notification spam,
-- fabricated audit logs).
drop policy if exists "customers can insert bookings" on public.bookings;
drop policy if exists "anyone can insert notifications" on public.notifications;
drop policy if exists "system inserts audit logs" on public.audit_logs;

-- ------------------------------------------------------------
-- 3. keep_alive: enable RLS, allow anon SELECT only
-- ------------------------------------------------------------
-- Used by /api/keepalive (anon key) to touch the database daily.
alter table public.keep_alive enable row level security;

drop policy if exists "anon can read keep alive" on public.keep_alive;
create policy "anon can read keep alive"
  on public.keep_alive for select using (true);
