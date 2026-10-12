/**
 * Resets the public demo tenant (business "Demo Studio" at /demo).
 *
 * - Recreates services, add-ons, payment methods and the blocked holiday.
 * - Resets the demo account password so shared credentials keep working.
 *
 * Usage: node scripts/reset-demo.mjs
 * Reads NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and DATABASE_URL from .env
 */
import "dotenv/config";
import pg from "pg";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEMO_EMAIL = process.env.DEMO_EMAIL ?? "demo@bookeasy.app";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "BookEasyDemo2026!";
const OWNER_EMAIL = process.env.DEMO_CONTACT_EMAIL ?? "bookeasy.support@gmail.com";

const SVC_MASSAGE = "00000000-0000-0000-0010-000000000001";
const SVC_COURT = "00000000-0000-0000-0010-000000000002";
const SVC_YOGA = "00000000-0000-0000-0010-000000000003";

if (!SUPABASE_URL || !SERVICE_KEY || !process.env.DATABASE_URL) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or DATABASE_URL in .env");
  process.exit(1);
}

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

async function ensureDemoUser() {
  const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=200`, { headers });
  const list = await listRes.json();
  let user = (list.users ?? []).find((entry) => entry.email === DEMO_EMAIL);

  if (user) {
    await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ password: DEMO_PASSWORD, email_confirm: true }),
    });
    return user.id;
  }

  const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASSWORD, email_confirm: true }),
  });
  const created = await createRes.json();
  if (!created.id) throw new Error(`Could not create demo user: ${JSON.stringify(created)}`);
  user = created;
  return user.id;
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 2,
  connectionTimeoutMillis: 15000,
});

try {
  const userId = await ensureDemoUser();

  await pool.query(
    `insert into profiles (id, full_name, role) values ($1, 'Demo Owner', 'owner')
     on conflict (id) do update set role='owner', full_name='Demo Owner'`,
    [userId]
  );

  const biz = await pool.query(
    `insert into businesses (owner_id, name, slug, description, timezone, currency, plan, plan_expires_at,
      allow_multiple_bookings, max_bookings_per_slot, booking_interval, business_hours_start, business_hours_end,
      min_lead_hours, booking_horizon_days, buffer_minutes, deposit_type, deposit_value, contact_email, status, realtime_enabled)
     values ($1, 'Demo Studio', 'demo', 'Try BookEasy with this demo business — massage, pickleball courts and yoga classes.',
      'Asia/Manila', 'PHP', 'business', null, true, 3, 30, '09:00', '18:00', 2, 60, 15, 'percent', 30, $2, 'active', true)
     on conflict (slug) do update set owner_id=$1, plan='business', plan_expires_at=null,
      allow_multiple_bookings=true, max_bookings_per_slot=3, booking_interval=30,
      business_hours_start='09:00', business_hours_end='18:00',
      min_lead_hours=2, booking_horizon_days=60, buffer_minutes=15,
      deposit_type='percent', deposit_value=30, contact_email=$2, status='active', name='Demo Studio'
     returning id`,
    [userId, OWNER_EMAIL]
  );
  const businessId = biz.rows[0].id;

  await pool.query(`delete from services where business_id=$1`, [businessId]);
  await pool.query(
    `insert into services (id, business_id, name, description, duration, price, color, is_active, party_size_enabled, max_party_size, seats_per_slot) values
     ($1,$4,'Deep Tissue Massage','Relaxing full-body massage with essential oils.',60,800,'#34d399',true,false,1,null),
     ($2,$4,'Pickleball Court (1 hour)','Reserve a court. Book once for your whole group.',60,400,'#3b82f6',true,true,4,null),
     ($3,$4,'Yoga Class','Small-group class — reserve your mat.',60,300,'#8b5cf6',true,true,12,12)`,
    [SVC_MASSAGE, SVC_COURT, SVC_YOGA, businessId]
  );

  await pool.query(`delete from service_addons where business_id=$1`, [businessId]);
  await pool.query(
    `insert into service_addons (business_id, service_id, name, price, max_quantity, sort_order) values
     ($1,$2,'Hot stones upgrade',200,1,0),
     ($1,$3,'Paddle rental',50,2,0),
     ($1,$3,'Coaching add-on',300,1,1)`,
    [businessId, SVC_MASSAGE, SVC_COURT]
  );

  await pool.query(`delete from payment_methods where business_id=$1`, [businessId]);
  await pool.query(
    `insert into payment_methods (business_id, type, label, is_enabled, sort_order, details) values
     ($1,'gcash','GCash',true,0,'{"account_name":"Demo Studio","number":"0917-000-0000"}'::jsonb),
     ($1,'cash','Pay at the shop (cash)',true,1,'{"instructions":"Please arrive 10 minutes early."}'::jsonb)`,
    [businessId]
  );

  await pool.query(`delete from blocked_dates where business_id=$1`, [businessId]);
  await pool.query(
    `insert into blocked_dates (business_id, staff_id, blocked_on, reason) values ($1, null, (now() + interval '7 days')::date, 'Public holiday')`,
    [businessId]
  );

  console.log("Demo reset complete.");
  console.log(`  login:    ${DEMO_EMAIL}`);
  console.log(`  password: ${DEMO_PASSWORD}`);
  console.log("  public:   https://bookeasyapp.vercel.app/demo");
} catch (error) {
  console.error("Demo reset failed:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
