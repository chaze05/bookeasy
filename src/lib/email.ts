import { Resend } from "resend";
import { render } from "@react-email/components";
import type { ReactElement } from "react";
import { BookingReceivedEmail } from "@/components/emails/BookingReceivedEmail";
import { BookingApprovedEmail } from "@/components/emails/BookingApprovedEmail";
import { OwnerBookingNotificationEmail } from "@/components/emails/OwnerBookingNotificationEmail";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.NEXT_PUBLIC_FROM_EMAIL || "bookings@bookeasy.app";
// "brevo" makes Brevo the primary sender (Resend becomes the fallback).
// Default: Resend first when configured, otherwise Brevo.
const EMAIL_PROVIDER = (process.env.EMAIL_PROVIDER ?? "").toLowerCase();

/** Prevents CRLF header injection via user-controlled display names. */
function safeHeaderValue(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

interface DeliveryOptions {
  from: string;
  replyTo?: string;
  to: string;
  subject: string;
  reactElement: ReactElement;
}

// Helper function to send email via Brevo as fallback
async function sendEmailWithBrevo({
  from,
  replyTo,
  to,
  subject,
  html,
}: {
  from: string;
  replyTo?: string;
  to: string;
  subject: string;
  html: string;
}) {
  const brevoApiKey = process.env.BREVO_API_KEY;
  if (!brevoApiKey) {
    console.warn("Brevo API key not set (BREVO_API_KEY), skipping fallback email");
    return false;
  }

  // Parse "Name <email@example.com>" if present
  let senderName = "BookEasy";
  let senderEmail = FROM_EMAIL;

  const match = from.match(/^(.*?)\s*<(.*?)>$/);
  if (match) {
    senderName = match[1].trim();
    senderEmail = match[2].trim();
  } else if (from.includes("@")) {
    senderEmail = from;
  }

  const payload: {
    sender: { name: string; email: string };
    to: { email: string }[];
    subject: string;
    htmlContent: string;
    replyTo?: { email: string };
  } = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: to }],
    subject,
    htmlContent: html,
  };

  if (replyTo) {
    payload.replyTo = { email: replyTo };
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": brevoApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Brevo API error response:", errorText);
      return false;
    }

    const data = await response.json();
    console.log("Email successfully sent via Brevo fallback:", data.messageId || data);
    return true;
  } catch (error) {
    console.error("Failed to send email via Brevo fallback:", error);
    return false;
  }
}

/** Sends via the preferred provider, falling back to the other. Never throws. */
async function deliverEmail({ from, replyTo, to, subject, reactElement }: DeliveryOptions): Promise<boolean> {
  async function tryResend(): Promise<boolean> {
    if (!resend) return false;
    try {
      const result = await resend.emails.send({
        from,
        replyTo,
        to,
        subject,
        react: reactElement,
      });

      if (result.error) {
        console.warn(
          `Resend failed to send "${subject}": ${result.error.name} - ${result.error.message} (status: ${result.error.statusCode})`
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error(`Exception thrown when sending "${subject}" via Resend:`, error);
      return false;
    }
  }

  async function tryBrevo(): Promise<boolean> {
    try {
      const html = await render(reactElement);
      const success = await sendEmailWithBrevo({ from, replyTo, to, subject, html });
      if (!success) {
        console.error(`Brevo failed to send "${subject}".`);
      }
      return success;
    } catch (renderError) {
      console.error("Failed to render email for Brevo:", renderError);
      return false;
    }
  }

  if (EMAIL_PROVIDER === "brevo") {
    if (await tryBrevo()) return true;
    return tryResend();
  }

  if (await tryResend()) return true;
  return tryBrevo();
}

export async function sendBookingReceivedEmail({
  to,
  businessEmail,
  customerName,
  businessName,
  serviceName,
  date,
  time,
  manageUrl,
}: {
  to: string;
  businessEmail?: string;
  customerName: string;
  businessName: string;
  serviceName: string;
  date: string;
  time: string;
  manageUrl?: string;
}) {
  await deliverEmail({
    from: `${safeHeaderValue(businessName)} <${FROM_EMAIL}>`,
    replyTo: businessEmail || undefined,
    to,
    subject: `Booking Request: ${safeHeaderValue(serviceName)} with ${safeHeaderValue(businessName)}`,
    reactElement: BookingReceivedEmail({
      customerName,
      businessName,
      serviceName,
      date,
      time,
      manageUrl,
    }) as ReactElement,
  });
}

export async function sendBookingApprovedEmail({
  to,
  businessEmail,
  customerName,
  businessName,
  serviceName,
  date,
  time,
  manageUrl,
}: {
  to: string;
  businessEmail?: string;
  customerName: string;
  businessName: string;
  serviceName: string;
  date: string;
  time: string;
  manageUrl?: string;
}) {
  await deliverEmail({
    from: `${safeHeaderValue(businessName)} <${FROM_EMAIL}>`,
    replyTo: businessEmail || undefined,
    to,
    subject: `Booking Confirmed: ${safeHeaderValue(serviceName)} with ${safeHeaderValue(businessName)}`,
    reactElement: BookingApprovedEmail({
      customerName,
      businessName,
      serviceName,
      date,
      time,
      manageUrl,
    }) as ReactElement,
  });
}

export async function sendOwnerNewBookingEmail({
  to,
  businessName,
  customerName,
  customerEmail,
  customerPhone,
  serviceName,
  price,
  currency,
  depositAmount,
  balanceAmount,
  date,
  time,
  notes,
  confirmUrl,
  declineUrl,
}: {
  to: string;
  businessName: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  serviceName: string;
  price?: string;
  currency?: string;
  depositAmount?: string;
  balanceAmount?: string;
  date: string;
  time: string;
  notes?: string | null;
  confirmUrl: string;
  declineUrl: string;
}) {
  await deliverEmail({
    from: `BookEasy <${FROM_EMAIL}>`,
    replyTo: customerEmail,
    to,
    subject: `New booking: ${safeHeaderValue(customerName)} — ${safeHeaderValue(serviceName)} on ${safeHeaderValue(date)} at ${safeHeaderValue(time)}`,
    reactElement: OwnerBookingNotificationEmail({
      businessName,
      customerName,
      customerEmail,
      customerPhone,
      serviceName,
      price,
      currency,
      depositAmount,
      balanceAmount,
      date,
      time,
      notes,
      confirmUrl,
      declineUrl,
    }) as ReactElement,
  });
}
