import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";
import { BusinessForm } from "./business-form";
import type { Business } from "@/types";

export const metadata = { title: "Business" };

export default async function BusinessPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const raw = await prisma.business.findFirst({
    where: { owner_id: user.id },
  });
  const business = raw ? (serialize(raw) as unknown as Business) : null;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Business</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Configure your business profile and public booking page.
        </p>
      </div>
      <BusinessForm business={business} />
    </div>
  );
}
