import { Resend } from "resend";
import { render } from "@react-email/components";
import { BookingReceivedEmail } from "@/components/emails/BookingReceivedEmail";
import { BookingApprovedEmail } from "@/components/emails/BookingApprovedEmail";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.NEXT_PUBLIC_FROM_EMAIL || "bookings@bookeasy.app";

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

export async function sendBookingReceivedEmail({
  to,
  businessEmail,
  customerName,
  businessName,
  serviceName,
  date,
  time,
}: {
  to: string;
  businessEmail?: string;
  customerName: string;
  businessName: string;
  serviceName: string;
  date: string;
  time: string;
}) {
  const from = `${businessName} <${FROM_EMAIL}>`;
  const replyTo = businessEmail || undefined;
  const subject = `Booking Request: ${serviceName} with ${businessName}`;
  const reactElement = BookingReceivedEmail({ customerName, businessName, serviceName, date, time }) as React.ReactElement;

  let fallbackNeeded = false;

  if (!resend) {
    console.log("No RESEND_API_KEY or Resend client, attempting fallback to Brevo immediately");
    fallbackNeeded = true;
  } else {
    try {
      const result = await resend.emails.send({
        from,
        replyTo,
        to,
        subject,
        react: reactElement,
      });

      if (result.error) {
        console.warn(`Resend failed to send booking received email: ${result.error.name} - ${result.error.message} (status: ${result.error.statusCode})`);
        fallbackNeeded = true;
      }
    } catch (error: any) {
      console.error("Exception thrown when sending via Resend:", error);
      fallbackNeeded = true;
    }
  }

  if (fallbackNeeded) {
    console.log("Triggering Brevo fallback...");
    try {
      const html = await render(reactElement);
      const success = await sendEmailWithBrevo({
        from,
        replyTo,
        to,
        subject,
        html,
      });
      if (!success) {
        console.error("Fallback to Brevo also failed.");
      }
    } catch (renderError) {
      console.error("Failed to render email for Brevo fallback:", renderError);
    }
  }
}

export async function sendBookingApprovedEmail({
  to,
  businessEmail,
  customerName,
  businessName,
  serviceName,
  date,
  time,
}: {
  to: string;
  businessEmail?: string;
  customerName: string;
  businessName: string;
  serviceName: string;
  date: string;
  time: string;
}) {
  const from = `${businessName} <${FROM_EMAIL}>`;
  const replyTo = businessEmail || undefined;
  const subject = `Booking Confirmed: ${serviceName} with ${businessName}`;
  const reactElement = BookingApprovedEmail({ customerName, businessName, serviceName, date, time }) as React.ReactElement;

  let fallbackNeeded = false;

  if (!resend) {
    console.log("No RESEND_API_KEY or Resend client, attempting fallback to Brevo immediately");
    fallbackNeeded = true;
  } else {
    try {
      const result = await resend.emails.send({
        from,
        replyTo,
        to,
        subject,
        react: reactElement,
      });

      if (result.error) {
        console.warn(`Resend failed to send booking approved email: ${result.error.name} - ${result.error.message} (status: ${result.error.statusCode})`);
        fallbackNeeded = true;
      }
    } catch (error: any) {
      console.error("Exception thrown when sending via Resend:", error);
      fallbackNeeded = true;
    }
  }

  if (fallbackNeeded) {
    console.log("Triggering Brevo fallback...");
    try {
      const html = await render(reactElement);
      const success = await sendEmailWithBrevo({
        from,
        replyTo,
        to,
        subject,
        html,
      });
      if (!success) {
        console.error("Fallback to Brevo also failed.");
      }
    } catch (renderError) {
      console.error("Failed to render email for Brevo fallback:", renderError);
    }
  }
}

