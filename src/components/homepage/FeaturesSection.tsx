import * as LucideIcons from "lucide-react";

interface Feature { icon?: string; title: string; description: string }
interface FeaturesContent { heading?: string; subheading?: string; features?: Feature[] }

// Each feature gets a distinct gradient so the grid feels varied but cohesive
const CARD_STYLES = [
  {
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/5 hover:bg-emerald-500/8",
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-400",
    glow: "shadow-emerald-500/5",
  },
  {
    border: "border-zinc-800",
    bg: "bg-zinc-900/50 hover:bg-zinc-900",
    iconBg: "bg-violet-500/15",
    iconColor: "text-violet-400",
    glow: "",
  },
  {
    border: "border-zinc-800",
    bg: "bg-zinc-900/50 hover:bg-zinc-900",
    iconBg: "bg-blue-500/15",
    iconColor: "text-blue-400",
    glow: "",
  },
  {
    border: "border-zinc-800",
    bg: "bg-zinc-900/50 hover:bg-zinc-900",
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-400",
    glow: "",
  },
  {
    border: "border-zinc-800",
    bg: "bg-zinc-900/50 hover:bg-zinc-900",
    iconBg: "bg-pink-500/15",
    iconColor: "text-pink-400",
    glow: "",
  },
  {
    border: "border-zinc-800",
    bg: "bg-zinc-900/50 hover:bg-zinc-900",
    iconBg: "bg-cyan-500/15",
    iconColor: "text-cyan-400",
    glow: "",
  },
];

export function FeaturesSection({ content }: { content: unknown }) {
  const c = (content ?? {}) as FeaturesContent;
  const features = c.features ?? [];

  return (
    <section id="features" className="px-4 py-24 sm:px-6">
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

        {/* Feature grid — first card is accented (spans 2 cols on lg) */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => {
            const style = CARD_STYLES[i % CARD_STYLES.length];
            const Icon =
              feature.icon
                ? ((LucideIcons as unknown as Record<string, React.ElementType>)[feature.icon] ??
                    LucideIcons.Star)
                : LucideIcons.Star;

            const isHero = i === 0;

            return (
              <div
                key={i}
                className={`group relative overflow-hidden rounded-2xl border p-7 transition-all duration-300 ${style.border} ${style.bg} ${isHero ? "lg:col-span-2 shadow-lg " + style.glow : ""}`}
              >
                {/* Subtle glow for hero card */}
                {isHero && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl"
                  />
                )}

                <div
                  className={`mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl ${style.iconBg} transition-transform duration-300 group-hover:scale-110`}
                >
                  <Icon className={`h-5 w-5 ${style.iconColor}`} />
                </div>

                <h3 className="mb-2.5 text-base font-semibold text-zinc-100">
                  {feature.title}
                </h3>
                <p className="text-sm leading-7 text-zinc-400">
                  {feature.description}
                </p>

                {/* Subtle bottom accent for hero card */}
                {isHero && (
                  <div className="mt-5 flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                    <span>Learn more</span>
                    <LucideIcons.ArrowRight className="h-3 w-3" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
