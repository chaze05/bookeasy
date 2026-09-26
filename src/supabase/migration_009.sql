-- ============================================================
-- Migration 009: Homepage pricing section
-- ============================================================
-- Inserts the default pricing section and places it after
-- features / before the final CTA. Safe to re-run.
-- ============================================================

insert into public.homepage_config (section_key, order_index, is_active, content)
select
  'pricing',
  3,
  true,
  $content$
  {
    "heading": "Simple, transparent pricing",
    "subheading": "Start free, then upgrade when you outgrow it. No hidden fees, cancel anytime.",
    "billing_note": "Prices in PHP. VAT may apply.",
    "plans": [
      {
        "name": "Starter",
        "price": "₱0",
        "period": "/month",
        "description": "For solo owners taking their first online bookings.",
        "features": "1 staff member\n50 bookings / month\nPublic booking page\nGCash, Maya, bank & cash payments\nEmail notifications",
        "cta_text": "Start for free",
        "cta_href": "/register",
        "highlighted": "",
        "badge": ""
      },
      {
        "name": "Pro",
        "price": "₱799",
        "period": "/month",
        "description": "For growing teams that want to fill their calendar on autopilot.",
        "features": "Up to 5 staff members\nUnlimited bookings\nOnline payments\nAutomated email reminders\nAnalytics & reports\nPriority support",
        "cta_text": "Start 14-day trial",
        "cta_href": "/register",
        "highlighted": "true",
        "badge": "Most popular"
      },
      {
        "name": "Business",
        "price": "₱1,999",
        "period": "/month",
        "description": "For multi-branch and high-volume service businesses.",
        "features": "Unlimited staff & locations\nCustom branding & domain\nSMS reminders\nAdvanced reporting & exports\nDedicated onboarding",
        "cta_text": "Get started",
        "cta_href": "/register",
        "highlighted": "",
        "badge": ""
      }
    ]
  }
  $content$::jsonb
where not exists (select 1 from public.homepage_config where section_key = 'pricing');

-- Keep the final CTA after pricing
update public.homepage_config
  set order_index = 4
  where section_key = 'cta' and order_index <= 3;
