import { prisma } from "@/lib/prisma";
import { sendBookingReminderEmail } from "@/lib/email";
import { buildManageUrl } from "@/lib/booking-tokens";
import { getAppBaseUrl } from "@/lib/notify";
import { formatZonedDate, formatZonedTime, safeTimeZone } from "@/lib/timezone";

export const dynamic = "force-dynamic";

/**
 * Sends appointment reminders for bookings starting in 12–36 hours.
 * Intended to run daily from Vercel Cron (see vercel.json).
 * Protect with CRON_SECRET: Vercel sends `Authorization: Bearer <secret>`.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() + 12 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 36 * 60 * 60 * 1000);

  const bookings = await prisma.booking.findMany({
    where: {
      status: { in: ["pending", "confirmed"] },
      reminder_sent_at: null,
      starts_at: { gte: windowStart, lte: windowEnd },
    },
    include: {
      business: { select: { name: true, timezone: true, contact_email: true } },
      service: { select: { name: true } },
    },
    take: 100,
  });

  let sent = 0;
  let failed = 0;

  for (const booking of bookings) {
    const timeZone = safeTimeZone(booking.business.timezone);
    let manageUrl: string | undefined;
    try {
      manageUrl = buildManageUrl(await getAppBaseUrl(), booking.id);
    } catch (error) {
      console.error("[reminders] failed to build manage link:", error);
    }

    const delivered = await sendBookingReminderEmail({
      to: booking.customer_email,
      businessEmail: booking.business.contact_email ?? undefined,
      customerName: booking.customer_name,
      businessName: booking.business.name,
      serviceName: booking.service.name,
      date: formatZonedDate(booking.starts_at, timeZone, { dateStyle: "long" }),
      time: formatZonedTime(booking.starts_at, timeZone),
      manageUrl,
    });

    if (delivered) {
      sent++;
      await prisma.booking.update({
        where: { id: booking.id },
        data: { reminder_sent_at: new Date() },
      });
    } else {
      failed++;
    }
  }

  return Response.json({
    ok: true,
    windowStart: windowStart.toISOString(),
    windowEnd: windowEnd.toISOString(),
    candidates: bookings.length,
    sent,
    failed,
  });
}
