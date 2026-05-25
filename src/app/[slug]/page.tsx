import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BusinessHero } from "@/components/business/hero";
import { ServicesSection } from "@/components/business/services";
import { StaffSection } from "@/components/business/staff";
import { TestimonialsSection } from "@/components/business/testimonials";
import { FaqSection } from "@/components/business/faq";
import { BusinessFooter } from "@/components/business/footer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await prisma.business.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });
  if (!business) return {};
  return {
    title: `${business.name} — Book Online`,
    description: business.description ?? `Book an appointment with ${business.name}`,
  };
}

export default async function BookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const business = await prisma.business.findUnique({
    where: { slug, status: "active" },
    select: {
      id: true,
      name: true,
      description: true,
      logo_url: true,
      business_hours_start: true,
      business_hours_end: true,
      services: {
        where: { is_active: true },
        select: {
          id: true,
          name: true,
          description: true,
          duration: true,
          price: true,
          color: true,
        },
        orderBy: { name: "asc" },
      },
      staff: {
        where: { is_active: true },
        select: { id: true, full_name: true, role: true, avatar_url: true },
        orderBy: { full_name: "asc" },
      },
      payment_methods: {
        where: { is_enabled: true },
        select: { id: true, type: true, label: true, details: true },
        orderBy: { sort_order: "asc" },
      },
    },
  });

  if (!business) notFound();

  const services = business.services.map((s) => ({ ...s, price: Number(s.price) }));

  return (
    <main className="min-h-screen bg-zinc-950">
      <BusinessHero
        name={business.name}
        description={business.description}
        logo_url={business.logo_url}
        business_hours_start={business.business_hours_start}
        business_hours_end={business.business_hours_end}
      />

      <ServicesSection
        business={{ id: business.id, name: business.name }}
        services={services}
        paymentMethods={business.payment_methods.map((m) => ({
          ...m,
          details: m.details as Record<string, string> | null,
        }))}
      />

      <StaffSection staff={business.staff} />

      <TestimonialsSection />

      <FaqSection />

      <BusinessFooter
        name={business.name}
        business_hours_start={business.business_hours_start}
        business_hours_end={business.business_hours_end}
      />
    </main>
  );
}
