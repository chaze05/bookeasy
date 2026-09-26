-- ============================================================
-- Migration 008: Business contact email + currency
-- ============================================================
-- contact_email: where booking notifications for the owner are
--   sent. Falls back to the owner's auth email when null.
-- currency: ISO 4217 code used for prices and payment amounts.
-- Safe to re-run.
-- ============================================================

alter table public.businesses
  add column if not exists contact_email text,
  add column if not exists currency text not null default 'PHP';

alter table public.businesses
  drop constraint if exists businesses_currency_check;

alter table public.businesses
  add constraint businesses_currency_check
  check (currency in ('PHP', 'USD', 'EUR', 'GBP', 'AUD', 'SGD', 'CAD', 'JPY', 'AED'));
