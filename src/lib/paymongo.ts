import { createHmac, timingSafeEqual } from "node:crypto";

const PAYMONGO_API = "https://api.paymongo.com/v1";

function authHeader(secretKey: string): string {
  return `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
}

export interface PaymongoCheckoutInput {
  secretKey: string;
  /** Amount in centavos (₱1.00 = 100). */
  amount: number;
  description: string;
  referenceNumber: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface PaymongoCheckoutResult {
  id: string;
  checkoutUrl: string;
}

/** Creates a hosted PayMongo Checkout Session and returns its URL. */
export async function createPaymongoCheckout(
  input: PaymongoCheckoutInput
): Promise<PaymongoCheckoutResult> {
  const response = await fetch(`${PAYMONGO_API}/checkout_sessions`, {
    method: "POST",
    headers: {
      Authorization: authHeader(input.secretKey),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        attributes: {
          line_items: [
            {
              amount: input.amount,
              currency: "PHP",
              name: input.description,
              quantity: 1,
            },
          ],
          success_url: input.successUrl,
          cancel_url: input.cancelUrl,
          reference_number: input.referenceNumber,
          metadata: input.metadata,
        },
      },
    }),
  });

  const json = (await response.json().catch(() => null)) as {
    data?: { id: string; attributes: { checkout_url: string } };
    errors?: Array<{ detail?: string }>;
  } | null;

  if (!response.ok || !json?.data) {
    const detail = json?.errors?.[0]?.detail ?? `PayMongo request failed (${response.status})`;
    throw new Error(detail);
  }

  return { id: json.data.id, checkoutUrl: json.data.attributes.checkout_url };
}

/**
 * Verifies the `Paymongo-Signature` header.
 * Header format: `t=<timestamp>,te=<test sig>,li=<live sig>`
 * Signature = HMAC-SHA256 hex of `<t>.<rawBody>` using the webhook secret.
 */
export function verifyPaymongoSignature(
  rawBody: string,
  signatureHeader: string | null,
  webhookSecret: string
): boolean {
  if (!signatureHeader) return false;

  const parts = new Map<string, string>();
  for (const pair of signatureHeader.split(",")) {
    const index = pair.indexOf("=");
    if (index > 0) parts.set(pair.slice(0, index).trim(), pair.slice(index + 1).trim());
  }

  const timestamp = parts.get("t");
  if (!timestamp) return false;

  const expected = createHmac("sha256", webhookSecret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  const expectedBuffer = Buffer.from(expected);

  for (const candidate of [parts.get("te"), parts.get("li")]) {
    if (!candidate) continue;
    const candidateBuffer = Buffer.from(candidate);
    if (
      candidateBuffer.length === expectedBuffer.length &&
      timingSafeEqual(candidateBuffer, expectedBuffer)
    ) {
      return true;
    }
  }

  return false;
}
