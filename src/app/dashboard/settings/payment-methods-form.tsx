"use client";

import { useState, useTransition, useRef } from "react";
import { Loader2, WalletCards, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { ownerUpdatePaymentMethod } from "@/actions/payments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type Method = {
  id?: string;
  type: string;
  label: string;
  is_enabled: boolean;
  sort_order: number;
  details: Record<string, string> | null;
};

const METHODS = [
  { type: "gcash", label: "GCash" },
  { type: "maya", label: "Maya" },
  { type: "bank_transfer", label: "Bank Transfer" },
  { type: "wise", label: "Wise" },
  { type: "stripe", label: "Credit / Debit Card" },
  { type: "cash", label: "Cash" },
];

const FIELDS_BY_TYPE: Record<string, string[]> = {
  gcash: ["account_name", "number", "qr_image_url", "app_link", "payment_link"],
  maya: ["account_name", "number", "qr_image_url", "app_link", "payment_link"],
  wise: ["account_name", "email", "payment_link", "account_number", "routing_number", "swift_code"],
  bank_transfer: ["bank_name", "account_name", "account_number", "branch", "swift_code", "qr_image_url"],
  stripe: ["publishable_key", "payment_link", "webhook_endpoint"],
  cash: ["instructions"],
};

const FIELD_LABELS: Record<string, string> = {
  account_name: "Account name",
  number: "Wallet number",
  qr_image_url: "QR image URL",
  app_link: "App deep link",
  payment_link: "Payment link",
  email: "Email",
  account_number: "Account number",
  routing_number: "Routing number",
  swift_code: "SWIFT / bank code",
  bank_name: "Bank name",
  branch: "Branch",
  publishable_key: "Publishable key",
  webhook_endpoint: "Webhook endpoint",
  instructions: "Instructions",
};

const inputClass =
  "border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20";

export function PaymentMethodsForm({ methods }: { methods: Method[] }) {
  const methodMap = new Map(methods.map((m) => [m.type, m]));

  return (
    <div className="flex flex-col gap-6">
      {/* Header card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="mb-4 flex items-center gap-2">
          <WalletCards className="h-4 w-4 text-zinc-500" />
          <h2 className="text-sm font-semibold text-zinc-100">
            Accepted payment methods
          </h2>
        </div>
        <p className="text-xs text-zinc-500">
          Toggle payment methods on or off. Enabled methods appear on your
          public booking page. Expand a method to configure its details.
        </p>
      </div>

      {/* One card per payment method */}
      {METHODS.map((meta, index) => (
        <PaymentMethodCard
          key={meta.type}
          method={
            methodMap.get(meta.type) ?? {
              type: meta.type,
              label: meta.label,
              is_enabled: false,
              sort_order: index,
              details: {},
            }
          }
        />
      ))}
    </div>
  );
}

function PaymentMethodCard({ method }: { method: Method }) {
  const [isPending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(method.is_enabled);
  const [isOpen, setIsOpen] = useState(method.is_enabled);
  const formRef = useRef<HTMLFormElement>(null);
  const fields = FIELDS_BY_TYPE[method.type] ?? [];

  function handleToggle(checked: boolean) {
    setEnabled(checked);
    if (checked) {
      setIsOpen(true);
    }

    // Submit just the toggle change immediately
    const fd = new FormData();
    fd.set("id", method.id ?? "");
    fd.set("type", method.type);
    fd.set("label", method.label);
    fd.set("sort_order", String(method.sort_order));
    if (checked) fd.set("is_enabled", "on");

    // Preserve existing details
    for (const key of fields) {
      const val = method.details?.[key] ?? "";
      if (val) fd.set(key, val);
    }

    startTransition(async () => {
      try {
        await ownerUpdatePaymentMethod(fd);
        toast.success(
          `${method.label} ${checked ? "enabled" : "disabled"}`
        );
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Failed to update"
        );
        setEnabled(!checked);
      }
    });
  }

  function handleDetailsSave(formData: FormData) {
    if (enabled) {
      formData.set("is_enabled", "on");
    } else {
      formData.delete("is_enabled");
    }

    startTransition(async () => {
      try {
        await ownerUpdatePaymentMethod(formData);
        toast.success(`${method.label} details saved`);
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Failed to save"
        );
      }
    });
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      {/* Header row — always visible */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          onClick={() => setIsOpen((o) => !o)}
        >
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-100">
              {method.label}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {method.type.replace(/_/g, " ")}
            </p>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-2">
          <Label
            htmlFor={`${method.type}-toggle`}
            className="text-xs text-zinc-500 cursor-pointer"
          >
            {enabled ? "Active" : "Inactive"}
          </Label>
          <Switch
            id={`${method.type}-toggle`}
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={isPending}
          />
        </div>
      </div>

      {/* Expandable details form */}
      {isOpen && (
        <form
          ref={formRef}
          action={handleDetailsSave}
          className="mt-4 border-t border-zinc-800 pt-4"
        >
          <input type="hidden" name="id" value={method.id ?? ""} />
          <input type="hidden" name="type" value={method.type} />
          <input type="hidden" name="label" value={method.label} />
          <input
            type="hidden"
            name="sort_order"
            value={method.sort_order}
          />

          {/* Preserve existing QR URL in case no new file is uploaded */}
          {fields.includes("qr_image_url") && (
            <input
              type="hidden"
              name="qr_image_url"
              value={method.details?.qr_image_url ?? ""}
            />
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field} className="flex flex-col gap-1.5">
                <Label className="text-zinc-300">
                  {FIELD_LABELS[field]}
                </Label>
                <Input
                  name={field}
                  defaultValue={method.details?.[field] ?? ""}
                  className={inputClass}
                />
              </div>
            ))}
          </div>

          {fields.includes("qr_image_url") && (
            <div className="mt-4 flex flex-col gap-1.5">
              <Label className="text-zinc-300">Upload QR image</Label>
              <Input
                name="qr_image_file"
                type="file"
                accept="image/*"
                className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-zinc-800 file:px-3 file:py-1.5 file:text-xs file:text-zinc-200`}
              />
              {method.details?.qr_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={method.details.qr_image_url}
                  alt={`${method.label} QR code`}
                  className="mt-2 h-28 w-28 rounded-lg border border-zinc-800 bg-white object-contain p-2"
                />
              )}
            </div>
          )}

          <div className="mt-5 flex justify-end">
            <Button
              type="submit"
              disabled={isPending}
              className="bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save details"
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
