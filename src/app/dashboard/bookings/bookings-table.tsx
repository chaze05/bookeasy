"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { MoreHorizontal, CalendarCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { updateBookingStatus } from "@/actions/bookings";
import type { BookingWithRelations, BookingStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
}

function BookingRow({ booking }: BookingRowProps) {
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(status: BookingStatus) {
    startTransition(async () => {
      try {
        await updateBookingStatus(booking.id, status);
        toast.success(`Booking marked as ${statusLabel[status]}`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to update");
      }
    });
  }

  return (
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
  );
}

interface BookingsTableProps {
  bookings: BookingWithRelations[];
}

export function BookingsTable({ bookings }: BookingsTableProps) {
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
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((booking) => (
                <BookingRow key={booking.id} booking={booking} />
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
