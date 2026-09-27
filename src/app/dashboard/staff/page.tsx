import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";
import { StaffList } from "./staff-list";
import { planDefinition } from "@/lib/plans";
import type { Staff } from "@/types";

export const metadata = { title: "Staff" };

function recentCutoff(): Date {
  return new Date(Date.now() - 86_400_000);
}

export default async function StaffPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const business = await prisma.business.findFirst({
    where: { owner_id: user.id },
    select: { id: true, plan: true, plan_expires_at: true },
  });
  const staffLimit = planDefinition(business ?? {}).staffLimit;

  let staff: Staff[] = [];
  let availability: {
    id: string;
    staff_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
  }[] = [];
  let blockedDates: {
    id: string;
    staff_id: string | null;
    blocked_on: string;
    reason: string | null;
  }[] = [];

  if (business) {
    const [raw, rawAvailability, rawBlocked] = await Promise.all([
      prisma.staff.findMany({
        where: { business_id: business.id },
        orderBy: { created_at: "asc" },
      }),
      prisma.availability.findMany({
        where: { business_id: business.id },
        orderBy: [{ staff_id: "asc" }, { day_of_week: "asc" }, { start_time: "asc" }],
      }),
      prisma.blockedDate.findMany({
        where: {
          business_id: business.id,
          blocked_on: { gte: recentCutoff() },
        },
        orderBy: { blocked_on: "asc" },
        take: 50,
      }),
    ]);
    staff = serialize(raw) as unknown as Staff[];
    availability = serialize(rawAvailability) as unknown as typeof availability;
    blockedDates = serialize(rawBlocked) as unknown as typeof blockedDates;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Staff</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage your team, their weekly hours and days off.
        </p>
      </div>
      <StaffList
        staff={staff}
        availability={availability}
        blockedDates={blockedDates}
        staffLimit={staffLimit}
      />
    </div>
  );
}
