import { DEFAULT_HOMEPAGE_SECTIONS } from "@/lib/homepage-content";
import { CTASection } from "./CTASection";
import { FeaturesSection } from "./FeaturesSection";
import { HeroSection } from "./HeroSection";
import { SocialProofSection } from "./SocialProofSection";

export interface HomepageSection {
  id: string;
  section_key: string;
  content: unknown;
  order_index: number;
}

const SECTION_COMPONENTS: Record<string, React.ComponentType<{ content: unknown }>> = {
  hero: HeroSection,
  social_proof: SocialProofSection,
  features: FeaturesSection,
  cta: CTASection,
};

export function HomepageRenderer({ sections }: { sections: HomepageSection[] }) {
  const toRender = sections.length > 0 ? sections : DEFAULT_HOMEPAGE_SECTIONS;

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
