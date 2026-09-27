-- ============================================================
-- Migration 014: Subscription plans + enforcement
-- ============================================================
-- businesses.plan: 'free' | 'pro' | 'business'
-- businesses.plan_expires_at: paid plans expire back to free
-- subscription_payments.plan: which plan the owner is paying for
-- Safe to re-run.
-- ============================================================

alter table public.businesses
  add column if not exists plan text not null default 'free',
  add column if not exists plan_expires_at timestamptz;

alter table public.businesses
  drop constraint if exists businesses_plan_check;

alter table public.businesses
  add constraint businesses_plan_check
  check (plan in ('free', 'pro', 'business'));

alter table public.subscription_payments
  add column if not exists plan text not null default 'pro';

alter table public.subscription_payments
  drop constraint if exists subscription_payments_plan_check;

alter table public.subscription_payments
  add constraint subscription_payments_plan_check
  check (plan in ('free', 'pro', 'business'));

create index if not exists businesses_plan_idx on public.businesses (plan, plan_expires_at);
