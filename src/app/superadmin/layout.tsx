import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import { prisma } from "@/lib/prisma";
import { AdminSidebar } from "@/components/superadmin/admin-sidebar";
import { AdminHeader } from "@/components/superadmin/admin-header";

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

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true, full_name: true, avatar_url: true },
  });

  if (profile?.role !== "superadmin") redirect("/dashboard");

  // Count new businesses + new users registered in the last 24 hours — drives the badge
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [newBusinesses, newUsers] = await Promise.all([
    prisma.business.count({ where: { created_at: { gte: since24h } } }),
    prisma.profile.count({ where: { created_at: { gte: since24h } } }),
  ]);
  const notifCount = newBusinesses + newUsers;

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <AdminSidebar notifCount={notifCount} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader
          userName={profile.full_name ?? null}
          userEmail={user.email}
          userAvatar={profile.avatar_url ?? null}
          notifCount={notifCount}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
