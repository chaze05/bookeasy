-- ============================================================
-- Migration 012: PayMongo online payments
-- ============================================================
-- Per-business PayMongo accounts: each business connects its own
-- secret key (stored encrypted) so money never passes through the
-- platform. Bookings gain a payment_status; payments table records
-- checkout sessions and webhook outcomes. Safe to re-run.
-- ============================================================

alter table public.businesses
  add column if not exists paymongo_enabled boolean not null default false,
  add column if not exists paymongo_secret_key_encrypted text,
  add column if not exists paymongo_webhook_secret_encrypted text;

alter table public.bookings
  add column if not exists payment_status text not null default 'unpaid';

alter table public.bookings
  drop constraint if exists bookings_payment_status_check;

alter table public.bookings
  add constraint bookings_payment_status_check
  check (payment_status in ('unpaid', 'deposit_paid', 'paid', 'refunded'));

-- New payment method type: online checkout (PayMongo)
alter table public.payment_methods
  drop constraint if exists payment_methods_type_check;

alter table public.payment_methods
  add constraint payment_methods_type_check
  check (type in ('stripe', 'gcash', 'maya', 'wise', 'bank_transfer', 'cash', 'paymongo'));

create table if not exists public.payments (
  id           uuid        primary key default uuid_generate_v4(),
  booking_id   uuid        not null references public.bookings(id) on delete cascade,
  business_id  uuid        not null references public.businesses(id) on delete cascade,
  provider     text        not null default 'paymongo',
  provider_ref text,
  checkout_url text,
  amount       numeric(10,2) not null,
  currency     text        not null default 'PHP',
  status       text        not null default 'pending'
               check (status in ('pending', 'paid', 'failed', 'expired', 'refunded')),
  raw_event    jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists payments_booking_idx on public.payments (booking_id);
create unique index if not exists payments_provider_ref_idx
  on public.payments (provider_ref) where provider_ref is not null;

alter table public.payments enable row level security;
-- No RLS policies: this table is only read/written server-side via Prisma.
