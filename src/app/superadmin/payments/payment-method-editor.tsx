"use client";

import { useState, useTransition } from "react";
import { Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { adminUpdatePaymentMethod } from "@/actions/payments";
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
import { Switch } from "@/components/ui/switch";

type EditableMethod = {
  id: string;
  type: string;
  label: string;
  is_enabled: boolean;
  sort_order: number;
  details: Record<string, string> | null;
  business: { name: string; slug: string };
};

const FIELD_LABELS: Record<string, string> = {
  account_name: "Account name",
  number: "Wallet number",
  qr_image_url: "QR image URL",
  qr_image_file: "Upload QR image",
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

const FIELDS_BY_TYPE: Record<string, string[]> = {
  gcash: ["account_name", "number", "qr_image_url", "app_link", "payment_link"],
  maya: ["account_name", "number", "qr_image_url", "app_link", "payment_link"],
  wise: ["account_name", "email", "payment_link", "account_number", "routing_number", "swift_code"],
  bank_transfer: ["bank_name", "account_name", "account_number", "branch", "swift_code", "qr_image_url"],
  stripe: ["publishable_key", "payment_link", "webhook_endpoint"],
  cash: ["instructions"],
};

export function PaymentMethodEditor({ method }: { method: EditableMethod }) {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(method.is_enabled);
  const [isPending, startTransition] = useTransition();
  const fields = FIELDS_BY_TYPE[method.type] ?? FIELDS_BY_TYPE.stripe;

  function submit(formData: FormData) {
    formData.set("id", method.id);
    if (enabled) formData.set("is_enabled", "on");

    startTransition(async () => {
      try {
        await adminUpdatePaymentMethod(formData);
        toast.success("Payment method updated");
        setOpen(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to update payment method");
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit {method.label}</DialogTitle>
            <DialogDescription>
              {method.business.name} /{method.business.slug}
            </DialogDescription>
          </DialogHeader>

          <form action={submit} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${method.id}-label`}>Label</Label>
                <Input
                  id={`${method.id}-label`}
                  name="label"
                  defaultValue={method.label}
                  className="border-zinc-700 bg-zinc-950"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${method.id}-sort`}>Sort order</Label>
                <Input
                  id={`${method.id}-sort`}
                  name="sort_order"
                  type="number"
                  defaultValue={method.sort_order}
                  className="border-zinc-700 bg-zinc-950"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-zinc-100">Enabled</p>
                <p className="text-xs text-zinc-500">Show this method on the booking page.</p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((field) => (
                <div key={field} className="flex flex-col gap-1.5">
                  <Label htmlFor={`${method.id}-${field}`}>
                    {FIELD_LABELS[field] ?? field.replace(/_/g, " ")}
                  </Label>
                  <Input
                    id={`${method.id}-${field}`}
                    name={field}
                    defaultValue={method.details?.[field] ?? ""}
                    className="border-zinc-700 bg-zinc-950"
                  />
                </div>
              ))}
            </div>

            {fields.includes("qr_image_url") && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${method.id}-qr-file`}>Upload QR image</Label>
                <Input
                  id={`${method.id}-qr-file`}
                  name="qr_image_file"
                  type="file"
                  accept="image/*"
                  className="border-zinc-700 bg-zinc-950 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-800 file:px-3 file:py-1.5 file:text-xs file:text-zinc-200"
                />
                {method.details?.qr_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={method.details.qr_image_url}
                    alt={`${method.label} QR code`}
                    className="mt-2 h-32 w-32 rounded-lg border border-zinc-800 bg-white object-contain p-2"
                  />
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="bg-emerald-500 text-white hover:bg-emerald-400">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
