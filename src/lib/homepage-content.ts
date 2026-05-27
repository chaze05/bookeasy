export type HomepageLink = {
  label: string;
  href: string;
};

export type HeaderContent = {
  brand_text: string;
  brand_highlight: string;
  nav_links: HomepageLink[];
  sign_in_text: string;
  sign_in_href: string;
  primary_cta_text: string;
  primary_cta_href: string;
};

export type FooterColumn = {
  heading: string;
  links: HomepageLink[];
};

export type SocialLink = {
  label: string;
  href: string;
};

export type FooterContent = {
  brand_text: string;
  brand_highlight: string;
  description: string;
  social_links: SocialLink[];
  columns: FooterColumn[];
  copyright_text: string;
  bottom_note: string;
};

export type HomepageSectionRecord = {
  id: string;
  section_key: string;
  content: unknown;
  order_index: number;
};

export const DEFAULT_HEADER_CONTENT: HeaderContent = {
  brand_text: "Book",
  brand_highlight: "Easy",
  nav_links: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Demo", href: "/glow-beauty-studio" },
  ],
  sign_in_text: "Sign in",
  sign_in_href: "/login",
  primary_cta_text: "Get started",
  primary_cta_href: "/register",
};

export const DEFAULT_FOOTER_CONTENT: FooterContent = {
  brand_text: "Book",
  brand_highlight: "Easy",
  description:
    "The all-in-one booking platform for service businesses. Set up in minutes, loved by thousands.",
  social_links: [
    { label: "X", href: "#" },
    { label: "GitHub", href: "#" },
  ],
  columns: [
    {
      heading: "Product",
      links: [
        { label: "Features", href: "#features" },
        { label: "Pricing", href: "#pricing" },
        { label: "Demo", href: "/glow-beauty-studio" },
        { label: "Changelog", href: "#" },
      ],
    },
    {
      heading: "Company",
      links: [
        { label: "About", href: "#" },
        { label: "Blog", href: "#" },
        { label: "Careers", href: "#" },
        { label: "Contact", href: "#" },
      ],
    },
    {
      heading: "Legal",
      links: [
        { label: "Privacy", href: "#" },
        { label: "Terms", href: "#" },
        { label: "Security", href: "#" },
      ],
    },
  ],
  copyright_text: "BookEasy. All rights reserved.",
  bottom_note: "Built for service businesses worldwide",
};

export const DEFAULT_HOMEPAGE_SECTIONS: HomepageSectionRecord[] = [
  {
    id: "fallback-hero",
    section_key: "hero",
    order_index: 0,
    content: {
      badge: "Now in public beta",
      title: "Booking software that",
      title_highlight: "just works.",
      subtitle:
        "Give your clients an effortless booking experience while you stay in control with a beautiful, powerful dashboard.",
      primary_cta_text: "Start for free",
      primary_cta_href: "/register",
      secondary_cta_text: "See a live demo",
      secondary_cta_href: "/glow-beauty-studio",
      trust_line: "No credit card required - Trusted by 500+ businesses",
      trust_note: "No credit card required",
      avatar_initials: ["JL", "MR", "SK", "AT", "CM"],
      mockup_url: "app.bookeasy.com/dashboard",
      mockup_notification_title: "12 new bookings",
      mockup_notification_subtitle: "Today - Updated now",
      mockup_revenue_title: "$1,840 this week",
      mockup_revenue_subtitle: "+14% vs last week",
      mockup_sidebar_primary: ["Dashboard", "Bookings", "Calendar"],
      mockup_sidebar_secondary: ["Services", "Staff", "Analytics", "Settings"],
      mockup_stats: [
        { label: "Today", value: "12", sub: "bookings" },
        { label: "Revenue", value: "$1,840", sub: "this week" },
        { label: "Clients", value: "48", sub: "active" },
      ],
      mockup_statuses: ["confirmed", "pending", "confirmed", "completed"],
    },
  },
  {
    id: "fallback-social-proof",
    section_key: "social_proof",
    order_index: 1,
    content: {
      heading: "Trusted by service businesses everywhere",
      stats: [
        { value: "500+", label: "Active businesses" },
        { value: "12k+", label: "Bookings per month" },
        { value: "4.9", label: "Average rating" },
      ],
      testimonials: [
        {
          quote: "BookEasy cut our no-show rate by 40%. Clients love the automated reminders.",
          author: "Jessica Lee",
          role: "Owner, Glow Beauty Studio",
          initials: "JL",
        },
        {
          quote: "Set up in 5 minutes. Our clients book online 24/7 now - no more phone tag.",
          author: "Marcus Reid",
          role: "Owner, FitZone Performance",
          initials: "MR",
        },
      ],
    },
  },
  {
    id: "fallback-features",
    section_key: "features",
    order_index: 2,
    content: {
      heading: "Everything you need to run your bookings",
      subheading:
        "Built for salons, studios, consultants, and any service business that wants to stop losing clients to scheduling friction.",
      features: [
        {
          icon: "CalendarCheck",
          title: "Smart Scheduling",
          description:
            "Automated booking logic respects staff availability, blocked dates, and service durations.",
        },
        {
          icon: "Users",
          title: "Multi-Staff Support",
          description:
            "Assign services to individual team members and manage their availability separately.",
        },
        {
          icon: "BarChart3",
          title: "Real-Time Analytics",
          description:
            "Track revenue, booking trends, and no-show rates from a single dashboard.",
        },
        {
          icon: "Globe",
          title: "Public Booking Page",
          description:
            "Each business gets a shareable URL so clients can book 24/7 without a login.",
        },
        {
          icon: "Shield",
          title: "Secure by Default",
          description:
            "Row-level security ensures each business only sees its own data.",
        },
        {
          icon: "Zap",
          title: "Instant Setup",
          description:
            "Create your business, add services and staff, and go live in under five minutes.",
        },
      ],
    },
  },
  {
    id: "fallback-cta",
    section_key: "cta",
    order_index: 3,
    content: {
      heading: "Ready to take back your schedule?",
      subheading: "Create your business in minutes.",
      primary_cta_text: "Get started for free",
      primary_cta_href: "/register",
      secondary_cta_text: "Sign in",
      secondary_cta_href: "/login",
      trust_items: ["No credit card required", "Cancel any time", "Free plan available"],
    },
  },
];

function contentFor(sections: HomepageSectionRecord[], key: string) {
  return sections.find((section) => section.section_key === key)?.content;
}

export function getHeaderContent(sections: HomepageSectionRecord[]): HeaderContent {
  return {
    ...DEFAULT_HEADER_CONTENT,
    ...((contentFor(sections, "header") ?? {}) as Partial<HeaderContent>),
  };
}

export function getFooterContent(sections: HomepageSectionRecord[]): FooterContent {
  return {
    ...DEFAULT_FOOTER_CONTENT,
    ...((contentFor(sections, "footer") ?? {}) as Partial<FooterContent>),
  };
}

export function getPageSections(sections: HomepageSectionRecord[]) {
  return sections.filter((section) => !["header", "footer"].includes(section.section_key));
}
