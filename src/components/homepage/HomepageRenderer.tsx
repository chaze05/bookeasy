import { HeroSection } from "./HeroSection";
import { SocialProofSection } from "./SocialProofSection";
import { FeaturesSection } from "./FeaturesSection";
import { CTASection } from "./CTASection";

export interface HomepageSection {
  id: string;
  section_key: string;
  content: unknown;
  order_index: number;
}

const SECTION_COMPONENTS: Record<string, React.ComponentType<{ content: unknown }>> = {
  hero:         HeroSection,
  social_proof: SocialProofSection,
  features:     FeaturesSection,
  cta:          CTASection,
};

// Mirrors the seeded defaults — used when DB is unreachable
const FALLBACK_SECTIONS: HomepageSection[] = [
  {
    id: "fallback-hero",
    section_key: "hero",
    order_index: 0,
    content: {
      badge: "Now in public beta",
      title: "Booking software that",
      title_highlight: "just works.",
      subtitle: "Give your clients an effortless booking experience while you stay in control with a beautiful, powerful dashboard.",
      primary_cta_text: "Start for free",
      primary_cta_href: "/register",
      secondary_cta_text: "See a live demo",
      secondary_cta_href: "/glow-beauty-studio",
      trust_line: "No credit card required · Trusted by 500+ businesses",
    },
  },
  {
    id: "fallback-features",
    section_key: "features",
    order_index: 1,
    content: {
      heading: "Everything you need to run your bookings",
      subheading: "Built for salons, studios, consultants, and any service business that wants to stop losing clients to scheduling friction.",
      features: [
        { icon: "CalendarCheck", title: "Smart Scheduling",    description: "Automated booking logic respects staff availability, blocked dates, and service durations." },
        { icon: "Users",         title: "Multi-Staff Support", description: "Assign services to individual team members and manage their availability separately." },
        { icon: "BarChart3",     title: "Real-Time Analytics", description: "Track revenue, booking trends, and no-show rates from a single dashboard." },
        { icon: "Globe",         title: "Public Booking Page", description: "Each business gets a shareable URL so clients can book 24/7 without a login." },
        { icon: "Shield",        title: "Secure by Default",   description: "Row-level security ensures each business only sees its own data." },
        { icon: "Zap",           title: "Instant Setup",       description: "Create your business, add services and staff, and go live in under five minutes." },
      ],
    },
  },
  {
    id: "fallback-cta",
    section_key: "cta",
    order_index: 2,
    content: {
      heading: "Ready to take back your schedule?",
      subheading: "Create your business in minutes.",
      primary_cta_text: "Get started for free",
      primary_cta_href: "/register",
      trust_items: ["No credit card required", "Cancel any time", "Free plan available"],
    },
  },
];

export function HomepageRenderer({ sections }: { sections: HomepageSection[] }) {
  const toRender = sections.length > 0 ? sections : FALLBACK_SECTIONS;

  return (
    <>
      {toRender.map((section) => {
        const Component = SECTION_COMPONENTS[section.section_key];
        if (!Component) return null;
        return <Component key={section.id} content={section.content} />;
      })}
    </>
  );
}
