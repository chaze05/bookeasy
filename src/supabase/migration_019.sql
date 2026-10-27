-- ============================================================
-- Migration 019: Free trial only on Pro (₱1,299)
-- ============================================================
-- Starter (₱799) and Business (₱1,999) are billed immediately;
-- only Pro is advertised with the 14-day free trial.
-- Safe to re-run.
-- ============================================================

update public.homepage_config
set content = jsonb_set(
  jsonb_set(
    content,
    '{billing_note}',
    '"14-day free trial on Pro. Prices in PHP, no credit card required."'
  ),
  '{plans}',
  (
    select jsonb_agg(
      case
        when plan->>'name' = 'Starter' then
          jsonb_set(plan, '{cta_text}', '"Choose Starter"')
        when plan->>'name' = 'Pro' then
          jsonb_set(plan, '{cta_text}', '"Start 14-day trial"')
        when plan->>'name' = 'Business' then
          jsonb_set(plan, '{cta_text}', '"Get started"')
        else plan
      end
    )
    from jsonb_array_elements(content->'plans') as plan
  ),
  false
)
where section_key = 'pricing';
