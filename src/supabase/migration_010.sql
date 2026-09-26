-- ============================================================
-- Migration 010: Deposit / partial payment support
-- ============================================================
-- businesses.deposit_type: 'none' | 'percent' | 'fixed'
-- businesses.deposit_value: percent (0-100) or fixed amount
-- bookings.amount_total: service price captured at booking time
-- bookings.deposit_amount: amount to collect up front to reserve
-- Safe to re-run.
-- ============================================================

alter table public.businesses
  add column if not exists deposit_type  text          not null default 'none',
  add column if not exists deposit_value numeric(10,2) not null default 0;

alter table public.businesses
  drop constraint if exists businesses_deposit_type_check;

alter table public.businesses
  add constraint businesses_deposit_type_check
  check (deposit_type in ('none', 'percent', 'fixed'));

alter table public.bookings
  add column if not exists amount_total   numeric(10,2),
  add column if not exists deposit_amount numeric(10,2);
