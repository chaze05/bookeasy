"use client";

import { useTransition, useState } from "react";
import { Loader2, Clock, Settings2, Zap } from "lucide-react";
import { toast } from "sonner";

import { updateBookingSettings } from "@/actions/business";
import type { Business } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface BookingSettingsFormProps {
  business: Business | null;
}

export function BookingSettingsForm({ business }: BookingSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [allowMultiple, setAllowMultiple] = useState(
    business?.allow_multiple_bookings ?? false
  );
  const [maxPerSlot, setMaxPerSlot] = useState(
    business?.max_bookings_per_slot ?? 1
  );
  const [interval, setIntervalVal] = useState(
    business?.booking_interval ?? 30
  );
  const [hoursStart, setHoursStart] = useState(
    business?.business_hours_start ?? "09:00"
  );
  const [hoursEnd, setHoursEnd] = useState(
    business?.business_hours_end ?? "18:00"
  );
  const [realtimeEnabled, setRealtimeEnabled] = useState(
    business?.realtime_enabled ?? true
  );

  if (!business) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
        <p className="text-sm text-zinc-500">
          Create a business first to configure booking settings.
        </p>
      </div>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const fd = new FormData();
      fd.append("allow_multiple_bookings", String(allowMultiple));
      fd.append("max_bookings_per_slot", String(maxPerSlot));
      fd.append("booking_interval", String(interval));
      fd.append("business_hours_start", hoursStart);
      fd.append("business_hours_end", hoursEnd);
      fd.append("realtime_enabled", String(realtimeEnabled));
      try {
        await updateBookingSettings(business!.id, fd);
        toast.success("Booking settings saved");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  const inputClass =
    "border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20";

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      {/* Slot rules */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-zinc-500" />
          <h2 className="text-sm font-semibold text-zinc-100">Slot Rules</h2>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <Label className="text-zinc-300">
                Allow multiple bookings per slot
              </Label>
              <p className="mt-0.5 text-xs text-zinc-500">
                Let multiple customers book the same time slot simultaneously.
              </p>
            </div>
            <Switch
              checked={allowMultiple}
              onCheckedChange={setAllowMultiple}
            />
          </div>

          {allowMultiple && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-zinc-300">Max bookings per slot</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={maxPerSlot}
                onChange={(e) => setMaxPerSlot(Number(e.target.value))}
                className={`w-32 ${inputClass}`}
              />
              <p className="text-xs text-zinc-600">
                How many customers can book the same time slot.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label className="text-zinc-300">Booking interval</Label>
            <select
              value={interval}
              onChange={(e) => setIntervalVal(Number(e.target.value))}
              className="h-8 w-40 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            >
              {[15, 30, 45, 60, 90, 120].map((v) => (
                <option key={v} value={v} className="bg-zinc-800">
                  {v} min
                </option>
              ))}
            </select>
            <p className="text-xs text-zinc-600">
              Time gap between available booking slots.
            </p>
          </div>
        </div>
      </div>

      {/* Business hours */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-zinc-500" />
          <h2 className="text-sm font-semibold text-zinc-100">
            Business Hours
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-zinc-300">Opens at</Label>
            <Input
              type="time"
              value={hoursStart}
              onChange={(e) => setHoursStart(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-zinc-300">Closes at</Label>
            <Input
              type="time"
              value={hoursEnd}
              onChange={(e) => setHoursEnd(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Realtime */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <Zap className="h-4 w-4 shrink-0 text-zinc-500" />
            <div>
              <p className="text-sm font-semibold text-zinc-100">
                Live availability updates
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                Push real-time slot changes to clients as bookings occur.
              </p>
            </div>
          </div>
          <Switch
            checked={realtimeEnabled}
            onCheckedChange={setRealtimeEnabled}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isPending}
          className="bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Save booking settings"
          )}
        </Button>
      </div>
    </form>
  );
}
