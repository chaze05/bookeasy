-- ============================================================
-- Migration 013: Booking reminder tracking
-- ============================================================
-- reminder_sent_at records when the 24h reminder email went out so
-- the cron job does not send duplicates. Safe to re-run.
-- ============================================================

alter table public.bookings
  add column if not exists reminder_sent_at timestamptz;

create index if not exists bookings_reminder_idx
  on public.bookings (starts_at) where reminder_sent_at is null;
