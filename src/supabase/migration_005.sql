-- Migration 005: Business subscription payment proofs

create table if not exists public.subscription_payments (
  id                  uuid primary key default uuid_generate_v4(),
  business_id         uuid not null references public.businesses(id) on delete cascade,
  payment_method_type text not null,
  payment_proof_url   text not null,
  status              text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  notes               text,
  created_at          timestamptz not null default now()
);

alter table public.subscription_payments enable row level security;

drop policy if exists "owners read own subscription payments" on public.subscription_payments;
drop policy if exists "owners insert own subscription payments" on public.subscription_payments;
drop policy if exists "superadmin full access subscription payments" on public.subscription_payments;

create policy "owners read own subscription payments"
  on public.subscription_payments for select
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_id and b.owner_id = auth.uid()
    )
  );

create policy "owners insert own subscription payments"
  on public.subscription_payments for insert
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = business_id and b.owner_id = auth.uid()
    )
  );

create policy "superadmin full access subscription payments"
  on public.subscription_payments for all
  using (public.is_superadmin())
  with check (public.is_superadmin());

create index if not exists subscription_payments_business_idx
  on public.subscription_payments (business_id, created_at desc);
