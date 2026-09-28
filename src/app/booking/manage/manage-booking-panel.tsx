"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { cancelBookingByToken, getManageSlots, rescheduleBooking } from "@/actions/booking-manage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ManageBookingPanelProps {
  token: string;
  timeZone: string;
  initialDate: string;
  initialSlots?: string[];
  todayKey: string;
  businessHours: string;
}

function fmtTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

export function ManageBookingPanel({
  token,
  timeZone,
  initialDate,
  initialSlots = [],
  todayKey,
  businessHours,
}: ManageBookingPanelProps) {
  const router = useRouter();
  const [date, setDate] = useState(initialDate);
  const [slots, setSlots] = useState<string[]>(initialSlots);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleDateChange(value: string) {
    setDate(value);
    setSelectedSlot("");
    setSlots([]);
    if (!value) return;
    setLoadingSlots(true);
    try {
      setSlots(await getManageSlots(token, value));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load times");
    } finally {
      setLoadingSlots(false);
    }
  }

  function handleReschedule() {
    if (!selectedSlot) return;
    startTransition(async () => {
      try {
        await rescheduleBooking(token, date, selectedSlot);
        toast.success("Booking moved to the new time.");
        setSelectedSlot("");
        setSlots([]);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not reschedule");
      }
    });
  }

  function handleCancel() {
    const confirmed = window.confirm(
      "Cancel this booking? This cannot be undone and the slot will be released."
    );
    if (!confirmed) return;

    startTransition(async () => {
      try {
        await cancelBookingByToken(token);
        toast.success("Booking cancelled.");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not cancel");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6 border-t border-zinc-800 pt-6">
      <div>
        <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
          <CalendarDays className="h-4 w-4 text-emerald-400" />
          Reschedule this booking
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Pick a new date and time. Business hours: {businessHours} ({timeZone}).
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-zinc-300">New date</Label>
        <Input
          type="date"
          min={todayKey}
          value={date}
          onChange={(e) => handleDateChange(e.target.value)}
          className="w-full border-zinc-700 bg-zinc-900 text-zinc-100 [color-scheme:dark] sm:w-56"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="flex items-center gap-1.5 text-zinc-300">
          <Clock className="h-3.5 w-3.5 text-zinc-500" />
          Available times
        </Label>
        {loadingSlots ? (
          <p className="flex items-center gap-2 py-2 text-xs text-zinc-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking availability…
          </p>
        ) : slots.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {slots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setSelectedSlot(slot)}
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                  selectedSlot === slot
                    ? "border-emerald-500 bg-emerald-500/15 text-emerald-300"
                    : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-600"
                }`}
              >
                {fmtTime(slot)}
              </button>
            ))}
          </div>
        ) : (
          <p className="py-1 text-xs text-zinc-600">
            {date ? "No available times on this date." : "Choose a date to see available times."}
          </p>
        )}
      </div>

      <Button
        type="button"
        onClick={handleReschedule}
        disabled={isPending || !selectedSlot}
        className="w-full bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-40"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm new time"}
      </Button>

      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
        <p className="flex items-center gap-2 text-xs font-medium text-red-300">
          <TriangleAlert className="h-3.5 w-3.5" />
          Can&apos;t make it?
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Cancelling releases your slot immediately.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isPending}
          className="mt-3 w-full border-red-500/30 bg-transparent text-red-300 hover:bg-red-500/10 hover:text-red-200"
        >
          Cancel booking
        </Button>
      </div>
    </div>
  );
}
