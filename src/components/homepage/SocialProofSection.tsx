import { Star } from "lucide-react";

interface Stat {
  value: string;
  label: string;
}

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  initials: string;
}

interface SocialProofContent {
  heading?: string;
  stats?: Stat[];
  testimonials?: Testimonial[];
}

export function SocialProofSection({ content }: { content: unknown }) {
  const c = (content ?? {}) as SocialProofContent;
  const stats = c.stats ?? [];
  const testimonials = c.testimonials ?? [];

  return (
    <section className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        {c.heading && (
          <p className="mb-10 text-center text-sm font-medium uppercase tracking-widest text-zinc-500">
            {c.heading}
          </p>
        )}

        {/* Stats row */}
        {stats.length > 0 && (
          <div className="mb-12 grid grid-cols-3 gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 sm:gap-8 sm:p-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl font-bold text-zinc-100 sm:text-4xl">{stat.value}</p>
                <p className="mt-1 text-sm text-zinc-500">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Testimonials */}
        {testimonials.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6"
              >
                {/* Stars */}
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, s) => (
                    <Star key={s} className="h-3.5 w-3.5 fill-emerald-400 text-emerald-400" />
                  ))}
                </div>

                <blockquote className="flex-1 text-sm leading-relaxed text-zinc-300">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>

                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-300">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-100">{t.author}</p>
                    <p className="text-xs text-zinc-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
