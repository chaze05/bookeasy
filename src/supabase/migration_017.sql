-- ============================================================
-- Migration 017: AI generation log (rate limiting)
-- ============================================================
-- One row per AI generation request. Used to cap usage per
-- business (e.g. 30 generations per hour). Server-only via Prisma.
-- Safe to re-run.
-- ============================================================

create table if not exists public.ai_generations (
  id          uuid        primary key default uuid_generate_v4(),
  business_id uuid        not null references public.businesses(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create index if not exists ai_generations_business_idx
  on public.ai_generations (business_id, created_at desc);

alter table public.ai_generations enable row level security;
-- No RLS policies: written only through server actions via Prisma.
