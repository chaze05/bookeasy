import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Lightweight production diagnostics — reports configuration presence only
 * (never values of secrets) plus database connectivity. Safe to expose.
 */
export async function GET() {
  let database = false;
  try {
    await prisma.$queryRaw`select 1`;
    database = true;
  } catch {
    database = false;
  }

  return Response.json({
    ok: database,
    database,
    email: {
      provider: (process.env.EMAIL_PROVIDER ?? "resend-first").toLowerCase(),
      resendKey: Boolean(process.env.RESEND_API_KEY),
      brevoKey: Boolean(process.env.BREVO_API_KEY),
      fromEmail: process.env.NEXT_PUBLIC_FROM_EMAIL ?? null,
    },
    payments: {
      paymongoEncryptionKey: Boolean(process.env.PAYMENTS_ENCRYPTION_KEY),
    },
    cron: {
      secretConfigured: Boolean(process.env.CRON_SECRET),
    },
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? null,
    checkedAt: new Date().toISOString(),
  });
}
