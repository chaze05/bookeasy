import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";
import { ServiceList } from "./service-list";
import type { Service } from "@/types";

export const metadata = { title: "Services" };

export default async function ServicesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const business = await prisma.business.findFirst({
    where: { owner_id: user.id },
    select: { id: true },
  });

  let services: Service[] = [];
  let addons: {
    id: string;
    service_id: string;
    name: string;
    price: number;
    max_quantity: number;
    is_active: boolean;
  }[] = [];

  if (business) {
    const [raw, rawAddons] = await Promise.all([
      prisma.service.findMany({
        where: { business_id: business.id },
        orderBy: { created_at: "asc" },
      }),
      prisma.serviceAddon.findMany({
        where: { business_id: business.id },
        orderBy: { sort_order: "asc" },
      }),
    ]);
    services = serialize(raw) as unknown as Service[];
    addons = serialize(rawAddons) as unknown as typeof addons;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Services</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage the services your business offers.
          </p>
        </div>
      </div>
      <ServiceList services={services} addons={addons} />
    </div>
  );
}
