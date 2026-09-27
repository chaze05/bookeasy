import Link from "next/link";
import { CalendarCheck, FileText } from "lucide-react";

export const metadata = {
  title: "Terms of Service — BookEasy",
  description: "The terms that apply to using BookEasy.",
};

const SECTIONS = [
  {
    heading: "1. The service",
    body: "BookEasy provides software that lets service businesses publish services, manage staff schedules and receive bookings, and lets customers book appointments online. We host the platform and may add, change or retire features over time.",
  },
  {
    heading: "2. Accounts",
    body: "You must provide accurate information when creating an account, keep your credentials secure, and are responsible for activity under your account. Business accounts must have authority to manage the business they register.",
  },
  {
    heading: "3. Bookings and business responsibilities",
    body: "Each business is solely responsible for the services it offers, its prices, its schedules, honouring bookings, and communicating with its customers. BookEasy is not a party to the agreement between a business and its customer.",
  },
  {
    heading: "4. Payments",
    body: "Businesses may configure manual payment methods and, where available, online payments through PayMongo. Online payments are processed by PayMongo under its own terms; funds settle to the business's own payment account, not to BookEasy. BookEasy does not hold customer funds. Deposits and balances shown in the app are set by each business, which is responsible for refunds and disputes.",
  },
  {
    heading: "5. Acceptable use",
    body: "Do not use BookEasy to break the law, infringe rights, send spam, upload malicious content, attempt to access other accounts or data, probe or overload the service, or misrepresent your business. We may suspend accounts that violate these terms or create risk for other users.",
  },
  {
    heading: "6. Content",
    body: "You keep ownership of the content you add (business details, service descriptions, images, customer notes). You grant us the licence needed to host and display it as part of the service. You are responsible for having the rights to the content you upload.",
  },
  {
    heading: "7. Availability and liability",
    body: "We work to keep BookEasy available and secure, but the service is provided \"as is\" without warranties. To the maximum extent permitted by law, BookEasy is not liable for indirect or consequential losses, lost profits, missed appointments or no-shows. Our total liability is limited to the fees you paid us in the three months before the claim.",
  },
  {
    heading: "8. Changes and termination",
    body: "We may update these terms and will post material changes on this page. You may stop using BookEasy at any time. We may suspend or end access for violations of these terms or where required by law.",
  },
  {
    heading: "9. Governing law",
    body: "These terms are governed by the laws of the Republic of the Philippines, and disputes are subject to the exclusive jurisdiction of the courts of Metro Manila.",
  },
];

export default function TermsPage() {
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
            <FileText className="h-5 w-5 text-emerald-400" />
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
            <p className="mt-1 text-sm text-zinc-500">Effective date: September 27, 2026</p>
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
              Questions about these terms —{" "}
              <a href="mailto:bookeasy.support@gmail.com" className="text-emerald-400 hover:text-emerald-300">
                bookeasy.support@gmail.com
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 flex items-center gap-4 border-t border-zinc-900 pt-6 text-xs text-zinc-600">
          <Link href="/privacy" className="hover:text-zinc-400">
            Privacy Policy
          </Link>
          <Link href="/" className="hover:text-zinc-400">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
