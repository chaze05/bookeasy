import { format } from "date-fns";
import { CalendarCheck, Clock, ReceiptText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Bookings — Superadmin" };

const STATUS_VARIANT: Record<string, "success" | "destructive" | "warning" | "secondary" | "outline"> = {
  confirmed: "success",
  cancelled: "destructive",
  pending: "warning",
  completed: "secondary",
  no_show: "outline",
};

export default async function SuperadminBookingsPage() {
  const raw = await prisma.booking.findMany({
    orderBy: { created_at: "desc" },
    take: 200,
    include: {
      business: { select: { name: true, slug: true } },
      service: { select: { name: true, price: true, color: true } },
    },
  });

  const bookings = serialize(raw) as typeof raw;
  const total = await prisma.booking.count();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = await prisma.booking.count({ where: { created_at: { gte: today } } });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">All Bookings</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {total.toLocaleString()} total · {todayCount} today
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Total", value: total, icon: CalendarCheck, color: "violet" },
          { label: "Today", value: todayCount, icon: Clock, color: "emerald" },
          {
            label: "Showing",
            value: Math.min(bookings.length, 200),
            icon: CalendarCheck,
            color: "blue",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3"
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-${s.color}-500/15`}>
              <s.icon className={`h-4 w-4 text-${s.color}-400`} />
            </div>
            <div>
              <p className="text-xl font-bold text-zinc-100">{s.value.toLocaleString()}</p>
              <p className="text-xs text-zinc-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {bookings.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800">
            <CalendarCheck className="h-7 w-7 text-zinc-500" />
          </div>
          <p className="text-sm text-zinc-400">No bookings yet</p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Proof</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium text-zinc-100">{b.customer_name}</p>
                      <p className="text-xs text-zinc-500">{b.customer_email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-zinc-300">{b.business.name}</p>
                    <p className="text-xs text-zinc-600">/{b.business.slug}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: b.service.color }}
                      />
                      <span className="text-sm text-zinc-300">{b.service.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-zinc-400">
                    {format(new Date(b.starts_at), "MMM d, yyyy · h:mm a")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[b.status] ?? "outline"}>
                      {b.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {b.payment_proof_url ? (
                      <a
                        href={b.payment_proof_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300"
                      >
                        <ReceiptText className="h-3.5 w-3.5" />
                        View
                      </a>
                    ) : (
                      <span className="text-xs text-zinc-600">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium text-zinc-200">
                    ${Number(b.service.price).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
