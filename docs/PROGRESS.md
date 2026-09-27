# BookEasy — Build Progress Log

Running log of completed work, decisions, and pending items. Newest entries at the top.

## Environment variables to configure before deploy
- `BOOKING_ACTION_SECRET` — HMAC secret for one-click confirm/decline links (falls back to `SUPABASE_SERVICE_ROLE_KEY` if unset; set a dedicated one in production).
- `NEXT_PUBLIC_APP_URL` — absolute app URL used in emails (falls back to request headers when unset).
- `NEXT_PUBLIC_FROM_EMAIL` — verified sender address for Resend/Brevo.
- `RESEND_API_KEY`, `BREVO_API_KEY`, `SUPABASE_*`, `DATABASE_URL`.

## Completed

### 2026-09-27 — Appointment reminders + legal pages (branch `feat/staff-booking-readiness`)
- `migration_013.sql` (applied live): `bookings.reminder_sent_at` + partial index; Prisma regenerated.
- New `BookingReminderEmail` template and `sendBookingReminderEmail` (returns delivery result, Brevo/Resend via `deliverEmail`).
- New cron endpoint `GET /api/cron/reminders`: sends reminders for bookings starting in 12–36 hours, marks `reminder_sent_at` only after a successful send, `CRON_SECRET` protected; wired into `vercel.json` (`0 1 * * *`, 09:00 Manila daily).
- Verified: two test bookings (24h and 72h out) → cron sent exactly 1, only the 24h booking was marked, and the reminder email appears in Brevo's log with a working reschedule link.
- Legal pages: `/privacy` (PH Data Privacy Act / RA 10173 aligned) and `/terms`, design-matched and linked from the homepage footer (fallback defaults + live DB footer row updated).
- Screenshots captured with Playwright (homepage, pricing, booking dialog with staff picker, staff schedules, schedule editor, privacy) and shown for review.

### 2026-09-27 — Staff booking, weekly schedules, days off (branch `feat/staff-booking-readiness`)
- Staff-aware availability engine (`src/actions/bookings.ts`): `getAvailableSlots(..., staffId?)` now respects weekly availability windows, business-wide and per-staff blocked dates, existing staff bookings (interval overlap), inactive staff, and timezone-local slots. Falls back to business-hours/capacity when no staff are configured.
- Customer booking flow: new optional staff picker ("Any available" + team list) in the widget; bookings honour a chosen staff or auto-assign the first free member. Availability + block checks are validated again at booking time, and the atomic insert now guards against overlapping bookings for the assigned staff (different staff can take parallel guests).
- Dashboard staff page: weekly schedule editor per member (day + start/end rows) and a "Days off / blocked dates" card for the whole business or one staff member, with upcoming list and delete.
- New owner actions: `saveStaffAvailability`, `addBlockedDate`, `deleteBlockedDate` (owner-scoped, validated, no interactive transactions).
- Verified with a live-DB test matrix: Sarah 09-12 / Maria 14-18 — Sarah at 10:00 OK, Maria at 10:00 rejected, "Any" at 11:00 auto-assigned Sarah, Sarah at 15:00 rejected, "Any" at 15:00 auto-assigned Maria, inactive staff rejected, staff blocked-day rejected. Typecheck/lint/build clean.

### 2026-09-26 — Email provider selection + production smoke test
- `EMAIL_PROVIDER=brevo` now makes Brevo the primary sender with Resend as fallback (default remains Resend-first). Set in Vercel to use the working Brevo account.
- Smoke-tested https://bookeasyapp.vercel.app: homepage pricing section renders (₱999 / ₱1,999 / "Most popular"), `/api/keepalive` returns success with 1 row, `/glow-beauty-studio` renders live data, PayMongo webhook route reachable (400 on invalid payload).

### 2026-09-26 — PayMongo online payments (per-business accounts)
- `migration_012.sql` applied live: `businesses.paymongo_enabled`, `paymongo_secret_key_encrypted`, `paymongo_webhook_secret_encrypted`; `bookings.payment_status` (`unpaid/deposit_paid/paid/refunded`); new `payments` table (RLS on, server-only); `payment_methods` type check now allows `paymongo`.
- `src/lib/crypto.ts` — AES-256-GCM at-rest encryption for stored secret keys (key from `PAYMENTS_ENCRYPTION_KEY`, fallback derived from the service-role key).
- `src/lib/paymongo.ts` — REST client (no npm package): `createPaymongoCheckout()` (hosted Checkout Session, centavos, PHP) and `verifyPaymongoSignature()` (HMAC-SHA256 of `t.rawBody`, timing-safe, test + live signatures).
- Booking flow: `createPublicBooking` now returns `{ bookingId, checkoutUrl }`. When the selected method is `paymongo`, it charges the deposit (or full amount), creates a checkout session, stores a `payments` row, and the widget redirects the customer to PayMongo. If checkout creation fails, the pending booking is deleted so no orphan remains.
- Webhook: `POST /api/payments/paymongo/webhook` verifies the signature with the business's secret, marks the payment `paid`, sets `payment_status` to `deposit_paid`/`paid`, auto-confirms the booking, and emails the customer. Idempotent on retries.
- Dashboard settings → Payments: new PayMongo card (enable toggle, secret key + webhook signing secret inputs with "saved" indicators, copyable webhook URL). Enabling syncs a public "Pay online (GCash, Maya, card)" method. Encrypted key columns are stripped from the client payload; subscription method query scoped to the owner's business.
- Verified: crypto roundtrip + tamper rejection, signature accept/reject (tampered body, wrong secret, missing header, live signature) all pass; build registers `/api/payments/paymongo/webhook`; unconfigured and fake-key checkout attempts both return clean errors with no orphan bookings; demo business reset to disabled afterwards.

### 2026-09-26 — Pricing tweak
- Raised the Pro plan from ₱799 to ₱999 (`migration_011.sql`, applied live) and updated the fallback default in `src/lib/homepage-content.ts`.

### 2026-09-26 — Customer self-service manage/reschedule page
- `src/lib/booking-tokens.ts`: added signed `manage` tokens (30-day expiry, HMAC, timing-safe) + `buildManageUrl`.
- New page `/booking/manage?token=…` (`src/app/booking/manage/`): no-index, dark-themed, shows booking summary (service, date/time in business timezone, status, deposit/balance) and a client panel to pick a new date/slot and reschedule or cancel. Invalid/expired tokens and non-manageable statuses render friendly messages; "Book again" links back to the business page.
- New server actions (`src/actions/booking-manage.ts`): `getManageSlots`, `rescheduleBooking`, `cancelBookingByToken` — every action verifies the token; reschedule validates hours/interval/past and uses the same atomic pooler-safe single-statement update with advisory lock + capacity check.
- Customer emails: `BookingReceivedEmail` and `BookingApprovedEmail` now include a "Reschedule or cancel" button linking to the manage page; wired through `createPublicBooking`, `updateBookingStatus`, and the one-click confirm route.
- Verified against a production server: page renders (200) for a valid token, rejects an invalid token, and the reschedule statement moved a booking 1 PM → 3 PM Manila (05:00Z → 07:00Z) atomically; test booking cleaned up.
- Follow-up: reschedule/cancel do not yet email the business owner (dashboard reflects the change immediately).

### 2026-09-26 — Deposits / partial payments
- `migration_010.sql` applied live: `businesses.deposit_type` (`none|percent|fixed`), `businesses.deposit_value`, `bookings.amount_total`, `bookings.deposit_amount`.
- Prisma schema + types updated.
- Booking settings (`dashboard/settings`): new Deposit card — type selector (no deposit / percentage / fixed), value input with ₱ / % affordance, helper copy; validated server-side (percent capped 0-100, fixed capped at service price).
- `createPublicBooking` computes `amount_total` + `deposit_amount` and stores them in the atomic insert.
- Public booking widget shows "Deposit due now" plus "Balance … at the appointment" for prepaid methods; cash shows "Pay at the appointment".
- Owner new-booking email shows price, deposit due and remaining balance; dashboard bookings table shows deposit/balance per booking.
- Verified end-to-end: booking with 50% deposit stored `amount_total 40.00` / `deposit_amount 20.00`; demo business reset to no deposit after the test.

### 2026-09-26 — Homepage pricing section (CMS-driven)
- New `src/components/homepage/PricingSection.tsx` matching the existing homepage design (dark zinc/emerald, highlighted plan with glow + badge, per-line feature list, `id="pricing"` anchor for nav links).
- Registered in `HomepageRenderer.tsx`; fallback defaults added in `src/lib/homepage-content.ts` (order: hero → social proof → features → pricing → CTA).
- Superadmin editor extended (`section-editor.tsx`): Pricing label/color and editable fields (plans with name, price, period, badge, description, one-feature-per-line, CTA, highlight flag, billing note).
- `migration_009.sql` applied live: inserts the default pricing content (Starter ₱0 / Pro ₱799 highlighted / Business ₱1,999) and moves CTA after it.
- Verified: production build, homepage HTML contains heading, "Most popular", "₱799" and `id="pricing"`.

### 2026-09-26 — Hotfix: public booking submission (P2028)
- Root-caused the payment submission failure: interactive `prisma.$transaction` is unreliable through the Supabase transaction pooler (`P2028`: "Transaction not found" / "Unable to start a transaction in the given time").
- Replaced it with a single atomic SQL statement in `src/actions/bookings.ts`: `pg_advisory_xact_lock` + capacity count + `INSERT` in one `$queryRaw`, which runs as one implicit transaction and is pooler-safe. Returns `RETURNING id`; empty result means the slot filled up.
- Raised pg pool `connectionTimeoutMillis` to 15s (`src/lib/prisma.ts`).
- Also fixed: `pg_advisory_xact_lock` returns `void`, which Prisma cannot deserialize via `$queryRaw` (now only used inside a CTE that is never selected).
- Verified end-to-end against a real production server: HTTP 200, booking row created with correct Manila→UTC time, proof file uploaded to Supabase Storage, then test row/file cleaned up.
- Note: this also confirmed email delivery is blocked until a sending domain is verified in Resend (currently `bookeasy.app` is unverified) and Brevo rejects unrecognized IPs.
- Important build note: an incremental `next build` served stale chunks once; a clean `.next` rebuild fixed it. Verify changed strings exist in `.next` before testing if something seems off.

### 2026-09-26 — Booking correctness: timezone, atomic slots, owner notifications (batch 1)
- **Timezone engine** — added `src/lib/timezone.ts` (Intl-based, no dependency): `zonedTimeToUtc`, `getZonedDayRange`, `getZonedMinutes`, `getZonedDateKey`, `formatZonedDate/Time`. Unit-checked against Manila (UTC+8), NY DST and NY EST cases (all pass).
- **Slot calculation** (`src/actions/bookings.ts`) now runs entirely in the business timezone: correct day ranges, "today" detection, past-slot filtering, and service is now scoped to the business.
- **Booking creation** validates date/time format, business hours, slot interval, and past times; stores UTC instants derived from the business timezone.
- **Atomic booking** — creation wrapped in `prisma.$transaction` with `pg_advisory_xact_lock(hashtext(business), hashtext(slot))` before the capacity count, so concurrent requests cannot double-book.
- **Owner notification email** — new template `OwnerBookingNotificationEmail` + `sendOwnerNewBookingEmail`. Owner gets an email on every new booking with customer details, proof status, and one-click **Confirm / Decline**.
- **One-click actions** — new `src/lib/booking-tokens.ts` (HMAC-SHA256, 30-day expiry, timing-safe compare) and `src/app/api/bookings/action/route.ts`. GET shows a confirmation page, POST performs the action (prevents email-scanner prefetch from auto-confirming); confirming emails the customer automatically and releases/keeps the slot accordingly.
- **Email layer refactor** — `src/lib/email.ts` now uses a single `deliverEmail()` path with Resend → Brevo fallback; all three senders await delivery (no fire-and-forget loss on serverless). Added CRLF sanitization to prevent header injection.
- **Contact email + currency** — `src/supabase/migration_008.sql` (applied live): `businesses.contact_email`, `businesses.currency` (default `PHP`). Owner notifications use `contact_email` when set, else the owner's auth email. Settings form and validation updated; timezone list now leads with `Asia/Manila`; currency shown on public booking page and widget via `formatMoney`.
- **PH demo data** — seed and live demo businesses switched to `Asia/Manila` / `PHP`; seed booking dates now computed with the timezone helper.
- Files: `src/lib/{timezone,booking-tokens,notify,email,utils,validations}.ts`, `src/actions/{bookings,business}.ts`, `src/app/api/bookings/action/route.ts`, `src/components/emails/OwnerBookingNotificationEmail.tsx`, `src/components/business/{services,booking-widget}.tsx`, `src/app/[slug]/page.tsx`, `src/app/dashboard/business/business-form.tsx`, `prisma/{schema.prisma,seed.ts}`.
- Verified: web + seed typecheck clean, changed files lint clean, `next build` succeeds, timezone + token unit checks pass.

### 2026-09-26 — P0 security hardening
- Added `src/supabase/migration_007.sql` and applied it to the live Supabase project:
  - Dropped public (anon key) SELECT policies on `payment_methods`, `staff`, `availability`, `blocked_dates`, `services`, `homepage_config`.
  - Dropped anonymous INSERT policies on `bookings`, `notifications`, `audit_logs`.
  - Enabled RLS on `keep_alive` with a SELECT-only policy so `/api/keepalive` still works.
  - Verified with anon-key probes: reads return 0 rows, writes return 401.
- Fixed IDOR in `upsertPaymentMethod` / `deletePaymentMethod` (`src/actions/payments.ts`) — both now scope by `business_id`.
- Moved `uploadPaymentProof` out of the `"use server"` module into `src/lib/storage.ts` (no longer client-callable); added MIME whitelist, magic-byte validation, and path-prefix sanitization.
- `createNotification` now requires authentication and restricts recipients to self or superadmin.
- Superadmin password reset now generates a random 14-char password (`src/actions/superadmin.ts`) and the UI shows/copies it.
- Removed hardcoded seed passwords from `prisma/seed.ts`; passwords now come from `SEED_ADMIN_PASSWORD` / `SEED_OWNER_PASSWORD` or are generated once.
- Added `scripts/rotate-demo-passwords.mjs`; rotated the three live demo accounts.

### 2026-09-26 — Next.js config / route-file cleanup
- Removed the `pageExtensions` hack from `next.config.ts`.
- Deleted obsolete `src/middleware.ts`, duplicate `src/proxy.ts`; renamed `src/proxy.tsx` → `src/proxy.ts`.
- Renamed `src/app/api/keepalive/route.tsx` → `route.ts`; deleted dead `src/api/keepalive/route.ts`.
- The three previously dead API route handlers (`/api/homepage`, `/api/superadmin/homepage/section`, `/api/superadmin/homepage/section/[id]`) are now active.
- Added `turbopack.root` to silence the multiple-lockfile workspace warning.

## Pending / Planned (in agreed order)
1. ~~Timezone-correct booking + atomic slot booking + owner notification email~~ - done
2. ~~Homepage pricing section~~ - done
3. ~~Deposits / partial payments~~ - done
4. ~~Customer reschedule / manage page~~ - done
5. Staff logins + permissions
6. Subscription plan enforcement
7. PH Data Privacy Act compliance
8. Receipts (not official invoices)
9. Backups + monitoring
10. PWA + OG images
11. Reviews + testimonials
12. Customer booking reminders (email/SMS)
13. PayMongo integration (PH-first) with webhooks
14. Deploy to Vercel: env vars, verified sender domain, smoke test
15. Follow-ups: email owner on customer reschedule/cancel; refactor duplicated slot validation
