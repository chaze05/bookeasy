/**
 * Rotates the passwords of the three demo/seed accounts whose passwords were
 * previously hardcoded in prisma/seed.ts.
 *
 * Usage: node scripts/rotate-demo-passwords.mjs
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.
 * New passwords are printed once — save them immediately.
 */
import "dotenv/config";
import { randomBytes } from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const emails = ["admin@bookeasy.app", "owner@glowbeauty.com", "owner@fitzonefit.com"];

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

function generatePassword(length = 16) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  return Array.from(randomBytes(length), (b) => alphabet[b % alphabet.length]).join("");
}

const headers = {
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
  "Content-Type": "application/json",
};

async function main() {
  const listRes = await fetch(`${url}/auth/v1/admin/users?page=1&per_page=200`, { headers });
  const data = await listRes.json();
  const users = data.users ?? [];

  for (const email of emails) {
    const user = users.find((u) => u.email === email);
    if (!user) {
      console.log(`SKIP    ${email} (not found)`);
      continue;
    }

    const password = generatePassword();
    const res = await fetch(`${url}/auth/v1/admin/users/${user.id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      console.error(`FAILED  ${email}: ${await res.text()}`);
      continue;
    }
    console.log(`ROTATED ${email} -> ${password}`);
  }
}

main().catch((error) => {
  console.error("Rotation failed:", error);
  process.exit(1);
});
