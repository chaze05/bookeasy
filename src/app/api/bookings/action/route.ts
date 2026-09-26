import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { buildManageUrl, verifyBookingActionToken } from "@/lib/booking-tokens";
import { getAppBaseUrl } from "@/lib/notify";
import { sendBookingApprovedEmail } from "@/lib/email";
import { formatZonedDate, formatZonedTime, safeTimeZone } from "@/lib/timezone";

export const dynamic = "force-dynamic";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function htmlResponse(title: string, body: string, status = 200): Response {
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; background:#09090b; color:#e4e4e7; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; padding:24px; }
    .card { width:100%; max-width:420px; background:#18181b; border:1px solid #27272a; border-radius:16px; padding:32px; text-align:center; }
    h1 { font-size:20px; margin:0 0 12px; color:#fafafa; }
    p { font-size:14px; line-height:1.6; color:#a1a1aa; margin:0 0 20px; }
    button { width:100%; border:0; border-radius:10px; padding:12px 20px; font-size:15px; font-weight:600; color:#fff; background:#10b981; cursor:pointer; }
    button:hover { background:#059669; }
    button.decline { background:#27272a; color:#e4e4e7; }
    button.decline:hover { background:#3f3f46; }
    form { margin:0 0 12px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${escapeHtml(title)}</h1>
    ${body}
  </div>
</body>
</html>`;
  return new Response(html, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

async function loadBooking(bookingId: string) {
  return prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      business: { select: { name: true, timezone: true, contact_email: true } },
      service: { select: { name: true } },
    },
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const verified = verifyBookingActionToken(token);
  if (!verified) {
    return htmlResponse("Link expired or invalid", "<p>This booking link is no longer valid. Please manage the booking from your dashboard.</p>", 400);
  }

  const booking = await loadBooking(verified.bookingId);
  if (!booking) {
    return htmlResponse("Booking not found", "<p>We couldn't find this booking. It may have been deleted.</p>", 404);
  }

  if (booking.status !== "pending") {
    return htmlResponse(
      "Already handled",
      `<p>This booking is already <strong>${escapeHtml(booking.status)}</strong>. No further action is needed.</p>`
    );
  }

  const timeZone = safeTimeZone(booking.business.timezone);
  const summary = `${escapeHtml(booking.customer_name)} — ${escapeHtml(booking.service.name)}<br />${escapeHtml(
    formatZonedDate(booking.starts_at, timeZone, { dateStyle: "long" })
  )} at ${escapeHtml(formatZonedTime(booking.starts_at, timeZone))}`;

  const isConfirm = verified.action === "confirm";
  const form = `<form method="POST" action="/api/bookings/action">
      <input type="hidden" name="token" value="${escapeHtml(token)}" />
      <button type="submit"${isConfirm ? "" : " class=\"decline\""}>${isConfirm ? "Confirm booking" : "Decline booking"}</button>
    </form>`;

  return htmlResponse(
    isConfirm ? "Confirm this booking?" : "Decline this booking?",
    `<p>${summary}</p>${form}<p style="margin:0">You can also manage it from your BookEasy dashboard.</p>`
  );
}

export async function POST(request: Request) {
  let token = "";
  try {
    const form = await request.formData();
    token = String(form.get("token") ?? "");
  } catch {
    return htmlResponse("Invalid request", "<p>Please click the link in your booking email again.</p>", 400);
  }

  const verified = verifyBookingActionToken(token);
  if (!verified) {
    return htmlResponse("Link expired or invalid", "<p>This booking link is no longer valid. Please manage the booking from your dashboard.</p>", 400);
  }

  const booking = await loadBooking(verified.bookingId);
  if (!booking) {
    return htmlResponse("Booking not found", "<p>We couldn't find this booking. It may have been deleted.</p>", 404);
  }

  if (booking.status !== "pending") {
    return htmlResponse(
      "Already handled",
      `<p>This booking is already <strong>${escapeHtml(booking.status)}</strong>. No further action is needed.</p>`
    );
  }

  const status = verified.action === "confirm" ? "confirmed" : "cancelled";
  await prisma.booking.update({
    where: { id: booking.id },
    data: { status, updated_at: new Date() },
  });

  if (status === "confirmed" && booking.customer_email) {
    const timeZone = safeTimeZone(booking.business.timezone);
    let manageUrl: string | undefined;
    try {
      manageUrl = buildManageUrl(await getAppBaseUrl(), booking.id);
    } catch (error) {
      console.error("Failed to build manage link:", error);
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

  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard");

  return htmlResponse(
    status === "confirmed" ? "Booking confirmed" : "Booking declined",
    status === "confirmed"
      ? `<p>The customer has been emailed a confirmation.</p>`
      : `<p>The booking has been cancelled and the slot released.</p>`
  );
}
