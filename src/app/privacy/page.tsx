import Link from "next/link";
import { CalendarCheck, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — BookEasy",
  description: "How BookEasy collects, uses and protects personal information.",
};

const SECTIONS = [
  {
    heading: "1. Who we are",
    body: "BookEasy is a booking platform for service businesses in the Philippines. Business owners use BookEasy to publish services, manage schedules and receive bookings. Customers use it to book appointments. This policy explains how we handle personal information under the Data Privacy Act of 2012 (Republic Act No. 10173).",
  },
  {
    heading: "2. Information we collect",
    body: "Account information for business owners and staff (name, email address). Booking information for customers (name, email address, phone number, appointment details, notes you provide). Payment information: when a business enables online payments, payment details are processed by PayMongo; we store only payment references and screenshots uploaded by customers for manual payments. Technical information such as IP address and basic device data from our hosting providers, used for security and reliability.",
  },
  {
    heading: "3. How we use information",
    body: "To create and manage accounts and bookings; to send booking confirmations, reminders and status updates; to process deposits and payments when enabled; to provide support; to keep the service secure and prevent abuse; and to comply with legal obligations.",
  },
  {
    heading: "4. Sharing",
    body: "We do not sell personal information. We share information only with service providers that help us run the platform — Supabase (database and authentication), Vercel (hosting), PayMongo (payment processing when enabled) and Brevo (email delivery) — and with the business you are booking with, which receives your booking details. These providers process data under their own terms and security commitments.",
  },
  {
    heading: "5. Retention",
    body: "Booking and account records are kept while the account is active and for a reasonable period afterwards to satisfy legal, accounting and dispute-resolution requirements. We delete or anonymise information that is no longer needed.",
  },
  {
    heading: "6. Security",
    body: "Data is encrypted in transit, access to production systems is restricted, payment credentials for online payments are encrypted at rest, and database access is limited by row-level security and application checks. No system is perfectly secure; please use a strong, unique password.",
  },
  {
    heading: "7. Your rights",
    body: "Under the Data Privacy Act you may request access to, correction of, or deletion of your personal information, object to processing, or file a complaint with the National Privacy Commission. Customers may also contact the business they booked with, which controls the booking data it receives. To exercise your rights, contact us at the email below.",
  },
  {
    heading: "8. Children",
    body: "BookEasy is not intended for children under 18. We do not knowingly collect their personal information.",
  },
  {
    heading: "9. Changes",
    body: "We may update this policy from time to time. Material changes will be announced on this page with a new effective date.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-16 text-zinc-100 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="mb-10 inline-flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500">
            <CalendarCheck className="h-4 w-4 text-white" />
          </span>
          <span className="text-sm font-semibold tracking-tight">
            Book<span className="text-emerald-400">Easy</span>
          </span>
        </Link>

        <div className="mb-10 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Effective date: September 27, 2026 · Data Privacy Act of 2012 (RA 10173) compliant
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          {SECTIONS.map((section) => (
            <section key={section.heading}>
              <h2 className="mb-2 text-base font-semibold text-zinc-100">{section.heading}</h2>
              <p className="text-sm leading-7 text-zinc-400">{section.body}</p>
            </section>
          ))}

          <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="mb-2 text-base font-semibold text-zinc-100">10. Contact</h2>
            <p className="text-sm leading-7 text-zinc-400">
              Data Protection Officer —{" "}
              <a href="mailto:bookeasy.support@gmail.com" className="text-emerald-400 hover:text-emerald-300">
                bookeasy.support@gmail.com
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 flex items-center gap-4 border-t border-zinc-900 pt-6 text-xs text-zinc-600">
          <Link href="/terms" className="hover:text-zinc-400">
            Terms of Service
          </Link>
          <Link href="/" className="hover:text-zinc-400">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
