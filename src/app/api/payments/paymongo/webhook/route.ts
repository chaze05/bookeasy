import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifyPaymongoSignature } from "@/lib/paymongo";
import { decryptSecret } from "@/lib/crypto";
import { buildManageUrl } from "@/lib/booking-tokens";
import { getAppBaseUrl } from "@/lib/notify";
import { sendBookingApprovedEmail } from "@/lib/email";
import { formatZonedDate, formatZonedTime, safeTimeZone } from "@/lib/timezone";

export const dynamic = "force-dynamic";

interface PaymongoWebhookPayload {
  data?: {
    attributes?: {
      type?: string;
      data?: {
        id?: string;
        attributes?: {
          metadata?: Record<string, string>;
          reference_number?: string;
        };
      };
    };
  };
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  let payload: PaymongoWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as PaymongoWebhookPayload;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const eventType = payload.data?.attributes?.type;
  if (eventType !== "checkout_session.payment.paid") {
    // Acknowledge other events so PayMongo does not retry them.
    return Response.json({ received: true });
  }

  const session = payload.data?.attributes?.data;
  const sessionId = session?.id;
  const bookingIdFromMetadata = session?.attributes?.metadata?.booking_id;

  const payment = sessionId
    ? await prisma.payment.findFirst({ where: { provider_ref: sessionId } })
    : bookingIdFromMetadata
      ? await prisma.payment.findFirst({
          where: { booking_id: bookingIdFromMetadata },
          orderBy: { created_at: "desc" },
        })
      : null;

  // Nothing to do for unknown sessions (e.g. manual PayMongo links).
  if (!payment) return Response.json({ received: true });

  const business = await prisma.business.findUnique({
    where: { id: payment.business_id },
    select: { paymongo_webhook_secret_encrypted: true },
  });
  if (!business?.paymongo_webhook_secret_encrypted) {
    console.error("[paymongo webhook] webhook secret not configured for business", payment.business_id);
    return new Response("Webhook secret not configured", { status: 400 });
  }

  const signature = request.headers.get("paymongo-signature");
  const valid = verifyPaymongoSignature(
    rawBody,
    signature,
    decryptSecret(business.paymongo_webhook_secret_encrypted)
  );
  if (!valid) {
    console.warn("[paymongo webhook] invalid signature for session", sessionId);
    return new Response("Invalid signature", { status: 401 });
  }

  // Idempotent: webhooks can be retried.
  if (payment.status !== "paid") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "paid", raw_event: payload as object, updated_at: new Date() },
    });

    const booking = await prisma.booking.findUnique({
      where: { id: payment.booking_id },
      include: {
        business: { select: { name: true, timezone: true, contact_email: true } },
        service: { select: { name: true } },
      },
    });

    if (booking) {
      const deposit = Number(booking.deposit_amount ?? 0);
      const total = Number(booking.amount_total ?? 0);
      const paymentStatus = deposit > 0 && deposit < total ? "deposit_paid" : "paid";
      const wasPending = booking.status === "pending";

      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          payment_status: paymentStatus,
          status: wasPending ? "confirmed" : booking.status,
          updated_at: new Date(),
        },
      });

      if (wasPending && booking.customer_email) {
        const timeZone = safeTimeZone(booking.business.timezone);
        let manageUrl: string | undefined;
        try {
          manageUrl = buildManageUrl(await getAppBaseUrl(), booking.id);
        } catch (error) {
          console.error("[paymongo webhook] failed to build manage link:", error);
        }
        await sendBookingApprovedEmail({
          to: booking.customer_email,
          businessEmail: booking.business.contact_email ?? undefined,
          customerName: booking.customer_name,
          businessName: booking.business.name,
          serviceName: booking.service.name,
          date: formatZonedDate(booking.starts_at, timeZone, { dateStyle: "long" }),
          time: formatZonedTime(booking.starts_at, timeZone),
          manageUrl,
        });
      }
    }

    revalidatePath("/dashboard/bookings");
    revalidatePath("/dashboard");
  }

  return Response.json({ received: true });
}
