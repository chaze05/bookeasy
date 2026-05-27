import Link from "next/link";
import { ArrowRight, CalendarCheck, TrendingUp, Bell } from "lucide-react";

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
  trust_note?: string;
  avatar_initials?: string[];
  mockup_url?: string;
  mockup_notification_title?: string;
  mockup_notification_subtitle?: string;
  mockup_revenue_title?: string;
  mockup_revenue_subtitle?: string;
  mockup_sidebar_primary?: string[];
  mockup_sidebar_secondary?: string[];
  mockup_stats?: Array<{ label: string; value: string; sub: string }>;
  mockup_statuses?: string[];
}

const AVATARS = [
  { initials: "JL", bg: "bg-violet-500" },
  { initials: "MR", bg: "bg-blue-500" },
  { initials: "SK", bg: "bg-amber-500" },
  { initials: "AT", bg: "bg-pink-500" },
  { initials: "CM", bg: "bg-emerald-500" },
];

export function HeroSection({ content }: { content: unknown }) {
  const c = (content ?? {}) as HeroContent;
  const avatarInitials = c.avatar_initials ?? ["JL", "MR", "SK", "AT", "CM"];
  const sidebarPrimary = c.mockup_sidebar_primary ?? ["Dashboard", "Bookings", "Calendar"];
  const sidebarSecondary = c.mockup_sidebar_secondary ?? ["Services", "Staff", "Analytics", "Settings"];
  const mockupStats = c.mockup_stats ?? [
    { label: "Today", value: "12", sub: "bookings" },
    { label: "Revenue", value: "$1,840", sub: "this week" },
    { label: "Clients", value: "48", sub: "active" },
  ];
  const mockupStatuses = c.mockup_statuses ?? ["confirmed", "pending", "confirmed", "completed"];

  return (
    <section className="hero-grid-bg relative isolate overflow-hidden px-4 pb-16 pt-24 sm:px-6 sm:pt-32">
      {/* Top emerald glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[100px]"
      />

      {/* Badge */}
      <div className="mb-8 flex justify-center">
        {c.badge && (
          <div className="inline-flex items-center gap-2.5 rounded-full border border-emerald-500/25 bg-emerald-500/8 px-4 py-2 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/15">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            {c.badge}
          </div>
        )}
      </div>

      {/* Headline */}
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-balance mb-7 text-5xl font-extrabold tracking-tight text-zinc-50 sm:text-6xl lg:text-[5rem] lg:leading-[1.05]">
          {c.title ?? "Booking software that"}{" "}
          <span className="gradient-text-emerald italic">
            {c.title_highlight ?? "just works."}
          </span>
        </h1>

        {c.subtitle && (
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-8 text-zinc-400">
            {c.subtitle}
          </p>
        )}

        {/* CTAs */}
        <div className="mb-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={c.primary_cta_href ?? "/register"}
            className="group inline-flex h-12 items-center gap-2 rounded-xl bg-emerald-500 px-8 text-sm font-semibold text-white shadow-xl shadow-emerald-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-400 hover:shadow-emerald-400/30"
          >
            {c.primary_cta_text ?? "Start for free"}
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>

          {c.secondary_cta_href && (
            <Link
              href={c.secondary_cta_href}
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-zinc-700/80 bg-zinc-900/60 px-8 text-sm font-medium text-zinc-300 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-600 hover:bg-zinc-800 hover:text-zinc-100"
            >
              {c.secondary_cta_text ?? "See demo"}
            </Link>
          )}
        </div>

        {/* Social proof strip */}
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-5">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2.5">
              {avatarInitials.map((initials, i) => (
                <div
                  key={`${initials}-${i}`}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-zinc-950 text-[10px] font-bold text-white ${AVATARS[i % AVATARS.length].bg}`}
                >
                  {initials}
                </div>
              ))}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-0.5">
                {"★★★★★".split("").map((s, i) => (
                  <span key={i} className="text-xs text-amber-400">{s}</span>
                ))}
              </div>
              <p className="text-[11px] text-zinc-500">
                {c.trust_line ?? "Trusted by 500+ businesses"}
              </p>
            </div>
          </div>

          <div className="hidden h-4 w-px bg-zinc-800 sm:block" />

          <p className="text-[11px] text-zinc-500">
            {c.trust_note ?? "No credit card required"}
          </p>
        </div>
      </div>

      {/* Dashboard mockup */}
      <div className="relative mx-auto mt-20 max-w-5xl px-4 sm:px-0">
        {/* Floating notification card — top right */}
        <div className="absolute -right-2 -top-5 z-20 hidden sm:block">
          <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/90 px-4 py-3 shadow-2xl backdrop-blur-xl">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15">
              <Bell className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-100">
                {c.mockup_notification_title ?? "12 new bookings"}
              </p>
              <p className="text-[10px] text-zinc-500">
                {c.mockup_notification_subtitle ?? "Today - Updated now"}
              </p>
            </div>
          </div>
        </div>

        {/* Floating revenue card — bottom left */}
        <div className="absolute -bottom-4 -left-2 z-20 hidden sm:block">
          <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/90 px-4 py-3 shadow-2xl backdrop-blur-xl">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/15">
              <TrendingUp className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-100">
                {c.mockup_revenue_title ?? "$1,840 this week"}
              </p>
              <p className="text-[10px] text-emerald-400">
                {c.mockup_revenue_subtitle ?? "+14% vs last week"}
              </p>
            </div>
          </div>
        </div>

        {/* Browser chrome */}
        <div className="overflow-hidden rounded-2xl border border-zinc-800/80 shadow-2xl shadow-black/50 ring-1 ring-inset ring-white/5">
          {/* Tab bar */}
          <div className="flex h-9 items-center gap-2 border-b border-zinc-800 bg-zinc-900 px-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
            </div>
            <div className="mx-auto flex h-5 w-56 items-center justify-center gap-1.5 rounded-md bg-zinc-800/80 px-3">
              <span className="h-2 w-2 rounded-full bg-emerald-500/60" />
              <span className="text-[10px] text-zinc-500">
                {c.mockup_url ?? "app.bookeasy.com/dashboard"}
              </span>
            </div>
          </div>

          {/* App layout */}
          <div className="flex bg-zinc-950">
            {/* Sidebar */}
            <div className="hidden w-[180px] shrink-0 border-r border-zinc-800/60 bg-zinc-950 p-4 sm:block">
              <div className="mb-5 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500">
                  <CalendarCheck className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="h-2.5 w-16 rounded-md bg-zinc-800" />
              </div>
              <div className="mb-3">
                <div className="mb-1.5 h-1.5 w-10 rounded bg-zinc-800/60" />
                {sidebarPrimary.map((item, i) => (
                  <div
                    key={item}
                    className={`mb-1 flex items-center gap-2 rounded-lg px-2 py-1.5 ${i === 0 ? "bg-zinc-800/60" : ""}`}
                  >
                    <div className={`h-3 w-3 rounded-sm ${i === 0 ? "bg-emerald-500/60" : "bg-zinc-800"}`} />
                    <div className="h-2 rounded bg-zinc-800" style={{ width: `${item.length * 5}px` }} />
                  </div>
                ))}
              </div>
              <div>
                <div className="mb-1.5 h-1.5 w-12 rounded bg-zinc-800/60" />
                {sidebarSecondary.map((item) => (
                  <div key={item} className="mb-1 flex items-center gap-2 px-2 py-1.5">
                    <div className="h-3 w-3 rounded-sm bg-zinc-800" />
                    <div className="h-2 rounded bg-zinc-800" style={{ width: `${item.length * 5}px` }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Main */}
            <div className="flex-1 bg-zinc-950 p-5">
              {/* Stats row */}
              <div className="mb-4 grid grid-cols-3 gap-3">
                {mockupStats.map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl border border-zinc-800/80 bg-zinc-900 p-3.5"
                  >
                    <p className="mb-1 text-[9px] uppercase tracking-wider text-zinc-600">
                      {s.label}
                    </p>
                    <p className="text-lg font-bold text-zinc-100">{s.value}</p>
                    <p className="text-[9px] text-zinc-600">{s.sub}</p>
                  </div>
                ))}
              </div>

              {/* Bookings table */}
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900">
                <div className="flex items-center justify-between border-b border-zinc-800/60 px-4 py-3">
                  <div className="h-2.5 w-24 rounded-md bg-zinc-800" />
                  <div className="h-5 w-16 rounded-lg bg-emerald-500/20" />
                </div>
                {mockupStatuses.map((status, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 border-t border-zinc-800/40 px-4 py-3"
                  >
                    <div className="h-6 w-6 rounded-full bg-zinc-800" />
                    <div className="flex-1">
                      <div className="mb-1 h-2 w-20 rounded bg-zinc-800" />
                      <div className="h-1.5 w-14 rounded bg-zinc-800/60" />
                    </div>
                    <div
                      className={`h-4 rounded-full ${
                        status === "confirmed"
                          ? "bg-emerald-500/20"
                          : status === "pending"
                          ? "bg-amber-500/20"
                          : "bg-blue-500/20"
                      }`}
                      style={{ width: `${Math.max(64, status.length * 10)}px` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-zinc-950 to-transparent" />
      </div>
    </section>
  );
}
