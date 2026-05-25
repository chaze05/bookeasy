import * as LucideIcons from "lucide-react";

interface Feature {
  icon?: string;
  title: string;
  description: string;
}

interface FeaturesContent {
  heading?: string;
  subheading?: string;
  features?: Feature[];
}

export function FeaturesSection({ content }: { content: unknown }) {
  const c = (content ?? {}) as FeaturesContent;
  const features = c.features ?? [];

  return (
    <section id="features" className="px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          {c.heading && (
            <h2 className="mb-4 text-3xl font-bold text-zinc-100 sm:text-4xl">
              {c.heading}
            </h2>
          )}
          {c.subheading && (
            <p className="mx-auto max-w-xl text-zinc-400">{c.subheading}</p>
          )}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => {
            const Icon =
              feature.icon
                ? ((LucideIcons as unknown as Record<string, React.ElementType>)[feature.icon] ?? LucideIcons.Star)
                : LucideIcons.Star;

            return (
              <div
                key={i}
                className="group rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 transition-colors group-hover:bg-emerald-500/20">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-zinc-100">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-zinc-400">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
