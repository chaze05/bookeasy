interface Stat { value: string; label: string }
interface Testimonial { quote: string; author: string; role: string; initials: string }
interface SocialProofContent {
  heading?: string;
  stats?: Stat[];
  testimonials?: Testimonial[];
}

const AVATAR_COLORS = [
  "bg-violet-500",
  "bg-emerald-500",
  "bg-blue-500",
  "bg-amber-500",
];

export function SocialProofSection({ content }: { content: unknown }) {
  const c = (content ?? {}) as SocialProofContent;
  const stats = c.stats ?? [];
  const testimonials = c.testimonials ?? [];

  return (
    <section className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-6xl">

        {/* Section label */}
        {c.heading && (
          <div className="mb-10 flex items-center justify-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-zinc-800" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600">
              {c.heading}
            </p>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-zinc-800" />
          </div>
        )}

        {/* Stats */}
        {stats.length > 0 && (
          <div className="mb-12 grid grid-cols-3 divide-x divide-zinc-800 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
            {stats.map((stat, i) => (
              <div key={i} className="flex flex-col items-center gap-1 px-6 py-8 text-center">
                <span className="text-4xl font-extrabold tracking-tight text-zinc-50 sm:text-5xl">
                  {stat.value}
                </span>
                <span className="text-sm text-zinc-500">{stat.label}</span>
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
                className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-7 transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900"
              >
                {/* Decorative quote mark */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-2 -top-2 text-[80px] font-serif leading-none text-zinc-800 select-none transition-colors group-hover:text-zinc-700/80"
                >
                  &ldquo;
                </div>

                {/* Stars */}
                <div className="mb-4 flex gap-0.5">
                  {"★★★★★".split("").map((s, si) => (
                    <span key={si} className="text-sm text-amber-400">{s}</span>
                  ))}
                </div>

                <blockquote className="mb-6 text-[15px] leading-relaxed text-zinc-300">
                  {t.quote}
                </blockquote>

                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">{t.author}</p>
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
