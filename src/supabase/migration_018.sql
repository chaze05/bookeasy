-- ============================================================
-- Migration 018: Paid Starter + 14-day free trial
-- ============================================================
-- - New plan value 'starter' (₱799) alongside pro/business.
-- - 'free' now means "trial": new businesses get 14 days of Pro
--   features via trial_ends_at; after expiry they are locked until
--   they subscribe to a paid plan.
-- - Update live homepage pricing copy.
-- Safe to re-run.
-- ============================================================

alter table public.businesses
  add column if not exists trial_ends_at timestamptz;

alter table public.businesses drop constraint if exists businesses_plan_check;
alter table public.businesses add constraint businesses_plan_check
  check (plan in ('free', 'starter', 'pro', 'business'));

-- Existing free businesses get a fresh trial window.
update public.businesses
  set trial_ends_at = now() + interval '14 days'
  where plan = 'free' and trial_ends_at is null;

-- Pricing section: Starter now ₱799, trial messaging everywhere.
update public.homepage_config
set content = jsonb_set(
  jsonb_set(
    content,
    '{billing_note}',
    '"14-day free trial on every plan. No credit card required."'
  ),
  '{plans}',
  (
    select jsonb_agg(
      case
        when plan->>'name' = 'Starter' then
          jsonb_set(
            jsonb_set(plan, '{price}', '"₱799"'),
            '{cta_text}', '"Start 14-day trial"'
          )
        when plan->>'name' = 'Pro' then
          jsonb_set(plan, '{cta_text}', '"Start 14-day trial"')
        else plan
      end
    )
    from jsonb_array_elements(content->'plans') as plan
  ),
  false
)
where section_key = 'pricing';

-- CTA trust item: no more free-forever plan.
update public.homepage_config
set content = jsonb_set(
  content,
  '{trust_items}',
  (
    select jsonb_agg(
      case when item = '"Free plan available"'::jsonb then '"14-day free trial"'::jsonb else item end
    )
    from jsonb_array_elements(coalesce(content->'trust_items', '[]'::jsonb)) as item
  ),
  false
)
where section_key = 'cta';

-- Hero + CTA button wording.
update public.homepage_config
set content = jsonb_set(content, '{primary_cta_text}', '"Start 14-day trial"')
where section_key in ('hero', 'cta');
