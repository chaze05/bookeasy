"use client";

import { useState, useTransition } from "react";
import { Check, Copy, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updatePaymongoSettings } from "@/actions/business";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface PaymongoSettingsFormProps {
  status: {
    enabled: boolean;
    hasSecretKey: boolean;
    hasWebhookSecret: boolean;
  };
}

export function PaymongoSettingsForm({ status }: PaymongoSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(status.enabled);
  const [secretKey, setSecretKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [copied, setCopied] = useState(false);

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/payments/paymongo/webhook`
      : "/api/payments/paymongo/webhook";

  function copyWebhookUrl() {
    navigator.clipboard.writeText(webhookUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const fd = new FormData();
      fd.append("paymongo_enabled", String(enabled));
      if (secretKey.trim()) fd.append("paymongo_secret_key", secretKey.trim());
      if (webhookSecret.trim()) fd.append("paymongo_webhook_secret", webhookSecret.trim());
      try {
        await updatePaymongoSettings(fd);
        setSecretKey("");
        setWebhookSecret("");
        toast.success("Online payment settings saved");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Something went wrong");
      }
    });
  }

  const inputClass =
    "border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20";

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-zinc-500" />
            <h2 className="text-sm font-semibold text-zinc-100">Online payments (PayMongo)</h2>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        <p className="text-xs text-zinc-500">
          Lets customers pay instantly with GCash, Maya, GrabPay, card or QR Ph. Deposits are
          charged up front and the booking is confirmed automatically once payment succeeds.
          Payments go directly to your own PayMongo account.
        </p>

        <div className="mt-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-zinc-300">
              PayMongo secret key {status.hasSecretKey && <span className="text-emerald-400">(saved)</span>}
            </Label>
            <Input
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder={status.hasSecretKey ? "•••••••• saved — paste a new key to replace" : "sk_test_… or sk_live_…"}
              className={inputClass}
              autoComplete="off"
            />
            <p className="text-xs text-zinc-600">
              PayMongo Dashboard → Developers → API Keys. Stored encrypted; never shown again.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-zinc-300">
              Webhook signing secret{" "}
              {status.hasWebhookSecret && <span className="text-emerald-400">(saved)</span>}
            </Label>
            <Input
              type="password"
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              placeholder={status.hasWebhookSecret ? "•••••••• saved — paste a new secret to replace" : "whsk_…"}
              className={inputClass}
              autoComplete="off"
            />
            <p className="text-xs text-zinc-600">
              PayMongo Dashboard → Developers → Webhooks → create one pointing at the URL below,
              then paste its signing secret here.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-zinc-300">Webhook URL</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 truncate rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-xs text-zinc-300">
                {webhookUrl}
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={copyWebhookUrl}
                className="shrink-0 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-zinc-600">
              In the webhook settings, subscribe to the <strong>checkout_session.payment.paid</strong>{" "}
              event.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isPending}
          className="bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save online payment settings"}
        </Button>
      </div>
    </form>
  );
}
