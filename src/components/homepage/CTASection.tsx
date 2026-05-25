import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-emerald-500/20 bg-zinc-900 p-10 text-center sm:p-16">
        {/* Background glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div className="h-64 w-64 rounded-full bg-emerald-500/10 blur-[80px]" />
        </div>

        <div className="relative">
          {c.heading && (
            <h2 className="mb-4 text-3xl font-bold text-zinc-100 sm:text-4xl">
              {c.heading}
            </h2>
          )}

          {c.subheading && (
            <p className="mb-8 text-zinc-400">{c.subheading}</p>
          )}

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button
              asChild
              size="lg"
              className="h-12 gap-2 bg-emerald-500 px-8 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-400"
            >
              <Link href={c.primary_cta_href ?? "/register"}>
                {c.primary_cta_text ?? "Get started for free"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>

            {c.secondary_cta_href && (
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 border-zinc-700 px-8 text-sm text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800 hover:text-zinc-100"
              >
                <Link href={c.secondary_cta_href}>
                  {c.secondary_cta_text ?? "Sign in"}
                </Link>
              </Button>
            )}
          </div>

          {trustItems.length > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-4">
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
    </section>
  );
}
