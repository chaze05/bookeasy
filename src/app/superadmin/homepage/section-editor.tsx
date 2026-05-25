"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, ChevronDown, Trash2, Edit3, Check, X, Eye, EyeOff } from "lucide-react";
import {
  updateSectionContent,
  toggleSectionActive,
  moveSectionUp,
  moveSectionDown,
  deleteHomepageSection,
} from "@/actions/homepage";

export interface SectionRow {
  id: string;
  section_key: string;
  content: unknown;
  is_active: boolean;
  order_index: number;
  updated_at: string;
}

const SECTION_LABELS: Record<string, string> = {
  hero:         "Hero",
  social_proof: "Social Proof",
  features:     "Features",
  cta:          "Call to Action",
};

const SECTION_COLORS: Record<string, string> = {
  hero:         "bg-violet-500/15 text-violet-400 border-violet-500/30",
  social_proof: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  features:     "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  cta:          "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

function SectionCard({
  section,
  isFirst,
  isLast,
}: {
  section: SectionRow;
  isFirst: boolean;
  isLast: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const [jsonValue, setJsonValue] = useState(
    JSON.stringify(section.content, null, 2)
  );
  const [jsonError, setJsonError] = useState("");

  const run = (fn: () => Promise<void>) =>
    start(async () => {
      await fn();
      router.refresh();
    });

  function handleJsonChange(v: string) {
    setJsonValue(v);
    try {
      JSON.parse(v);
      setJsonError("");
    } catch {
      setJsonError("Invalid JSON");
    }
  }

  async function handleSave() {
    if (jsonError) return;
    try {
      await updateSectionContent(section.id, jsonValue);
      setEditing(false);
      router.refresh();
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "Save failed");
    }
  }

  const badgeClass =
    SECTION_COLORS[section.section_key] ?? "bg-zinc-800 text-zinc-400 border-zinc-700";

  return (
    <div
      className={`rounded-2xl border bg-zinc-900 transition-all ${
        section.is_active ? "border-zinc-800" : "border-zinc-800/50 opacity-60"
      }`}
    >
      {/* Header row */}
      <div className="flex items-center gap-3 p-4">
        {/* Section badge */}
        <span
          className={`inline-flex shrink-0 items-center rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${badgeClass}`}
        >
          {SECTION_LABELS[section.section_key] ?? section.section_key}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-zinc-500">
            order: {section.order_index} · updated {new Date(section.updated_at).toLocaleDateString()}
          </p>
        </div>

        {/* Controls */}
        <div className="flex shrink-0 items-center gap-1">
          {/* Toggle active */}
          <button
            onClick={() => run(() => toggleSectionActive(section.id, !section.is_active))}
            disabled={pending}
            title={section.is_active ? "Hide section" : "Show section"}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-40"
          >
            {section.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </button>

          {/* Move up */}
          <button
            onClick={() => run(() => moveSectionUp(section.id))}
            disabled={pending || isFirst}
            title="Move up"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-30"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>

          {/* Move down */}
          <button
            onClick={() => run(() => moveSectionDown(section.id))}
            disabled={pending || isLast}
            title="Move down"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-30"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>

          {/* Edit */}
          <button
            onClick={() => { setEditing(!editing); setJsonError(""); }}
            title="Edit content"
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
              editing
                ? "bg-violet-500/20 text-violet-400"
                : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>

          {/* Delete */}
          <button
            onClick={() => {
              if (confirm(`Delete the "${SECTION_LABELS[section.section_key] ?? section.section_key}" section?`)) {
                run(() => deleteHomepageSection(section.id));
              }
            }}
            disabled={pending}
            title="Delete section"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* JSON editor */}
      {editing && (
        <div className="border-t border-zinc-800 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-400">Section content (JSON)</p>
            {jsonError && (
              <p className="text-xs text-red-400">{jsonError}</p>
            )}
          </div>
          <textarea
            value={jsonValue}
            onChange={(e) => handleJsonChange(e.target.value)}
            rows={14}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 font-mono text-xs text-zinc-200 placeholder-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
            spellCheck={false}
          />
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => { setEditing(false); setJsonValue(JSON.stringify(section.content, null, 2)); setJsonError(""); }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            >
              <X className="h-3 w-3" /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!!jsonError}
              className="flex items-center gap-1.5 rounded-lg bg-violet-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-violet-400 disabled:opacity-40"
            >
              <Check className="h-3 w-3" /> Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function HomepageSectionManager({ sections }: { sections: SectionRow[] }) {
  return (
    <div className="flex flex-col gap-3">
      {sections.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 py-12 text-center">
          <p className="text-sm text-zinc-500">
            No sections yet. Run{" "}
            <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-300">
              migration_003.sql
            </code>{" "}
            in Supabase to seed the defaults.
          </p>
        </div>
      ) : (
        sections.map((section, i) => (
          <SectionCard
            key={section.id}
            section={section}
            isFirst={i === 0}
            isLast={i === sections.length - 1}
          />
        ))
      )}
    </div>
  );
}
