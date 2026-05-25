import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import { AdminSidebar } from "@/components/superadmin/admin-sidebar";

export const metadata = { title: "Superadmin — BookEasy" };

export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = (await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()) as { data: { role: string } | null; error: unknown };

  if (profile?.role !== "superadmin") redirect("/dashboard");

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
