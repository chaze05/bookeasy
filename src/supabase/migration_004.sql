-- Migration 004: Payment proof fields on bookings

alter table public.bookings
  add column if not exists payment_method_id uuid references public.payment_methods(id) on delete set null,
  add column if not exists payment_proof_url text;

create index if not exists bookings_payment_method_idx
  on public.bookings (payment_method_id);
