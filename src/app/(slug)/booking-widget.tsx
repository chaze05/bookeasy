"use client";

import { useState, useTransition } from "react";
import {
  CalendarDays,
  Clock,
  User,
  Mail,
  Phone,
  FileText,
  ChevronRight,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getAvailableSlots, createPublicBooking } from "@/actions/bookings";
import { format } from "date-fns";

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  color: string;
}

interface BookingWidgetProps {
  business: { id: string; name: string };
  services: Service[];
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const period = h < 12 ? "AM" : "PM";
  const displayH = h % 12 || 12;
  return `${displayH}:${m.toString().padStart(2, "0")} ${period}`;
}

export function BookingWidget({ business, services }: BookingWidgetProps) {
  const [open, setOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    notes: "",
  });

  const today = new Date().toISOString().split("T")[0];

  function openDialog(svc: Service) {
    setSelectedService(svc);
    setStep(1);
    setDate("");
    setSlots([]);
    setSelectedSlot("");
    setForm({ customerName: "", customerEmail: "", customerPhone: "", notes: "" });
    setOpen(true);
  }

  async function handleDateChange(newDate: string) {
    setDate(newDate);
    setSelectedSlot("");
    setSlots([]);
    if (!newDate || !selectedService) return;
    setSlotsLoading(true);
    try {
      const available = await getAvailableSlots(business.id, selectedService.id, newDate);
      setSlots(available);
    } finally {
      setSlotsLoading(false);
    }
  }

  function handleSubmit() {
    if (!selectedService || !date || !selectedSlot) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append("businessId", business.id);
      fd.append("serviceId", selectedService.id);
      fd.append("date", date);
      fd.append("time", selectedSlot);
      fd.append("customerName", form.customerName);
      fd.append("customerEmail", form.customerEmail);
      fd.append("customerPhone", form.customerPhone);
      fd.append("notes", form.notes);
      try {
        await createPublicBooking(fd);
        setStep(3);
      } catch (e) {
        alert(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  const inputClass =
    "border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 h-8 text-sm";

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((svc) => (
          <div
            key={svc.id}
            className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition-all hover:border-zinc-700"
          >
            <div
              className="mb-3 h-1 w-10 rounded-full"
              style={{ backgroundColor: svc.color }}
            />
            <h3 className="font-semibold text-zinc-100">{svc.name}</h3>
            {svc.description && (
              <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{svc.description}</p>
            )}
            <div className="mt-3 flex items-center gap-3 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {svc.duration} min
              </span>
              <span className="font-medium text-emerald-400">
                ${svc.price.toFixed(0)}
              </span>
            </div>
            <Button
              onClick={() => openDialog(svc)}
              className="mt-4 h-8 w-full bg-emerald-500 text-xs text-white hover:bg-emerald-400"
            >
              Book Now
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-900 text-zinc-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">
              {step === 3 ? "You&apos;re Booked!" : `Book: ${selectedService?.name}`}
            </DialogTitle>
          </DialogHeader>

          {/* Step 1: Date & Time */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="flex items-center gap-1.5 text-xs text-zinc-300">
                  <CalendarDays className="h-3.5 w-3.5" /> Date
                </Label>
                <input
                  type="date"
                  min={today}
                  value={date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="h-8 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              {date && (
                <div className="flex flex-col gap-2">
                  <Label className="flex items-center gap-1.5 text-xs text-zinc-300">
                    <Clock className="h-3.5 w-3.5" /> Available Times
                  </Label>
                  {slotsLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
                    </div>
                  ) : slots.length === 0 ? (
                    <p className="py-4 text-center text-sm text-zinc-500">
                      No slots available for this date.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                      {slots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setSelectedSlot(slot)}
                          className={cn(
                            "rounded-lg border py-2 text-xs transition-all",
                            selectedSlot === slot
                              ? "border-emerald-500 bg-emerald-500/15 text-emerald-400"
                              : "border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"
                          )}
                        >
                          {formatTime(slot)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Button
                onClick={() => setStep(2)}
                disabled={!selectedSlot}
                className="bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-40"
              >
                Continue <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 2: Customer Info */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div className="rounded-lg bg-zinc-800 px-3 py-2 text-xs text-zinc-400">
                {date &&
                  format(new Date(date + "T00:00:00"), "EEEE, MMMM d, yyyy")}{" "}
                at {formatTime(selectedSlot)} &middot; {selectedService?.name}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="flex items-center gap-1.5 text-xs text-zinc-300">
                  <User className="h-3.5 w-3.5" /> Full Name *
                </Label>
                <Input
                  value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  placeholder="Jane Smith"
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="flex items-center gap-1.5 text-xs text-zinc-300">
                  <Mail className="h-3.5 w-3.5" /> Email *
                </Label>
                <Input
                  type="email"
                  value={form.customerEmail}
                  onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                  placeholder="jane@example.com"
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="flex items-center gap-1.5 text-xs text-zinc-300">
                  <Phone className="h-3.5 w-3.5" /> Phone
                </Label>
                <Input
                  type="tel"
                  value={form.customerPhone}
                  onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="flex items-center gap-1.5 text-xs text-zinc-300">
                  <FileText className="h-3.5 w-3.5" /> Notes
                </Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Any special requests…"
                  rows={2}
                  className="border-zinc-700 bg-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isPending || !form.customerName || !form.customerEmail}
                  className="flex-1 bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-40"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Confirm Booking"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
              <div>
                <p className="font-semibold text-zinc-100">Booking confirmed!</p>
                <p className="mt-1 text-sm text-zinc-500">
                  {selectedService?.name} on{" "}
                  {date && format(new Date(date + "T00:00:00"), "MMMM d")}{" "}
                  at {formatTime(selectedSlot)}
                </p>
                <p className="mt-1 text-xs text-zinc-600">
                  We&apos;ll be in touch at {form.customerEmail}.
                </p>
              </div>
              <Button
                onClick={() => setOpen(false)}
                className="bg-emerald-500 text-white hover:bg-emerald-400"
              >
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
