-- ============================================================
-- Migration 002: Payment methods table
-- Run this in the Supabase SQL editor.
-- Safe to re-run: uses IF NOT EXISTS and drops policies before recreating.
-- ============================================================

-- 1. Create payment_methods table
create table if not exists public.payment_methods (
  id          uuid        primary key default uuid_generate_v4(),
  business_id uuid        not null references public.businesses(id) on delete cascade,
  type        text        not null check (type in ('stripe', 'gcash', 'maya', 'wise', 'bank_transfer')),
  label       text        not null,
  is_enabled  boolean     not null default true,
  details     jsonb,
  sort_order  int         not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2. Enable RLS
alter table public.payment_methods enable row level security;

-- 3. updated_at trigger (reuse pattern from other tables)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_payment_methods_updated_at on public.payment_methods;
create trigger set_payment_methods_updated_at
  before update on public.payment_methods
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- RLS policies
-- ------------------------------------------------------------

-- Drop before recreating (safe to re-run)
drop policy if exists "public read enabled payment methods"     on public.payment_methods;
drop policy if exists "owners read own payment methods"        on public.payment_methods;
drop policy if exists "owners insert payment methods"          on public.payment_methods;
drop policy if exists "owners update own payment methods"      on public.payment_methods;
drop policy if exists "owners delete own payment methods"      on public.payment_methods;
drop policy if exists "superadmin full access payment methods" on public.payment_methods;

-- Public booking pages can read enabled payment methods (no auth required)
create policy "public read enabled payment methods"
  on public.payment_methods for select
  using (is_enabled = true);

-- Authenticated owners can read all (including disabled) their own business's methods
create policy "owners read own payment methods"
  on public.payment_methods for select
  using (business_id in (select public.my_business_ids()));

-- Owners can create payment methods for their business
create policy "owners insert payment methods"
  on public.payment_methods for insert
  with check (business_id in (select public.my_business_ids()));

-- Owners can update their own payment methods
create policy "owners update own payment methods"
  on public.payment_methods for update
  using (business_id in (select public.my_business_ids()));

-- Owners can delete their own payment methods
create policy "owners delete own payment methods"
  on public.payment_methods for delete
  using (business_id in (select public.my_business_ids()));

-- Superadmin has full platform access
create policy "superadmin full access payment methods"
  on public.payment_methods for all
  using (public.is_superadmin())
  with check (public.is_superadmin());

-- ------------------------------------------------------------
-- Indexes
-- ------------------------------------------------------------
create index if not exists payment_methods_business_idx
  on public.payment_methods (business_id, sort_order);

create index if not exists payment_methods_type_idx
  on public.payment_methods (type, is_enabled);
