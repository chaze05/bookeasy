-- Migration 006: Add cash payment method type

alter table public.payment_methods
  drop constraint if exists payment_methods_type_check;

alter table public.payment_methods
  add constraint payment_methods_type_check
  check (type in ('stripe', 'gcash', 'maya', 'wise', 'bank_transfer', 'cash'));
