-- ============================================================
-- Migration 001: Business settings, roles, notifications, audit logs
-- Run this in the Supabase SQL editor after the initial schema.
-- Safe to re-run: uses IF NOT EXISTS and drops policies before recreating.
-- ============================================================

-- 1. Add role to profiles
alter table public.profiles
  add column if not exists role text not null default 'owner'
  check (role in ('superadmin', 'owner', 'staff', 'customer'));

-- 2. Add booking-settings columns + status to businesses
alter table public.businesses
  add column if not exists allow_multiple_bookings boolean not null default false,
  add column if not exists max_bookings_per_slot   int     not null default 1,
  add column if not exists booking_interval        int     not null default 30,
  add column if not exists business_hours_start    text    not null default '09:00',
  add column if not exists business_hours_end      text    not null default '18:00',
  add column if not exists realtime_enabled        boolean not null default true,
  add column if not exists status                  text    not null default 'active'
    check (status in ('active', 'suspended', 'pending'));

-- 3. Notifications table
create table if not exists public.notifications (
  id          uuid        primary key default uuid_generate_v4(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  business_id uuid        references public.businesses(id) on delete cascade,
  type        text        not null default 'system',
  title       text        not null,
  message     text        not null,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

-- 4. Audit logs table
create table if not exists public.audit_logs (
  id          uuid        primary key default uuid_generate_v4(),
  user_id     uuid        references auth.users(id) on delete set null,
  business_id uuid        references public.businesses(id) on delete cascade,
  action      text        not null,
  entity_type text        not null,
  entity_id   uuid,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

-- Enable RLS on new tables
alter table public.notifications  enable row level security;
alter table public.audit_logs     enable row level security;

-- Superadmin helper function
create or replace function public.is_superadmin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'superadmin'
  );
$$;

-- ------------------------------------------------------------
-- Notification RLS policies
-- ------------------------------------------------------------
drop policy if exists "users see own notifications"     on public.notifications;
drop policy if exists "superadmin sees all notifications" on public.notifications;
drop policy if exists "anyone can insert notifications" on public.notifications;
drop policy if exists "users update own notifications"  on public.notifications;
drop policy if exists "users delete own notifications"  on public.notifications;

create policy "users see own notifications"
  on public.notifications for select using (user_id = auth.uid());

create policy "superadmin sees all notifications"
  on public.notifications for select using (public.is_superadmin());

create policy "anyone can insert notifications"
  on public.notifications for insert with check (true);

create policy "users update own notifications"
  on public.notifications for update using (user_id = auth.uid());

create policy "users delete own notifications"
  on public.notifications for delete using (user_id = auth.uid());

-- ------------------------------------------------------------
-- Audit log RLS policies
-- ------------------------------------------------------------
drop policy if exists "owners see business audit logs" on public.audit_logs;
drop policy if exists "superadmin sees all audit logs" on public.audit_logs;
drop policy if exists "system inserts audit logs"      on public.audit_logs;

create policy "owners see business audit logs"
  on public.audit_logs for select
  using (business_id in (select public.my_business_ids()));

create policy "superadmin sees all audit logs"
  on public.audit_logs for select using (public.is_superadmin());

create policy "system inserts audit logs"
  on public.audit_logs for insert with check (true);

-- ------------------------------------------------------------
-- Superadmin bypass policies on core tables
-- ------------------------------------------------------------
drop policy if exists "superadmin full access businesses" on public.businesses;
drop policy if exists "superadmin full access profiles"   on public.profiles;
drop policy if exists "superadmin full access bookings"   on public.bookings;
drop policy if exists "superadmin full access services"   on public.services;
drop policy if exists "superadmin full access staff"      on public.staff;

create policy "superadmin full access businesses"
  on public.businesses for all using (public.is_superadmin()) with check (public.is_superadmin());

create policy "superadmin full access profiles"
  on public.profiles for all using (public.is_superadmin()) with check (public.is_superadmin());

create policy "superadmin full access bookings"
  on public.bookings for all using (public.is_superadmin()) with check (public.is_superadmin());

create policy "superadmin full access services"
  on public.services for all using (public.is_superadmin()) with check (public.is_superadmin());

create policy "superadmin full access staff"
  on public.staff for all using (public.is_superadmin()) with check (public.is_superadmin());

-- ------------------------------------------------------------
-- Indexes
-- ------------------------------------------------------------
create index if not exists notifications_user_idx on public.notifications (user_id, read_at);
create index if not exists notifications_biz_idx  on public.notifications (business_id, created_at desc);
create index if not exists audit_biz_idx          on public.audit_logs (business_id, created_at desc);
create index if not exists audit_user_idx         on public.audit_logs (user_id, created_at desc);

-- ------------------------------------------------------------
-- Enable Supabase Realtime on key tables
-- Run in Supabase dashboard → Database → Replication, or uncomment:
-- ------------------------------------------------------------
-- alter publication supabase_realtime add table public.bookings;
-- alter publication supabase_realtime add table public.notifications;
