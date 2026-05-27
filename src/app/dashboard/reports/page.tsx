import { redirect } from "next/navigation";
import { format } from "date-fns";
import { FileBarChart, DollarSign, CalendarCheck, ReceiptText } from "lucide-react";
import { createClient } from "@/supabase/server";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const business = await prisma.business.findFirst({
    where: { owner_id: user.id },
    select: { id: true },
  });

  const bookings = business
    ? await prisma.booking.findMany({
        where: { business_id: business.id },
        orderBy: { starts_at: "desc" },
        take: 50,
        include: { service: { select: { name: true, price: true } } },
      })
    : [];

  const completed = bookings.filter((booking) => booking.status === "completed");
  const revenue = completed.reduce((sum, booking) => sum + Number(booking.service.price), 0);
  const proofCount = bookings.filter((booking) => booking.payment_proof_url).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Reports</h1>
        <p className="mt-1 text-sm text-zinc-500">Payment and booking summaries for recent activity.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Completed revenue", value: `$${revenue.toFixed(2)}`, icon: DollarSign },
          { label: "Completed bookings", value: completed.length.toLocaleString(), icon: CalendarCheck },
          { label: "Proofs uploaded", value: proofCount.toLocaleString(), icon: ReceiptText },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15">
              <stat.icon className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-xl font-bold text-zinc-100">{stat.value}</p>
            <p className="text-xs text-zinc-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-2 border-b border-zinc-800 px-5 py-3">
          <FileBarChart className="h-4 w-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-zinc-100">Recent booking payments</h2>
        </div>
        {bookings.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-zinc-500">No report data yet.</p>
        ) : (
          <div className="divide-y divide-zinc-800">
            {bookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-zinc-100">{booking.customer_name}</p>
                  <p className="text-xs text-zinc-500">
                    {booking.service.name} · {format(new Date(booking.starts_at), "MMM d, yyyy h:mm a")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-zinc-200">${Number(booking.service.price).toFixed(2)}</p>
                  <p className="text-xs text-zinc-500">{booking.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
