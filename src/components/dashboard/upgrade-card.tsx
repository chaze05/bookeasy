import Link from "next/link";
import { Lock } from "lucide-react";

export function UpgradeCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15">
        <Lock className="h-6 w-6 text-amber-400" />
      </span>
      <div>
        <p className="text-base font-semibold text-zinc-100">{title}</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-zinc-400">{description}</p>
      </div>
      <Link
        href="/dashboard/settings"
        className="mt-2 inline-flex h-9 items-center rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-400"
      >
        Upgrade plan
      </Link>
      <p className="text-xs text-zinc-600">Settings → Subscription tab</p>
    </div>
  );
}
