import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";
import { BookingsTable } from "./bookings-table";
import type { BookingWithRelations } from "@/types";

export const metadata = { title: "Bookings" };

export default async function BookingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const business = await prisma.business.findFirst({
    where: { owner_id: user.id },
    select: { id: true },
  });

  let bookings: BookingWithRelations[] = [];
  let paymentMethods: {
    id: string;
    type: string;
    label: string;
  }[] = [];

  if (business) {
    const [raw, rawMethods] = await Promise.all([
      prisma.booking.findMany({
        where: { business_id: business.id },
        orderBy: { starts_at: "desc" },
        take: 100,
        include: {
          service: { select: { name: true, duration: true, price: true, color: true } },
          staff: { select: { full_name: true, avatar_url: true } },
        },
      }),
      prisma.paymentMethod.findMany({
        where: { business_id: business.id, is_enabled: true },
        orderBy: { sort_order: "asc" },
        select: { id: true, type: true, label: true },
      }),
    ]);
    bookings = serialize(raw) as unknown as BookingWithRelations[];
    paymentMethods = serialize(rawMethods) as typeof paymentMethods;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Bookings</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage and track all your appointments.
        </p>
      </div>
      <BookingsTable bookings={bookings} paymentMethods={paymentMethods} />
    </div>
  );
}
