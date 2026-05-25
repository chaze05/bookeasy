import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileForm } from "./profile-form";
import { BookingSettingsForm } from "./booking-settings-form";
import type { Profile, Business } from "@/types";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [rawProfile, rawBusiness] = await Promise.all([
    prisma.profile.findUnique({ where: { id: user.id } }),
    prisma.business.findFirst({ where: { owner_id: user.id } }),
  ]);

  const profile = rawProfile ? (serialize(rawProfile) as unknown as Profile) : null;
  const business = rawBusiness ? (serialize(rawBusiness) as unknown as Business) : null;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage your profile, password, and booking configuration.
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="booking">Booking</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileForm profile={profile} email={user.email ?? ""} />
        </TabsContent>

        <TabsContent value="booking">
          <BookingSettingsForm business={business} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
