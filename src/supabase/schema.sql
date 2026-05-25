-- ============================================================
-- Escape Goat Booking — Database Schema
-- Multi-tenant: every business-owned table is isolated via
-- business_id + Row Level Security policies.
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- BUSINESSES
-- One row per tenant. Slug is used in the public booking URL.
-- ------------------------------------------------------------
create table public.businesses (
  id          uuid primary key default uuid_generate_v4(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  slug        text not null unique,
  description text,
  logo_url    text,
  timezone    text not null default 'UTC',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- PROFILES
-- Extended user data. Created automatically on signup via
-- trigger. Linked 1-to-1 with auth.users.
-- ------------------------------------------------------------
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  avatar_url text,
  phone      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------
-- SERVICES
-- Each business defines the services it offers.
-- ------------------------------------------------------------
create table public.services (
  id          uuid primary key default uuid_generate_v4(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name        text not null,
  description text,
  duration    int  not null, -- minutes
  price       numeric(10, 2) not null default 0,
  color       text not null default '#10b981',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- STAFF
-- Staff members belong to one business. They can be linked to
-- an auth user (so they can log in) or be unlinked (offline).
-- ------------------------------------------------------------
create table public.staff (
  id          uuid primary key default uuid_generate_v4(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,
  full_name   text not null,
  email       text,
  avatar_url  text,
  role        text not null default 'staff', -- 'owner' | 'staff'
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- AVAILABILITY
-- Weekly recurring schedule per staff member.
-- day_of_week: 0 = Sunday … 6 = Saturday
-- ------------------------------------------------------------
create table public.availability (
  id          uuid primary key default uuid_generate_v4(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  staff_id    uuid not null references public.staff(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time  time not null,
  end_time    time not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  constraint no_overlap unique (staff_id, day_of_week, start_time)
);

-- ------------------------------------------------------------
-- BLOCKED_DATES
-- One-off blocks at business or staff level.
-- staff_id = null  → entire business is blocked that day
-- staff_id = <id>  → only that staff member is blocked
-- ------------------------------------------------------------
create table public.blocked_dates (
  id          uuid primary key default uuid_generate_v4(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  staff_id    uuid references public.staff(id) on delete cascade,
  blocked_on  date not null,
  reason      text,
  created_at  timestamptz not null default now(),
  constraint unique_block unique (business_id, staff_id, blocked_on)
);

-- ------------------------------------------------------------
-- BOOKINGS
-- Customer-facing reservations.
-- status: pending | confirmed | cancelled | no_show | completed
-- ------------------------------------------------------------
create table public.bookings (
  id              uuid primary key default uuid_generate_v4(),
  business_id     uuid not null references public.businesses(id) on delete cascade,
  service_id      uuid not null references public.services(id),
  staff_id        uuid references public.staff(id) on delete set null,
  customer_name   text not null,
  customer_email  text not null,
  customer_phone  text,
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  status          text not null default 'pending'
                  check (status in ('pending','confirmed','cancelled','no_show','completed')),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.businesses   enable row level security;
alter table public.profiles     enable row level security;
alter table public.services     enable row level security;
alter table public.staff        enable row level security;
alter table public.availability enable row level security;
alter table public.blocked_dates enable row level security;
alter table public.bookings     enable row level security;

-- Helper: returns the business_ids owned by the requesting user
create or replace function public.my_business_ids()
returns setof uuid language sql security definer stable as $$
  select id from public.businesses where owner_id = auth.uid();
$$;

-- BUSINESSES
create policy "owners can manage their businesses"
  on public.businesses for all using (owner_id = auth.uid());

-- PROFILES
create policy "users manage their own profile"
  on public.profiles for all using (id = auth.uid());

-- SERVICES
create policy "owners manage services"
  on public.services for all
  using (business_id in (select public.my_business_ids()));

create policy "public can read active services"
  on public.services for select using (is_active = true);

-- STAFF
create policy "owners manage staff"
  on public.staff for all
  using (business_id in (select public.my_business_ids()));

create policy "public can read active staff"
  on public.staff for select using (is_active = true);

-- AVAILABILITY
create policy "owners manage availability"
  on public.availability for all
  using (business_id in (select public.my_business_ids()));

create policy "public can read availability"
  on public.availability for select using (is_active = true);

-- BLOCKED_DATES
create policy "owners manage blocked dates"
  on public.blocked_dates for all
  using (business_id in (select public.my_business_ids()));

create policy "public can read blocked dates"
  on public.blocked_dates for select using (true);

-- BOOKINGS
create policy "owners manage bookings"
  on public.bookings for all
  using (business_id in (select public.my_business_ids()));

create policy "customers can insert bookings"
  on public.bookings for insert with check (true);

-- ============================================================
-- INDEXES for performance
-- ============================================================
create index on public.bookings (business_id, starts_at);
create index on public.bookings (staff_id, starts_at);
create index on public.blocked_dates (business_id, blocked_on);
create index on public.availability (staff_id, day_of_week);
