import Link from "next/link";
import { ArrowRight, CalendarCheck, BarChart3, Users, Zap, Shield, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: CalendarCheck,
    title: "Smart Scheduling",
    description:
      "Automated booking logic respects staff availability, blocked dates, and service durations.",
  },
  {
    icon: Users,
    title: "Multi-Staff Support",
    description:
      "Assign services to individual team members and manage their availability separately.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description:
      "Track revenue, booking trends, and no-show rates from a single dashboard.",
  },
  {
    icon: Globe,
    title: "Public Booking Page",
    description:
      "Each business gets a shareable URL so clients can book 24/7 without a login.",
  },
  {
    icon: Shield,
    title: "Secure by Default",
    description:
      "Row-level security ensures each business only sees its own data.",
  },
  {
    icon: Zap,
    title: "Instant Setup",
    description:
      "Create your business, add services and staff, and go live in under five minutes.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950">
      {/* Navigation */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500">
              <CalendarCheck className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-zinc-100">BookEasy</span>
          </div>
          <nav className="hidden items-center gap-6 sm:flex">
            <Link
              href="#features"
              className="text-sm text-zinc-400 transition-colors hover:text-zinc-100"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-sm text-zinc-400 transition-colors hover:text-zinc-100"
            >
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild className="text-zinc-400 hover:text-zinc-100">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button
              asChild
              className="bg-emerald-500 text-white hover:bg-emerald-400"
            >
              <Link href="/register">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative flex flex-col items-center px-4 pb-24 pt-32 text-center sm:px-6">
          {/* Background glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-start justify-center overflow-hidden"
          >
            <div className="h-[600px] w-[600px] rounded-full bg-emerald-500/10 blur-[120px]" />
          </div>

          <div className="relative max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Now in public beta
            </div>

            <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight text-zinc-100 sm:text-6xl lg:text-7xl">
              Booking software that{" "}
              <span className="gradient-text">just works.</span>
            </h1>

            <p className="mx-auto mb-10 max-w-xl text-lg text-zinc-400">
              Give your clients an effortless booking experience while you stay in
              control with a beautiful, powerful dashboard.
            </p>

            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button
                asChild
                size="lg"
                className="h-11 gap-2 bg-emerald-500 px-6 text-white hover:bg-emerald-400"
              >
                <Link href="/register">
                  Start for free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-11 border-zinc-700 px-6 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800 hover:text-zinc-100"
              >
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </div>

          {/* Dashboard preview mockup */}
          <div className="relative mt-20 w-full max-w-5xl">
            <div className="glass-card overflow-hidden rounded-2xl">
              <div className="flex h-8 items-center gap-1.5 border-b border-zinc-800 bg-zinc-900/60 px-4">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
                <div className="mx-auto h-4 w-48 rounded bg-zinc-800" />
              </div>
              <div className="grid grid-cols-4 gap-px bg-zinc-800 p-px">
                <div className="col-span-1 bg-zinc-900 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-6 w-6 rounded-md bg-emerald-500/20" />
                    <div className="h-3 w-20 rounded bg-zinc-800" />
                  </div>
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="mb-2 flex items-center gap-2">
                      <div className="h-4 w-4 rounded bg-zinc-800" />
                      <div className="h-3 w-16 rounded bg-zinc-800" />
                    </div>
                  ))}
                </div>
                <div className="col-span-3 bg-zinc-900/50 p-6">
                  <div className="mb-4 grid grid-cols-3 gap-3">
                    {[
                      { label: "Today's Bookings", val: "12" },
                      { label: "Week Revenue", val: "$1,840" },
                      { label: "Active Clients", val: "48" },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
                      >
                        <div className="mb-1 text-xs text-zinc-500">{s.label}</div>
                        <div className="text-2xl font-bold text-zinc-100">
                          {s.val}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                    <div className="mb-3 h-3 w-32 rounded bg-zinc-800" />
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 border-t border-zinc-800 py-2"
                      >
                        <div className="h-7 w-7 rounded-full bg-emerald-500/20" />
                        <div>
                          <div className="h-2.5 w-28 rounded bg-zinc-800" />
                          <div className="mt-1 h-2 w-20 rounded bg-zinc-800/60" />
                        </div>
                        <div className="ml-auto h-5 w-16 rounded-full bg-emerald-500/20" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* Gradient fade at bottom */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-zinc-950 to-transparent" />
          </div>
        </section>

        {/* Features */}
        <section id="features" className="px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold text-zinc-100 sm:text-4xl">
                Everything you need to run your bookings
              </h2>
              <p className="mx-auto max-w-xl text-zinc-400">
                Built for salons, studios, consultants, and any service business
                that wants to stop losing clients to scheduling friction.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900"
                >
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 transition-colors group-hover:bg-emerald-500/20">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-zinc-100">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-zinc-400">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-zinc-100 sm:text-4xl">
              Ready to take back your schedule?
            </h2>
            <p className="mb-8 text-zinc-400">
              Create your business in minutes. No credit card required.
            </p>
            <Button
              asChild
              size="lg"
              className="h-11 gap-2 bg-emerald-500 px-8 text-white hover:bg-emerald-400"
            >
              <Link href="/register">
                Get started for free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500">
              <CalendarCheck className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-xs font-semibold text-zinc-400">BookEasy</span>
          </div>
          <p className="text-xs text-zinc-600">
            © {new Date().getFullYear()} BookEasy. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
