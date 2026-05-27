import { CreditCard, Smartphone, Globe, Landmark, CreditCard as CardIcon, Banknote } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";
import { Badge } from "@/components/ui/badge";
import { PaymentTypeToggle } from "@/components/superadmin/payment-type-toggle";
import { PaymentMethodEditor } from "./payment-method-editor";

export const metadata = { title: "Payments — Superadmin" };

const GATEWAY_META: Record<
  string,
  { label: string; icon: React.ElementType; color: string; description: string }
> = {
  gcash: {
    label: "GCash",
    icon: Smartphone,
    color: "#007DFE",
    description: "Popular mobile wallet widely used across the Philippines.",
  },
  maya: {
    label: "Maya",
    icon: Smartphone,
    color: "#00C896",
    description: "PayMaya — digital payments for the Philippine market.",
  },
  bank_transfer: {
    label: "Bank Transfer",
    icon: Landmark,
    color: "#F59E0B",
    description: "Direct bank deposit — BPI, BDO, UnionBank, and others.",
  },
  stripe: {
    label: "Stripe",
    icon: CreditCard,
    color: "#635BFF",
    description: "Accept cards, digital wallets, and more worldwide.",
  },
  wise: {
    label: "Wise",
    icon: Globe,
    color: "#9FE870",
    description: "International bank transfers at real exchange rates.",
  },
  cash: {
    label: "Cash",
    icon: Banknote,
    color: "#22C55E",
    description: "Pay in person when service is completed.",
  },
};

export default async function SuperadminPaymentsPage() {
  const allMethodRows = await prisma.paymentMethod.findMany({
    select: { type: true, is_enabled: true },
  });

  const totalsMap: Record<string, { enabled: number; total: number }> = {};
  for (const m of allMethodRows) {
    if (!totalsMap[m.type]) totalsMap[m.type] = { enabled: 0, total: 0 };
    totalsMap[m.type].total += 1;
    if (m.is_enabled) totalsMap[m.type].enabled += 1;
  }

  const recentMethods = await prisma.paymentMethod.findMany({
    orderBy: { created_at: "desc" },
    take: 30,
    include: { business: { select: { name: true, slug: true } } },
  });
  const recent = serialize(recentMethods) as typeof recentMethods;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Payment Gateways</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Toggle payment types on or off platform-wide. Changes apply to all businesses instantly.
        </p>
      </div>

      {/* Gateway cards with platform toggles */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Object.entries(GATEWAY_META).map(([type, meta]) => {
          const Icon = meta.icon;
          const counts = totalsMap[type] ?? { enabled: 0, total: 0 };
          const isEnabled = counts.enabled > 0;

          return (
            <div
              key={type}
              className={`flex flex-col gap-4 rounded-2xl border bg-zinc-900 p-5 transition-colors ${
                isEnabled ? "border-zinc-700" : "border-zinc-800 opacity-60"
              }`}
            >
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${meta.color}20` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: isEnabled ? meta.color : "#71717a" }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">{meta.label}</p>
                    <p className="text-xs text-zinc-500">
                      {counts.enabled}/{counts.total} business{counts.total !== 1 ? "es" : ""} enabled
                    </p>
                  </div>
                </div>

                <PaymentTypeToggle type={type} isEnabled={isEnabled} />
              </div>

              <p className="text-xs leading-relaxed text-zinc-500">{meta.description}</p>

              <div className="flex items-center gap-1.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${isEnabled ? "bg-emerald-400" : "bg-zinc-600"}`}
                />
                <span className={`text-[10px] font-medium ${isEnabled ? "text-emerald-400" : "text-zinc-600"}`}>
                  {isEnabled ? "Active on platform" : "Disabled on platform"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recently configured */}
      <div>
        <h2 className="mb-4 text-base font-semibold text-zinc-100">Recently Configured</h2>
        {recent.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-12 text-center">
            <p className="text-sm text-zinc-500">
              No payment methods in the database yet — run the seed script.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-900">
            {recent.map((m) => {
              const meta = GATEWAY_META[m.type];
              const Icon = meta?.icon ?? CardIcon;
              return (
                <div key={m.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-lg"
                      style={{ backgroundColor: meta ? `${meta.color}20` : "#ffffff10" }}
                    >
                      <Icon
                        className="h-3.5 w-3.5"
                        style={{ color: meta?.color ?? "#71717a" }}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{m.label}</p>
                      <p className="text-xs text-zinc-500">
                        {m.business.name} · /{m.business.slug}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={m.is_enabled ? "success" : "outline"} className="text-xs">
                      {m.is_enabled ? "Enabled" : "Disabled"}
                    </Badge>
                    <PaymentMethodEditor
                      method={{
                        ...m,
                        details: (m.details ?? null) as Record<string, string> | null,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
