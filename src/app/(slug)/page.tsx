import { notFound } from "next/navigation";
import { Clock, Globe } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { BookingWidget } from "./booking-widget";

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
    title: business.name,
    description: business.description ?? undefined,
  };
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const period = h < 12 ? "AM" : "PM";
  const displayH = h % 12 || 12;
  return `${displayH}:${m.toString().padStart(2, "0")} ${period}`;
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
      timezone: true,
      business_hours_start: true,
      business_hours_end: true,
      booking_interval: true,
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
    },
  });

  if (!business) notFound();

  const services = business.services.map((s) => ({
    ...s,
    price: Number(s.price),
  }));

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Business header */}
      <div className="border-b border-zinc-800 bg-zinc-900">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <div className="flex items-center gap-4">
            {business.logo_url ? (
              <img
                src={business.logo_url}
                alt={business.name}
                className="h-14 w-14 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15">
                <span className="text-2xl font-bold text-emerald-400">
                  {business.name[0]}
                </span>
              </div>
            )}
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold text-zinc-100">
                {business.name}
              </h1>
              {business.description && (
                <p className="mt-0.5 text-sm text-zinc-400">{business.description}</p>
              )}
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(business.business_hours_start)} –{" "}
                  {formatTime(business.business_hours_end)}
                </span>
                <span className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {business.timezone}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {services.length > 0 ? (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-zinc-100">Services</h2>
            <BookingWidget
              business={{ id: business.id, name: business.name }}
              services={services}
            />
          </section>
        ) : (
          <div className="flex flex-col items-center gap-2 py-20 text-center">
            <p className="text-sm text-zinc-500">No services available yet.</p>
          </div>
        )}

        {business.staff.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-semibold text-zinc-100">Our Team</h2>
            <div className="flex flex-wrap gap-3">
              {business.staff.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3"
                >
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.full_name}
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-700 text-sm font-semibold text-zinc-300">
                      {member.full_name[0]}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-zinc-100">
                      {member.full_name}
                    </p>
                    <p className="text-xs capitalize text-zinc-500">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="mt-16 border-t border-zinc-800 py-6 text-center text-xs text-zinc-600">
        Powered by <span className="text-zinc-500">BookEasy</span>
      </div>
    </div>
  );
}
