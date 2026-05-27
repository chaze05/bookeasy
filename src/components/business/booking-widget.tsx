"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ArrowLeft,
  CreditCard,
  Smartphone,
  Globe,
  Landmark,
  Copy,
  Check,
  Upload,
  ExternalLink,
  Banknote,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getAvailableSlots, createPublicBooking } from "@/actions/bookings";
import { format } from "date-fns";

export interface BookingService {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  color: string;
}

export interface PaymentMethodData {
  id: string;
  type: string;
  label: string;
  details: Record<string, string> | null;
}

interface BookingWidgetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  business: { id: string; name: string };
  service: BookingService;
  paymentMethods?: PaymentMethodData[];
}

const PAYMENT_ICONS: Record<string, React.ElementType> = {
  stripe: CreditCard,
  gcash: Smartphone,
  maya: Smartphone,
  wise: Globe,
  bank_transfer: Landmark,
  cash: Banknote,
};

const PAYMENT_COLORS: Record<string, string> = {
  stripe: "#635BFF",
  gcash: "#007DFE",
  maya: "#00C896",
  wise: "#9FE870",
  bank_transfer: "#F59E0B",
  cash: "#22C55E",
};

function fmtTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

function fmtPrice(price: number) {
  return price % 1 === 0 ? price.toFixed(0) : price.toFixed(2);
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      onClick={handleCopy}
      className="ml-1.5 inline-flex shrink-0 items-center rounded p-0.5 text-zinc-500 transition-colors hover:text-zinc-300"
    >
      {copied ? (
        <Check className="h-3 w-3 text-emerald-400" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </button>
  );
}

export function BookingWidget({
  open,
  onOpenChange,
  business,
  service,
  paymentMethods = [],
}: BookingWidgetProps) {
  const hasPayment = paymentMethods.length > 0;
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedPaymentType, setSelectedPaymentType] = useState<string | null>(
    paymentMethods[0]?.type ?? null
  );
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });
  const [paymentProof, setPaymentProof] = useState<File | null>(null);

  const today = new Date().toISOString().split("T")[0];

  function reset() {
    setStep(1);
    setDate("");
    setSlots([]);
    setSelectedSlot("");
    setForm({ name: "", email: "", phone: "", notes: "" });
    setSelectedPaymentType(paymentMethods[0]?.type ?? null);
    setPaymentProof(null);
  }

  function handleOpenChange(v: boolean) {
    onOpenChange(v);
    if (!v) setTimeout(reset, 300);
  }

  async function handleDateChange(d: string) {
    setDate(d);
    setSelectedSlot("");
    setSlots([]);
    if (!d) return;
    setSlotsLoading(true);
    try {
      setSlots(await getAvailableSlots(business.id, service.id, d));
    } finally {
      setSlotsLoading(false);
    }
  }

  function submitBooking(proof: File | null) {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("businessId", business.id);
      fd.append("serviceId", service.id);
      fd.append("date", date);
      fd.append("time", selectedSlot);
      fd.append("customerName", form.name);
      fd.append("customerEmail", form.email);
      fd.append("customerPhone", form.phone);
      fd.append("notes", form.notes);
      if (activePaymentMethod) fd.append("paymentMethodId", activePaymentMethod.id);
      if (proof) fd.append("paymentProof", proof);
      try {
        await createPublicBooking(fd);
        setStep(3);
      } catch (e) {
        alert(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  function handleSubmit() {
    if (hasPayment) {
      setStep(4);
      return;
    }
    submitBooking(null);
  }

  function handlePaymentSubmit() {
    if (activePaymentRequiresProof && !paymentProof) {
      alert("Please upload a payment proof image.");
      return;
    }
    submitBooking(paymentProof);
  }

  // Steps: 1=Date/Time, 2=Details, 3=Success, 4=Payment
  const stepLabels = ["Date & Time", "Your Details"];
  const isFinalSuccess = step === 3 || step === 4;

  const activePaymentMethod = paymentMethods.find((m) => m.type === selectedPaymentType);
  const activePaymentRequiresProof = Boolean(activePaymentMethod && activePaymentMethod.type !== "cash");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTitle className="sr-only">Book {service.name}</DialogTitle>
      <DialogContent className="overflow-hidden border-zinc-800 bg-zinc-950 p-0 text-zinc-100 sm:max-w-[500px]">
        {/* Service color accent bar */}
        <div className="h-1 w-full" style={{ backgroundColor: service.color }} />

        <div className="px-6 pb-6 pt-5">
          {/* Step indicator — only during steps 1 & 2 */}
          {!isFinalSuccess && (
            <div className="mb-5 flex items-center gap-3">
              {stepLabels.map((label, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all",
                      step > i + 1
                        ? "bg-emerald-500 text-white"
                        : step === i + 1
                        ? "bg-zinc-800 text-zinc-200 ring-2 ring-emerald-500/60"
                        : "bg-zinc-800 text-zinc-600"
                    )}
                  >
                    {step > i + 1 ? "✓" : i + 1}
                  </div>
                  <span className={cn("text-xs", step === i + 1 ? "text-zinc-300" : "text-zinc-600")}>
                    {label}
                  </span>
                  {i < stepLabels.length - 1 && (
                    <div className={cn("h-px w-8", step > i + 1 ? "bg-emerald-500/40" : "bg-zinc-800")} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Service summary bar */}
          {!isFinalSuccess && (
            <div className="mb-5 flex items-center gap-3 rounded-xl bg-zinc-900 px-4 py-3">
              <div className="h-10 w-1 shrink-0 rounded-full" style={{ backgroundColor: service.color }} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-zinc-100">{service.name}</p>
                <p className="text-xs text-zinc-500">
                  {service.duration} min · ${fmtPrice(service.price)}
                  {step === 2 && date && selectedSlot && (
                    <> · <span className="text-zinc-400">{format(new Date(date + "T00:00:00"), "EEE, MMM d")} at {fmtTime(selectedSlot)}</span></>
                  )}
                </p>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* ── Step 1: Date & Time ── */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.16 }}
                className="flex flex-col gap-5"
              >
                <div className="flex flex-col gap-2">
                  <Label className="flex items-center gap-2 text-xs font-medium text-zinc-400">
                    <CalendarDays className="h-3.5 w-3.5 text-emerald-500" />
                    Choose a Date
                  </Label>
                  <input
                    type="date"
                    min={today}
                    value={date}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 [color-scheme:dark]"
                  />
                </div>

                <AnimatePresence>
                  {date && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col gap-2 overflow-hidden"
                    >
                      <Label className="flex items-center gap-2 text-xs font-medium text-zinc-400">
                        <Clock className="h-3.5 w-3.5 text-emerald-500" />
                        Available Times
                      </Label>
                      {slotsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-5 w-5 animate-spin text-zinc-600" />
                        </div>
                      ) : slots.length === 0 ? (
                        <div className="rounded-xl border border-zinc-800 py-6 text-center text-sm text-zinc-600">
                          No slots available for this date.
                        </div>
                      ) : (
                        <div className="grid max-h-52 grid-cols-4 gap-2 overflow-y-auto pr-1">
                          {slots.map((slot) => (
                            <button
                              key={slot}
                              onClick={() => setSelectedSlot(slot)}
                              className={cn(
                                "rounded-lg border py-2.5 text-xs font-medium transition-all",
                                selectedSlot === slot
                                  ? "border-emerald-500 bg-emerald-500/15 text-emerald-400"
                                  : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-800 hover:text-zinc-200"
                              )}
                            >
                              {fmtTime(slot)}
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  onClick={() => setStep(2)}
                  disabled={!selectedSlot}
                  className="h-11 w-full bg-emerald-500 text-white hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Continue <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </motion.div>
            )}

            {/* ── Step 2: Customer info ── */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.16 }}
                className="flex flex-col gap-4"
              >
                {[
                  { icon: <User className="h-3.5 w-3.5 text-emerald-500" />, label: "Full Name", required: true, type: "text", key: "name" as const, placeholder: "Jane Smith" },
                  { icon: <Mail className="h-3.5 w-3.5 text-emerald-500" />, label: "Email", required: true, type: "email", key: "email" as const, placeholder: "jane@example.com" },
                  { icon: <Phone className="h-3.5 w-3.5 text-emerald-500" />, label: "Phone", required: false, type: "tel", key: "phone" as const, placeholder: "+1 (555) 000-0000" },
                ].map((field) => (
                  <div key={field.key} className="flex flex-col gap-1.5">
                    <Label className="flex items-center gap-1.5 text-xs text-zinc-400">
                      {field.icon}
                      {field.label}
                      {field.required && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      type={field.type}
                      value={form[field.key]}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className="h-10 border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
                    />
                  </div>
                ))}

                <div className="flex flex-col gap-1.5">
                  <Label className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <FileText className="h-3.5 w-3.5 text-emerald-500" />
                    Notes
                  </Label>
                  <Textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Any special requests or notes…"
                    rows={2}
                    className="resize-none border-zinc-700 bg-zinc-900 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="gap-1.5 border-zinc-700 bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isPending || !form.name || !form.email}
                    className="h-11 flex-1 bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-30"
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : hasPayment ? "Continue to Payment" : "Confirm Booking"}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ── Step 3: Success (no payment methods) ── */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring" as const, stiffness: 300, damping: 26 }}
                className="flex flex-col items-center gap-5 py-6 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.12, type: "spring" as const, stiffness: 400, damping: 20 }}
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 ring-4 ring-emerald-500/20"
                >
                  <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                </motion.div>

                <div className="flex flex-col gap-2">
                  <h3 className="text-2xl font-bold text-zinc-100">{"You're all set!"}</h3>
                  <p className="text-zinc-400">
                    <span className="font-medium text-zinc-200">{service.name}</span> on{" "}
                    <span className="font-medium text-zinc-200">
                      {date && format(new Date(date + "T00:00:00"), "MMMM d, yyyy")}
                    </span>{" "}
                    at <span className="font-medium text-zinc-200">{fmtTime(selectedSlot)}</span>
                  </p>
                  <p className="text-sm text-zinc-600">{"We'll be in touch at "}<span className="text-zinc-500">{form.email}</span></p>
                </div>

                <div className="flex w-full flex-col gap-2 pt-2">
                  <Button onClick={() => handleOpenChange(false)} className="w-full bg-emerald-500 text-white hover:bg-emerald-400">
                    Done
                  </Button>
                  <button onClick={reset} className="text-xs text-zinc-600 transition-colors hover:text-zinc-400">
                    Book another appointment
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Step 4: Payment (with payment methods) ── */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col gap-5"
              >
                {/* Payment prompt */}
                <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-3">
                  <CreditCard className="h-4 w-4 shrink-0 text-emerald-400" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-emerald-300">Pay to confirm your booking</p>
                    <p className="text-xs text-zinc-500">
                      {service.name} · {date && format(new Date(date + "T00:00:00"), "MMM d")} at {fmtTime(selectedSlot)}
                    </p>
                  </div>
                </div>

                {/* Amount due */}
                <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
                  <p className="text-sm text-zinc-400">Amount due</p>
                  <p className="text-xl font-bold text-zinc-100">${fmtPrice(service.price)}</p>
                </div>

                {/* Payment method tabs */}
                <div>
                  <p className="mb-2 text-xs font-medium text-zinc-400">Choose payment method</p>
                  <div className="flex flex-wrap gap-2">
                    {paymentMethods.map((m) => {
                      const Icon = PAYMENT_ICONS[m.type] ?? CreditCard;
                      const color = PAYMENT_COLORS[m.type] ?? "#71717a";
                      const isSelected = selectedPaymentType === m.type;
                      return (
                        <button
                          key={m.type}
                          onClick={() => setSelectedPaymentType(m.type)}
                          className={cn(
                            "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                            isSelected
                              ? "border-transparent text-white"
                              : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                          )}
                          style={isSelected ? { backgroundColor: `${color}25`, borderColor: color, color } : {}}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Payment details panel */}
                {activePaymentMethod && (
                  <motion.div
                    key={activePaymentMethod.type}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
                  >
                    {activePaymentMethod.details && Object.keys(activePaymentMethod.details).length > 0 ? (
                      <div className="flex flex-col gap-2.5">
                        {Object.entries(activePaymentMethod.details).map(([key, value]) => {
                          if (!value) return null;
                          const isImage = key.includes("qr") || /\.(png|jpe?g|webp|gif)(\?.*)?$/i.test(value);
                          const isLink = /^https?:\/\//i.test(value);

                          if (isImage) {
                            return (
                              <div key={key} className="flex flex-col gap-2">
                                <p className="text-xs capitalize text-zinc-500">
                                  {key.replace(/_/g, " ")}
                                </p>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={value}
                                  alt={`${activePaymentMethod.label} QR code`}
                                  className="mx-auto max-h-56 rounded-lg border border-zinc-800 bg-white object-contain p-2"
                                />
                              </div>
                            );
                          }

                          return (
                            <div key={key} className="flex items-center justify-between gap-4">
                              <p className="text-xs capitalize text-zinc-500">
                                {key.replace(/_/g, " ")}
                              </p>
                              <div className="flex items-center">
                                {isLink ? (
                                  <a
                                    href={value}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-sm font-medium text-emerald-400 hover:text-emerald-300"
                                  >
                                    Open link <ExternalLink className="h-3 w-3" />
                                  </a>
                                ) : (
                                  <p className="text-right text-sm font-medium text-zinc-200">{value}</p>
                                )}
                                <CopyButton text={value} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-center text-xs text-zinc-500 py-3">
                        Contact the business for payment details.
                      </p>
                    )}
                  </motion.div>
                )}

                <div className="flex flex-col gap-2">
                  {activePaymentRequiresProof && (
                  <div className="flex flex-col gap-1.5">
                    <Label className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <Upload className="h-3.5 w-3.5 text-emerald-500" />
                      Upload payment proof <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPaymentProof(e.target.files?.[0] ?? null)}
                      className="border-zinc-700 bg-zinc-900 text-zinc-100 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-800 file:px-3 file:py-1.5 file:text-xs file:text-zinc-200"
                    />
                    <p className="text-[11px] text-zinc-600">Screenshot or photo, 5MB max.</p>
                  </div>
                  )}
                  <Button
                    onClick={handlePaymentSubmit}
                    disabled={isPending || (activePaymentRequiresProof && !paymentProof)}
                    className="w-full bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-30"
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : activePaymentRequiresProof ? "Submit payment proof" : "Confirm booking"}
                  </Button>
                  <button
                    onClick={reset}
                    className="text-xs text-zinc-600 transition-colors hover:text-zinc-400"
                  >
                    Book another appointment
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
