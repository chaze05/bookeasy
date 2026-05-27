"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { MoreHorizontal, CalendarCheck, Loader2, ReceiptText } from "lucide-react";
import { toast } from "sonner";

import { completeBookingWithPayment, updateBookingStatus } from "@/actions/bookings";
import type { BookingWithRelations, BookingStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusVariant: Record<
  BookingStatus,
  "success" | "warning" | "destructive" | "secondary" | "outline"
> = {
  confirmed: "success",
  pending: "warning",
  cancelled: "destructive",
  no_show: "secondary",
  completed: "outline",
};

const statusLabel: Record<BookingStatus, string> = {
  confirmed: "Confirmed",
  pending: "Pending",
  cancelled: "Cancelled",
  no_show: "No Show",
  completed: "Completed",
};

const allStatuses: BookingStatus[] = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
];

interface BookingRowProps {
  booking: BookingWithRelations;
  paymentMethods: PaymentMethodOption[];
}

type PaymentMethodOption = {
  id: string;
  type: string;
  label: string;
};

function BookingRow({ booking, paymentMethods }: BookingRowProps) {
  const [isPending, startTransition] = useTransition();
  const [completeOpen, setCompleteOpen] = useState(false);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState(paymentMethods[0]?.id ?? "");
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);
  const selectedPaymentMethod = paymentMethods.find((method) => method.id === selectedPaymentMethodId);
  const requiresProof = selectedPaymentMethod
    ? selectedPaymentMethod.type !== "cash"
    : false;

  function handleStatusChange(status: BookingStatus) {
    if (status === "completed") {
      setCompleteOpen(true);
      return;
    }

    startTransition(async () => {
      try {
        await updateBookingStatus(booking.id, status);
        toast.success(`Booking marked as ${statusLabel[status]}`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to update");
      }
    });
  }

  function handleComplete(formData: FormData) {
    formData.set("bookingId", booking.id);
    startTransition(async () => {
      try {
        await completeBookingWithPayment(formData);
        toast.success("Payment received and booking completed");
        setCompleteOpen(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to complete booking");
      }
    });
  }

  return (
    <>
    <TableRow className={isPending ? "opacity-50" : ""}>
      <TableCell className="font-medium text-zinc-100">
        <div>
          <p>{booking.customer_name}</p>
          <p className="text-xs text-zinc-500">{booking.customer_email}</p>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: booking.service.color }}
          />
          {booking.service.name}
        </div>
      </TableCell>
      <TableCell>{booking.staff?.full_name ?? "—"}</TableCell>
      <TableCell className="whitespace-nowrap">
        {format(new Date(booking.starts_at), "MMM d, yyyy")}
        <br />
        <span className="text-xs text-zinc-500">
          {format(new Date(booking.starts_at), "h:mm a")}
        </span>
      </TableCell>
      <TableCell>
        <Badge variant={statusVariant[booking.status]}>
          {statusLabel[booking.status]}
        </Badge>
      </TableCell>
      <TableCell>
        {booking.payment_proof_url ? (
          <a
            href={booking.payment_proof_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300"
          >
            <ReceiptText className="h-3.5 w-3.5" />
            View proof
          </a>
        ) : (
          <span className="text-xs text-zinc-600">-</span>
        )}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MoreHorizontal className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 bg-zinc-900 border-zinc-800">
            <DropdownMenuLabel className="text-zinc-500 text-xs">
              Change status
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-zinc-800" />
            {allStatuses
              .filter((s) => s !== booking.status)
              .map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
                >
                  {statusLabel[s]}
                </DropdownMenuItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>

    <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Receive payment</DialogTitle>
          <DialogDescription>
            Mark {booking.customer_name}&apos;s booking complete after recording payment.
          </DialogDescription>
        </DialogHeader>

        <form action={handleComplete} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Payment method</Label>
            <select
              name="paymentMethodId"
              value={selectedPaymentMethodId}
              onChange={(e) => {
                setSelectedPaymentMethodId(e.target.value);
                setProofPreviewUrl(null);
              }}
              required
              className="h-9 rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
            >
              <option value="">Select payment method</option>
              {paymentMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          {requiresProof && (
            <div className="flex flex-col gap-1.5">
              <Label>Proof of payment</Label>
              <Input
                name="paymentProof"
                type="file"
                accept="image/*"
                required
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setProofPreviewUrl(file ? URL.createObjectURL(file) : null);
                }}
                className="border-zinc-700 bg-zinc-950 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-800 file:px-3 file:py-1.5 file:text-xs file:text-zinc-200"
              />
              <p className="text-xs text-zinc-500">Required for digital transfers.</p>
              {proofPreviewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={proofPreviewUrl}
                  alt="Payment proof preview"
                  className="mt-2 max-h-56 rounded-lg border border-zinc-800 object-contain"
                />
              )}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>Notes</Label>
            <Textarea
              name="paymentNotes"
              rows={2}
              placeholder="Reference number, cash received, or other payment notes"
              className="border-zinc-700 bg-zinc-950"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCompleteOpen(false)}
              className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !selectedPaymentMethodId} className="bg-emerald-500 text-white hover:bg-emerald-400">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Complete booking"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}

interface BookingsTableProps {
  bookings: BookingWithRelations[];
  paymentMethods: PaymentMethodOption[];
}

export function BookingsTable({ bookings, paymentMethods }: BookingsTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered =
    statusFilter === "all"
      ? bookings
      : bookings.filter((b) => b.status === statusFilter);

  return (
    <div className="flex flex-col gap-4">
      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {allStatuses.map((s) => (
              <SelectItem key={s} value={s}>
                {statusLabel[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto text-xs text-zinc-500">
          {filtered.length} booking{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <CalendarCheck className="h-8 w-8 text-zinc-700" />
            <p className="text-sm text-zinc-500">No bookings found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Proof</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((booking) => (
                <BookingRow key={booking.id} booking={booking} paymentMethods={paymentMethods} />
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
