import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";
import { StaffList } from "./staff-list";
import type { Staff } from "@/types";

export const metadata = { title: "Staff" };

export default async function StaffPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const business = await prisma.business.findFirst({
    where: { owner_id: user.id },
    select: { id: true },
  });

  let staff: Staff[] = [];

  if (business) {
    const raw = await prisma.staff.findMany({
      where: { business_id: business.id },
      orderBy: { created_at: "asc" },
    });
    staff = serialize(raw) as unknown as Staff[];
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Staff</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage your team members and their roles.
        </p>
      </div>
      <StaffList staff={staff} />
    </div>
  );
}
