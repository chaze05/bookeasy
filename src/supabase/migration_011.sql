-- ============================================================
-- Migration 011: Pricing — raise Pro plan to ₱999
-- ============================================================
-- Idempotent: only rewrites the Pro plan while it still shows ₱799.
-- ============================================================

update public.homepage_config
set content = jsonb_set(
  content,
  '{plans}',
  (
    select jsonb_agg(
      case
        when plan->>'name' = 'Pro' then jsonb_set(plan, '{price}', '"₱999"')
        else plan
      end
    )
    from jsonb_array_elements(content->'plans') as plan
  ),
  false
)
where section_key = 'pricing'
  and exists (
    select 1
    from jsonb_array_elements(content->'plans') as plan
    where plan->>'name' = 'Pro' and plan->>'price' = '₱799'
  );
