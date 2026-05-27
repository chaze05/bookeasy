import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileForm } from "./profile-form";
import { BookingSettingsForm } from "./booking-settings-form";
import { PaymentMethodsForm } from "./payment-methods-form";
import { SubscriptionForm } from "./subscription-form";
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
  const [rawPaymentMethods, rawSubscriptionPayments, rawSubscriptionMethods] = business
    ? await Promise.all([
        prisma.paymentMethod.findMany({
          where: { business_id: business.id },
          orderBy: { sort_order: "asc" },
        }),
        prisma.subscriptionPayment.findMany({
          where: { business_id: business.id },
          orderBy: { created_at: "desc" },
          take: 10,
        }),
        prisma.paymentMethod.findMany({
          where: { is_enabled: true, type: { not: "cash" } },
          orderBy: [{ type: "asc" }, { sort_order: "asc" }],
        }),
      ])
    : [[], [], []];

  const paymentMethods = serialize(rawPaymentMethods) as {
    id: string;
    type: string;
    label: string;
    is_enabled: boolean;
    sort_order: number;
    details: Record<string, string> | null;
  }[];
  const subscriptionPayments = serialize(rawSubscriptionPayments) as unknown as {
    id: string;
    payment_method_type: string;
    payment_proof_url: string;
    status: string;
    notes: string | null;
    created_at: string;
  }[];
  const subscriptionMethodMap = new Map<
    string,
    { type: string; label: string; details: Record<string, string> | null }
  >();
  for (const method of serialize(rawSubscriptionMethods) as {
    type: string;
    label: string;
    details: Record<string, string> | null;
  }[]) {
    if (!subscriptionMethodMap.has(method.type)) {
      subscriptionMethodMap.set(method.type, method);
    }
  }
  const subscriptionMethods = [...subscriptionMethodMap.values()];

  return (
    <div className="flex max-w-4xl flex-col gap-6">
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
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileForm profile={profile} email={user.email ?? ""} />
        </TabsContent>

        <TabsContent value="booking">
          <BookingSettingsForm business={business} />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentMethodsForm methods={paymentMethods} />
        </TabsContent>

        <TabsContent value="subscription">
          <SubscriptionForm payments={subscriptionPayments} methods={subscriptionMethods} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
