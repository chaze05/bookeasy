import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

interface CTAContent {
  heading?: string;
  subheading?: string;
  primary_cta_text?: string;
  primary_cta_href?: string;
  secondary_cta_text?: string;
  secondary_cta_href?: string;
  trust_items?: string[];
}

export function CTASection({ content }: { content: unknown }) {
  const c = (content ?? {}) as CTAContent;
  const trustItems = c.trust_items ?? [];

  return (
    <section className="px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="gradient-border relative overflow-hidden rounded-3xl p-px">
          <div className="relative overflow-hidden rounded-[calc(1.5rem-1px)] bg-zinc-950 px-8 py-16 text-center sm:px-16 sm:py-20">
            {/* Background glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
              <div className="h-64 w-96 rounded-full bg-emerald-500/8 blur-[80px]" />
            </div>

            {/* Corner dot decorations */}
            <div aria-hidden className="absolute left-6 top-6 h-1.5 w-1.5 rounded-full bg-emerald-500/40" />
            <div aria-hidden className="absolute right-6 top-6 h-1.5 w-1.5 rounded-full bg-emerald-500/40" />
            <div aria-hidden className="absolute bottom-6 left-6 h-1.5 w-1.5 rounded-full bg-zinc-700" />
            <div aria-hidden className="absolute bottom-6 right-6 h-1.5 w-1.5 rounded-full bg-zinc-700" />

            <div className="relative">
              {c.heading && (
                <h2 className="mb-4 text-balance text-3xl font-extrabold tracking-tight text-zinc-50 sm:text-4xl lg:text-5xl">
                  {c.heading}
                </h2>
              )}

              {c.subheading && (
                <p className="mx-auto mb-10 max-w-xl text-base leading-7 text-zinc-400">
                  {c.subheading}
                </p>
              )}

              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href={c.primary_cta_href ?? "/register"}
                  className="group inline-flex h-12 items-center gap-2 rounded-xl bg-emerald-500 px-8 text-sm font-semibold text-white shadow-xl shadow-emerald-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-400 hover:shadow-emerald-400/30"
                >
                  {c.primary_cta_text ?? "Get started for free"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>

                {c.secondary_cta_href && (
                  <Link
                    href={c.secondary_cta_href}
                    className="inline-flex h-12 items-center gap-2 rounded-xl border border-zinc-700/80 px-8 text-sm font-medium text-zinc-400 transition-all duration-200 hover:border-zinc-600 hover:text-zinc-200"
                  >
                    {c.secondary_cta_text ?? "Sign in"}
                  </Link>
                )}
              </div>

              {trustItems.length > 0 && (
                <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2">
                  {trustItems.map((item, i) => (
                    <span key={i} className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <Check className="h-3 w-3 text-emerald-500" />
                      {item}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
