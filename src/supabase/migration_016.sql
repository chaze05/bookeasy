-- ============================================================
-- Migration 016: Booking rules, party size, add-ons
-- ============================================================
-- businesses: min_lead_hours, booking_horizon_days, buffer_minutes
-- services:   party_size_enabled, max_party_size, seats_per_slot
-- bookings:   party_size
-- service_addons + booking_addons for extras/upsells
-- Safe to re-run.
-- ============================================================

alter table public.businesses
  add column if not exists min_lead_hours integer not null default 0,
  add column if not exists booking_horizon_days integer not null default 60,
  add column if not exists buffer_minutes integer not null default 0;

alter table public.businesses drop constraint if exists businesses_booking_rules_check;
alter table public.businesses add constraint businesses_booking_rules_check
  check (
    min_lead_hours between 0 and 720
    and booking_horizon_days between 1 and 730
    and buffer_minutes between 0 and 240
  );

alter table public.services
  add column if not exists party_size_enabled boolean not null default false,
  add column if not exists max_party_size integer not null default 1,
  add column if not exists seats_per_slot integer;

alter table public.services drop constraint if exists services_party_size_check;
alter table public.services add constraint services_party_size_check
  check (
    max_party_size between 1 and 100
    and (seats_per_slot is null or seats_per_slot between 1 and 1000)
  );

alter table public.bookings
  add column if not exists party_size integer not null default 1;

create table if not exists public.service_addons (
  id           uuid        primary key default uuid_generate_v4(),
  business_id  uuid        not null references public.businesses(id) on delete cascade,
  service_id   uuid        not null references public.services(id) on delete cascade,
  name         text        not null,
  price        numeric(10,2) not null default 0,
  max_quantity integer     not null default 1,
  is_active    boolean     not null default true,
  sort_order   integer     not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.booking_addons (
  id         uuid        primary key default uuid_generate_v4(),
  booking_id uuid        not null references public.bookings(id) on delete cascade,
  addon_id   uuid        references public.service_addons(id) on delete set null,
  name       text        not null,
  price      numeric(10,2) not null default 0,
  quantity   integer     not null default 1
);

create index if not exists service_addons_service_idx on public.service_addons (service_id, sort_order);
create index if not exists booking_addons_booking_idx on public.booking_addons (booking_id);

alter table public.service_addons enable row level security;
alter table public.booking_addons enable row level security;
-- No RLS policies: server-only via Prisma.
