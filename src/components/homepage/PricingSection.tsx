import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";

interface PricingPlan {
  name?: string;
  price?: string;
  period?: string;
  description?: string;
  features?: string | string[];
  cta_text?: string;
  cta_href?: string;
  highlighted?: string;
  badge?: string;
}

interface PricingContent {
  heading?: string;
  subheading?: string;
  billing_note?: string;
  plans?: PricingPlan[];
}

function planFeatures(features: PricingPlan["features"]): string[] {
  if (Array.isArray(features)) return features.filter(Boolean);
  if (typeof features === "string") {
    return features
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }
  return [];
}

export function PricingSection({ content }: { content: unknown }) {
  const c = (content ?? {}) as PricingContent;
  const plans = c.plans ?? [];
  if (plans.length === 0) return null;

  return (
    <section id="pricing" className="px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-16 text-center">
          {c.heading && (
            <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
              {c.heading}
            </h2>
          )}
          {c.subheading && (
            <p className="mx-auto max-w-xl text-base leading-7 text-zinc-400">
              {c.subheading}
            </p>
          )}
        </div>

        {/* Plans */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan, i) => {
            const isHighlighted = plan.highlighted === "true" || plan.highlighted === "1";
            const features = planFeatures(plan.features);

            return (
              <div
                key={i}
                className={`relative flex flex-col overflow-hidden rounded-2xl border p-7 transition-all duration-300 ${
                  isHighlighted
                    ? "border-emerald-500/40 bg-emerald-500/8 shadow-xl shadow-emerald-500/10"
                    : "border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900"
                }`}
              >
                {isHighlighted && (
                  <>
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-emerald-500/15 blur-3xl"
                    />
                    <div className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-400">
                      <Sparkles className="h-3 w-3" />
                      {plan.badge || "Most popular"}
                    </div>
                  </>
                )}

                <div className="relative">
                  <h3 className="text-base font-semibold text-zinc-100">{plan.name}</h3>

                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-4xl font-extrabold tracking-tight text-zinc-50">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-sm font-medium text-zinc-500">{plan.period}</span>
                    )}
                  </div>

                  {plan.description && (
                    <p className="mt-3 text-sm leading-6 text-zinc-400">{plan.description}</p>
                  )}
                </div>

                {features.length > 0 && (
                  <ul className="relative mt-6 flex flex-1 flex-col gap-3 border-t border-zinc-800/70 pt-6">
                    {features.map((feature, fi) => (
                      <li key={fi} className="flex items-start gap-2.5 text-sm text-zinc-300">
                        <span
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                            isHighlighted ? "bg-emerald-500/20" : "bg-zinc-800"
                          }`}
                        >
                          <Check
                            className={`h-2.5 w-2.5 ${
                              isHighlighted ? "text-emerald-400" : "text-zinc-400"
                            }`}
                          />
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}

                <Link
                  href={plan.cta_href ?? "/register"}
                  className={`relative mt-7 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isHighlighted
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 hover:-translate-y-0.5 hover:bg-emerald-400"
                      : "border border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-800"
                  }`}
                >
                  {plan.cta_text ?? "Get started"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            );
          })}
        </div>

        {c.billing_note && (
          <p className="mt-8 text-center text-xs text-zinc-600">{c.billing_note}</p>
        )}
      </div>
    </section>
  );
}
