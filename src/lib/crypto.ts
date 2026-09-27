import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * AES-256-GCM encryption for secrets stored in the database
 * (e.g. per-business PayMongo keys).
 *
 * Key resolution:
 *  1. PAYMENTS_ENCRYPTION_KEY (recommended) — hex, base64 or passphrase
 *  2. derived from SUPABASE_SERVICE_ROLE_KEY (works without extra config,
 *     but set a dedicated key in production)
 */

function getKey(): Buffer {
  const raw = process.env.PAYMENTS_ENCRYPTION_KEY;
  if (raw) {
    if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
    return createHash("sha256").update(raw).digest();
  }
  const fallback = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!fallback) throw new Error("PAYMENTS_ENCRYPTION_KEY is not configured");
  return createHash("sha256").update(`bookeasy:${fallback}`).digest();
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptSecret(payload: string): string {
  const [version, ivB64, tagB64, dataB64] = payload.split(":");
  if (version !== "v1" || !ivB64 || !tagB64 || !dataB64) {
    throw new Error("Invalid encrypted value");
  }
  const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
