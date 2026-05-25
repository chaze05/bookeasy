import Link from "next/link";
import { ArrowRight, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroContent {
  badge?: string;
  title?: string;
  title_highlight?: string;
  subtitle?: string;
  primary_cta_text?: string;
  primary_cta_href?: string;
  secondary_cta_text?: string;
  secondary_cta_href?: string;
  trust_line?: string;
}

export function HeroSection({ content }: { content: unknown }) {
  const c = (content ?? {}) as HeroContent;

  return (
    <section className="relative flex flex-col items-center px-4 pb-24 pt-32 text-center sm:px-6">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-start justify-center overflow-hidden"
      >
        <div className="h-[700px] w-[700px] rounded-full bg-emerald-500/10 blur-[140px]" />
      </div>

      <div className="relative max-w-3xl">
        {c.badge && (
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {c.badge}
          </div>
        )}

        <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight text-zinc-100 sm:text-6xl lg:text-7xl">
          {c.title ?? "Booking software that"}{" "}
          <span className="gradient-text">{c.title_highlight ?? "just works."}</span>
        </h1>

        {c.subtitle && (
          <p className="mx-auto mb-4 max-w-xl text-lg leading-relaxed text-zinc-400">
            {c.subtitle}
          </p>
        )}

        {c.trust_line && (
          <p className="mb-10 text-sm text-zinc-500">{c.trust_line}</p>
        )}

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button
            asChild
            size="lg"
            className="h-12 gap-2 bg-emerald-500 px-8 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-400"
          >
            <Link href={c.primary_cta_href ?? "/register"}>
              {c.primary_cta_text ?? "Start for free"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>

          {c.secondary_cta_href && (
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 border-zinc-700 px-8 text-sm font-medium text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800 hover:text-zinc-100"
            >
              <Link href={c.secondary_cta_href}>
                {c.secondary_cta_text ?? "See demo"}
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Dashboard preview mockup */}
      <div className="relative mt-20 w-full max-w-5xl">
        <div className="glass-card overflow-hidden rounded-2xl">
          <div className="flex h-8 items-center gap-1.5 border-b border-zinc-800 bg-zinc-900/60 px-4">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
            <div className="mx-auto flex h-5 w-48 items-center justify-center rounded bg-zinc-800 px-3">
              <span className="text-[9px] text-zinc-500">app.bookeasy.com/dashboard</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-px bg-zinc-800 p-px">
            {/* Sidebar */}
            <div className="col-span-1 bg-zinc-900 p-4">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500">
                  <CalendarCheck className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="h-2.5 w-16 rounded bg-zinc-800" />
              </div>
              {["Dashboard", "Bookings", "Services", "Staff", "Analytics", "Settings"].map((item) => (
                <div key={item} className="mb-2 flex items-center gap-2">
                  <div className="h-3.5 w-3.5 rounded bg-zinc-800" />
                  <div className="h-2.5 rounded bg-zinc-800" style={{ width: `${item.length * 5.5}px` }} />
                </div>
              ))}
            </div>

            {/* Main content */}
            <div className="col-span-3 bg-zinc-900/50 p-6">
              <div className="mb-4 grid grid-cols-3 gap-3">
                {[
                  { label: "Today's Bookings", val: "12", color: "emerald" },
                  { label: "Week Revenue", val: "$1,840", color: "violet" },
                  { label: "Active Clients", val: "48", color: "blue" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
                  >
                    <div className="mb-1 text-[10px] text-zinc-500">{s.label}</div>
                    <div className="text-xl font-bold text-zinc-100">{s.val}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <div className="mb-3 h-2.5 w-28 rounded bg-zinc-800" />
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 border-t border-zinc-800 py-2.5">
                    <div className="h-7 w-7 rounded-full bg-emerald-500/20" />
                    <div>
                      <div className="h-2.5 w-24 rounded bg-zinc-800" />
                      <div className="mt-1 h-2 w-16 rounded bg-zinc-800/60" />
                    </div>
                    <div className="ml-auto h-5 w-16 rounded-full bg-emerald-500/20" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-zinc-950 to-transparent" />
      </div>
    </section>
  );
}
