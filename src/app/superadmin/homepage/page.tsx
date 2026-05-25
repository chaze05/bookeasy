import { LayoutTemplate, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";
import { HomepageSectionManager, type SectionRow } from "./section-editor";

export const metadata = { title: "Homepage CMS — Superadmin" };

export default async function SuperadminHomepagePage() {
  const sections = await prisma.homepageConfig.findMany({
    orderBy: { order_index: "asc" },
  });

  const rows = serialize(sections) as unknown as SectionRow[];

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15">
            <LayoutTemplate className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Homepage CMS</h1>
            <p className="text-sm text-zinc-500">
              Edit, reorder, and toggle homepage sections — changes go live instantly.
            </p>
          </div>
        </div>

        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Preview homepage
        </a>
      </div>

      {/* Info strip */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3">
        <p className="text-xs text-zinc-500">
          <span className="font-medium text-zinc-300">How it works:</span>{" "}
          Toggle the eye icon to show/hide sections · Use arrows to reorder ·
          Click the edit icon to modify content as JSON · Saves go live within seconds.
          Run{" "}
          <code className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-300">migration_003.sql</code>{" "}
          in Supabase if you see no sections below.
        </p>
      </div>

      {/* Section list */}
      <HomepageSectionManager sections={rows} />

      {/* API reference */}
      <div className="rounded-xl border border-zinc-800 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-600">
          API endpoints
        </p>
        <div className="space-y-1.5 font-mono text-[11px] text-zinc-500">
          <div><span className="text-emerald-400">GET</span>    /api/homepage                            — public · active sections</div>
          <div><span className="text-emerald-400">GET</span>    /api/superadmin/homepage/section         — all sections (auth)</div>
          <div><span className="text-blue-400">POST</span>   /api/superadmin/homepage/section         — create section</div>
          <div><span className="text-amber-400">PATCH</span>  /api/superadmin/homepage/section/:id    — update content/order/status</div>
          <div><span className="text-red-400">DELETE</span> /api/superadmin/homepage/section/:id    — remove section</div>
        </div>
      </div>
    </div>
  );
}
