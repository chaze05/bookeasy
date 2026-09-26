import { createHmac, timingSafeEqual } from "node:crypto";

export type BookingAction = "confirm" | "decline";

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function getSecret(): string {
  const secret = process.env.BOOKING_ACTION_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("BOOKING_ACTION_SECRET is not configured");
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

/** Creates a token binding a booking + action (confirm/decline) with an expiry. */
export function createBookingActionToken(bookingId: string, action: BookingAction): string {
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const payload = `${bookingId}.${action}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyBookingActionToken(
  token: string
): { bookingId: string; action: BookingAction; expiresAt: number } | null {
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [bookingId, action, expiresAtRaw, signature] = parts;
  if (action !== "confirm" && action !== "decline") return null;
  const expiresAt = Number(expiresAtRaw);
  if (!bookingId || !Number.isFinite(expiresAt)) return null;

  const expected = sign(`${bookingId}.${action}.${expiresAt}`);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  if (Date.now() > expiresAt) return null;
  return { bookingId, action, expiresAt };
}

export function buildBookingActionUrl(baseUrl: string, bookingId: string, action: BookingAction): string {
  const token = createBookingActionToken(bookingId, action);
  return `${baseUrl.replace(/\/$/, "")}/api/bookings/action?token=${encodeURIComponent(token)}`;
}
