"use client";

import { useRef, useTransition } from "react";
import { format } from "date-fns";
import { Loader2, ReceiptText } from "lucide-react";
import { toast } from "sonner";
import { submitSubscriptionPayment } from "@/actions/payments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type SubscriptionPayment = {
  id: string;
  payment_method_type: string;
  payment_proof_url: string;
  status: string;
  notes: string | null;
  created_at: string | Date;
};

type SubscriptionMethod = {
  type: string;
  label: string;
  details: Record<string, string> | null;
};

export function SubscriptionForm({
  payments,
  methods,
}: {
  payments: SubscriptionPayment[];
  methods: SubscriptionMethod[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      try {
        await submitSubscriptionPayment(formData);
        toast.success("Subscription proof uploaded");
        formRef.current?.reset();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to upload subscription proof");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <form ref={formRef} action={submit} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-zinc-100">Subscription payment</h2>
          <p className="text-xs text-zinc-500">Select how you paid and upload your proof.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Payment method</Label>
            <select
              name="payment_method_type"
              required
              className="h-9 rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
            >
              <option value="">Select method</option>
              {methods.map((method) => (
                <option key={method.type} value={method.type}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Proof image</Label>
            <Input
              name="payment_proof"
              type="file"
              accept="image/*"
              required
              className="border-zinc-700 bg-zinc-950 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-800 file:px-3 file:py-1.5 file:text-xs file:text-zinc-200"
            />
          </div>
        </div>

        {methods.length > 0 && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {methods.map((method) => (
              <div key={method.type} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                <p className="text-sm font-medium text-zinc-200">{method.label}</p>
                {method.details && Object.keys(method.details).length > 0 ? (
                  <div className="mt-2 flex flex-col gap-1">
                    {Object.entries(method.details).map(([key, value]) =>
                      value ? (
                        <p key={key} className="break-all text-xs text-zinc-500">
                          <span className="capitalize text-zinc-600">{key.replace(/_/g, " ")}:</span> {value}
                        </p>
                      ) : null
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-zinc-600">No details configured.</p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-col gap-1.5">
          <Label>Notes</Label>
          <Textarea
            name="notes"
            rows={2}
            placeholder="Reference number or billing note"
            className="border-zinc-700 bg-zinc-950"
          />
        </div>

        <div className="mt-4 flex justify-end">
          <Button type="submit" disabled={isPending} className="bg-emerald-500 text-white hover:bg-emerald-400">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload proof"}
          </Button>
        </div>
      </form>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="border-b border-zinc-800 px-5 py-3">
          <h3 className="text-sm font-semibold text-zinc-100">Recent uploads</h3>
        </div>
        {payments.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-zinc-500">No subscription proofs uploaded yet.</p>
        ) : (
          <div className="divide-y divide-zinc-800">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-zinc-200">
                    {payment.payment_method_type.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {format(new Date(payment.created_at), "MMM d, yyyy h:mm a")} · {payment.status}
                  </p>
                </div>
                <a
                  href={payment.payment_proof_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300"
                >
                  <ReceiptText className="h-3.5 w-3.5" />
                  View proof
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
