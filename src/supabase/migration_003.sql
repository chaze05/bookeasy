-- ============================================================
-- Migration 003: Homepage CMS
-- Run this in the Supabase SQL editor.
-- Safe to re-run: uses IF NOT EXISTS and WHERE NOT EXISTS guards.
-- ============================================================

-- 1. Create table
create table if not exists public.homepage_config (
  id          uuid        primary key default uuid_generate_v4(),
  section_key text        not null,
  content     jsonb       not null default '{}',
  is_active   boolean     not null default true,
  order_index int         not null default 0,
  updated_at  timestamptz not null default now()
);

-- 2. updated_at trigger (reuses set_updated_at() from migration_001)
drop trigger if exists set_homepage_config_updated_at on public.homepage_config;
create trigger set_homepage_config_updated_at
  before update on public.homepage_config
  for each row execute function public.set_updated_at();

-- 3. RLS
alter table public.homepage_config enable row level security;

drop policy if exists "public read homepage sections"  on public.homepage_config;
drop policy if exists "superadmin manage homepage"     on public.homepage_config;

-- Anyone can read all sections (filtering active/inactive happens in app)
create policy "public read homepage sections"
  on public.homepage_config for select
  using (true);

-- Superadmin has full write access
create policy "superadmin manage homepage"
  on public.homepage_config for all
  using (public.is_superadmin())
  with check (public.is_superadmin());

-- 4. Index
create index if not exists homepage_config_order_idx
  on public.homepage_config (order_index, is_active);

-- 5. Default sections (safe to re-run — only inserts if section not present)
insert into public.homepage_config (section_key, order_index, is_active, content)
select 'hero', 0, true, '{
  "badge": "Now in public beta",
  "title": "Booking software that",
  "title_highlight": "just works.",
  "subtitle": "Give your clients an effortless booking experience while you stay in control with a beautiful, powerful dashboard.",
  "primary_cta_text": "Start for free",
  "primary_cta_href": "/register",
  "secondary_cta_text": "See a live demo",
  "secondary_cta_href": "/glow-beauty-studio",
  "trust_line": "No credit card required · Trusted by 500+ businesses"
}'::jsonb
where not exists (select 1 from public.homepage_config where section_key = 'hero');

insert into public.homepage_config (section_key, order_index, is_active, content)
select 'social_proof', 1, true, '{
  "heading": "Trusted by service businesses everywhere",
  "stats": [
    {"value": "500+", "label": "Active businesses"},
    {"value": "12k+", "label": "Bookings per month"},
    {"value": "4.9", "label": "Average rating"}
  ],
  "testimonials": [
    {
      "quote": "BookEasy cut our no-show rate by 40%. Clients love the automated reminders.",
      "author": "Jessica Lee",
      "role": "Owner, Glow Beauty Studio",
      "initials": "JL"
    },
    {
      "quote": "Set up in 5 minutes. Our clients book online 24/7 now — no more phone tag.",
      "author": "Marcus Reid",
      "role": "Owner, FitZone Performance",
      "initials": "MR"
    }
  ]
}'::jsonb
where not exists (select 1 from public.homepage_config where section_key = 'social_proof');

insert into public.homepage_config (section_key, order_index, is_active, content)
select 'features', 2, true, '{
  "heading": "Everything you need to run your bookings",
  "subheading": "Built for salons, studios, consultants, and any service business that wants to stop losing clients to scheduling friction.",
  "features": [
    {"icon": "CalendarCheck", "title": "Smart Scheduling",     "description": "Automated booking logic respects staff availability, blocked dates, and service durations."},
    {"icon": "Users",         "title": "Multi-Staff Support",  "description": "Assign services to individual team members and manage their availability separately."},
    {"icon": "BarChart3",     "title": "Real-Time Analytics",  "description": "Track revenue, booking trends, and no-show rates from a single dashboard."},
    {"icon": "Globe",         "title": "Public Booking Page",  "description": "Each business gets a shareable URL so clients can book 24/7 without a login."},
    {"icon": "Shield",        "title": "Secure by Default",    "description": "Row-level security ensures each business only sees its own data."},
    {"icon": "Zap",           "title": "Instant Setup",        "description": "Create your business, add services and staff, and go live in under five minutes."}
  ]
}'::jsonb
where not exists (select 1 from public.homepage_config where section_key = 'features');

insert into public.homepage_config (section_key, order_index, is_active, content)
select 'cta', 3, true, '{
  "heading": "Ready to take back your schedule?",
  "subheading": "Create your business in minutes.",
  "primary_cta_text": "Get started for free",
  "primary_cta_href": "/register",
  "secondary_cta_text": "Sign in",
  "secondary_cta_href": "/login",
  "trust_items": ["No credit card required", "Cancel any time", "Free plan available"]
}'::jsonb
where not exists (select 1 from public.homepage_config where section_key = 'cta');
