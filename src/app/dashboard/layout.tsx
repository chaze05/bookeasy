import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profile, business] = await Promise.all([
    prisma.profile.findUnique({
      where: { id: user.id },
      select: { full_name: true, avatar_url: true },
    }),
    prisma.business.findFirst({
      where: { owner_id: user.id },
      select: { name: true },
    }),
  ]);

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:shrink-0">
        <Sidebar />
      </div>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex h-14 items-center border-b border-zinc-800 bg-zinc-950 px-4 lg:hidden">
          <MobileSidebar />
        </div>

        <TopNav
          userId={user.id}
          userEmail={user.email}
          userName={profile?.full_name}
          userAvatar={profile?.avatar_url}
          businessName={business?.name}
        />

        <main className="flex-1 overflow-y-auto bg-zinc-950">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
