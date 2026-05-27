"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Edit3,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  deleteHomepageSection,
  moveSectionDown,
  moveSectionUp,
  toggleSectionActive,
  updateSectionContent,
} from "@/actions/homepage";

export interface SectionRow {
  id: string;
  section_key: string;
  content: Record<string, unknown>;
  is_active: boolean;
  order_index: number;
  updated_at: string;
}

type FieldValue = string | string[] | Record<string, string>[] | undefined;
type DraftContent = Record<string, FieldValue>;

const SECTION_LABELS: Record<string, string> = {
  header: "Header",
  hero: "Hero",
  social_proof: "Social Proof",
  features: "Features",
  cta: "Call to Action",
  footer: "Footer",
};

const SECTION_COLORS: Record<string, string> = {
  header: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  hero: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  social_proof: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  features: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  cta: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  footer: "bg-pink-500/15 text-pink-400 border-pink-500/30",
};

function asDraft(content: Record<string, unknown>): DraftContent {
  return { ...content } as DraftContent;
}

function textValue(value: FieldValue) {
  return typeof value === "string" ? value : "";
}

function stringArray(value: FieldValue) {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
    ? value
    : [];
}

function objectArray(value: FieldValue) {
  return Array.isArray(value) && value.every((item) => typeof item === "object")
    ? (value as Record<string, string>[])
    : [];
}

function Field({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-zinc-400">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="min-h-20 w-full resize-none rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors focus:border-violet-500"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none transition-colors focus:border-violet-500"
        />
      )}
    </label>
  );
}

function TextList({
  label,
  values,
  onChange,
  placeholder = "Item",
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-zinc-400">{label}</p>
        <button
          type="button"
          onClick={() => onChange([...values, ""])}
          className="inline-flex h-7 items-center gap-1 rounded-lg border border-zinc-700 px-2 text-xs text-zinc-300 hover:bg-zinc-800"
        >
          <Plus className="h-3 w-3" /> Add
        </button>
      </div>
      <div className="space-y-2">
        {values.map((value, index) => (
          <div key={index} className="flex gap-2">
            <input
              value={value}
              placeholder={placeholder}
              onChange={(e) => {
                const next = [...values];
                next[index] = e.target.value;
                onChange(next);
              }}
              className="h-9 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-violet-500"
            />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, i) => i !== index))}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ObjectList({
  label,
  values,
  fields,
  onChange,
}: {
  label: string;
  values: Record<string, string>[];
  fields: { key: string; label: string; multiline?: boolean }[];
  onChange: (values: Record<string, string>[]) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-zinc-400">{label}</p>
        <button
          type="button"
          onClick={() => onChange([...values, Object.fromEntries(fields.map((field) => [field.key, ""]))])}
          className="inline-flex h-7 items-center gap-1 rounded-lg border border-zinc-700 px-2 text-xs text-zinc-300 hover:bg-zinc-800"
        >
          <Plus className="h-3 w-3" /> Add
        </button>
      </div>
      {values.map((row, index) => (
        <div key={index} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs text-zinc-500">Item {index + 1}</span>
            <button
              type="button"
              onClick={() => onChange(values.filter((_, i) => i !== index))}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((field) => (
              <Field
                key={field.key}
                label={field.label}
                value={row[field.key] ?? ""}
                multiline={field.multiline}
                onChange={(value) => {
                  const next = [...values];
                  next[index] = { ...next[index], [field.key]: value };
                  onChange(next);
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ContentEditor({
  sectionKey,
  draft,
  setDraft,
}: {
  sectionKey: string;
  draft: DraftContent;
  setDraft: (draft: DraftContent) => void;
}) {
  const set = (key: string, value: FieldValue) => setDraft({ ...draft, [key]: value });

  if (sectionKey === "header") {
    return (
      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Brand text" value={textValue(draft.brand_text)} onChange={(v) => set("brand_text", v)} />
          <Field label="Brand highlight" value={textValue(draft.brand_highlight)} onChange={(v) => set("brand_highlight", v)} />
          <Field label="Sign in text" value={textValue(draft.sign_in_text)} onChange={(v) => set("sign_in_text", v)} />
          <Field label="Sign in link" value={textValue(draft.sign_in_href)} onChange={(v) => set("sign_in_href", v)} />
          <Field label="Primary button text" value={textValue(draft.primary_cta_text)} onChange={(v) => set("primary_cta_text", v)} />
          <Field label="Primary button link" value={textValue(draft.primary_cta_href)} onChange={(v) => set("primary_cta_href", v)} />
        </div>
        <ObjectList
          label="Navigation links"
          values={objectArray(draft.nav_links)}
          fields={[
            { key: "label", label: "Label" },
            { key: "href", label: "Link" },
          ]}
          onChange={(v) => set("nav_links", v)}
        />
      </div>
    );
  }

  if (sectionKey === "hero") {
    return (
      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Badge" value={textValue(draft.badge)} onChange={(v) => set("badge", v)} />
          <Field label="Title" value={textValue(draft.title)} onChange={(v) => set("title", v)} />
          <Field label="Highlighted title" value={textValue(draft.title_highlight)} onChange={(v) => set("title_highlight", v)} />
          <Field label="Primary button text" value={textValue(draft.primary_cta_text)} onChange={(v) => set("primary_cta_text", v)} />
          <Field label="Primary button link" value={textValue(draft.primary_cta_href)} onChange={(v) => set("primary_cta_href", v)} />
          <Field label="Secondary button text" value={textValue(draft.secondary_cta_text)} onChange={(v) => set("secondary_cta_text", v)} />
          <Field label="Secondary button link" value={textValue(draft.secondary_cta_href)} onChange={(v) => set("secondary_cta_href", v)} />
          <Field label="Trust line" value={textValue(draft.trust_line)} onChange={(v) => set("trust_line", v)} />
          <Field label="Trust note" value={textValue(draft.trust_note)} onChange={(v) => set("trust_note", v)} />
          <Field label="Mockup URL" value={textValue(draft.mockup_url)} onChange={(v) => set("mockup_url", v)} />
          <Field label="Notification title" value={textValue(draft.mockup_notification_title)} onChange={(v) => set("mockup_notification_title", v)} />
          <Field label="Notification subtitle" value={textValue(draft.mockup_notification_subtitle)} onChange={(v) => set("mockup_notification_subtitle", v)} />
          <Field label="Revenue title" value={textValue(draft.mockup_revenue_title)} onChange={(v) => set("mockup_revenue_title", v)} />
          <Field label="Revenue subtitle" value={textValue(draft.mockup_revenue_subtitle)} onChange={(v) => set("mockup_revenue_subtitle", v)} />
        </div>
        <Field label="Subtitle" value={textValue(draft.subtitle)} multiline onChange={(v) => set("subtitle", v)} />
        <TextList label="Avatar initials" values={stringArray(draft.avatar_initials)} onChange={(v) => set("avatar_initials", v)} />
        <TextList label="Mockup sidebar primary" values={stringArray(draft.mockup_sidebar_primary)} onChange={(v) => set("mockup_sidebar_primary", v)} />
        <TextList label="Mockup sidebar secondary" values={stringArray(draft.mockup_sidebar_secondary)} onChange={(v) => set("mockup_sidebar_secondary", v)} />
        <ObjectList
          label="Mockup stats"
          values={objectArray(draft.mockup_stats)}
          fields={[
            { key: "label", label: "Label" },
            { key: "value", label: "Value" },
            { key: "sub", label: "Sub label" },
          ]}
          onChange={(v) => set("mockup_stats", v)}
        />
        <TextList label="Mockup booking statuses" values={stringArray(draft.mockup_statuses)} onChange={(v) => set("mockup_statuses", v)} />
      </div>
    );
  }

  if (sectionKey === "features") {
    return (
      <div className="grid gap-4">
        <Field label="Heading" value={textValue(draft.heading)} onChange={(v) => set("heading", v)} />
        <Field label="Subheading" value={textValue(draft.subheading)} multiline onChange={(v) => set("subheading", v)} />
        <ObjectList
          label="Features"
          values={objectArray(draft.features)}
          fields={[
            { key: "icon", label: "Lucide icon" },
            { key: "title", label: "Title" },
            { key: "description", label: "Description", multiline: true },
          ]}
          onChange={(v) => set("features", v)}
        />
      </div>
    );
  }

  if (sectionKey === "social_proof") {
    return (
      <div className="grid gap-4">
        <Field label="Heading" value={textValue(draft.heading)} onChange={(v) => set("heading", v)} />
        <ObjectList
          label="Stats"
          values={objectArray(draft.stats)}
          fields={[
            { key: "value", label: "Value" },
            { key: "label", label: "Label" },
          ]}
          onChange={(v) => set("stats", v)}
        />
        <ObjectList
          label="Testimonials"
          values={objectArray(draft.testimonials)}
          fields={[
            { key: "quote", label: "Quote", multiline: true },
            { key: "author", label: "Author" },
            { key: "role", label: "Role" },
            { key: "initials", label: "Initials" },
          ]}
          onChange={(v) => set("testimonials", v)}
        />
      </div>
    );
  }

  if (sectionKey === "cta") {
    return (
      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Heading" value={textValue(draft.heading)} onChange={(v) => set("heading", v)} />
          <Field label="Primary button text" value={textValue(draft.primary_cta_text)} onChange={(v) => set("primary_cta_text", v)} />
          <Field label="Primary button link" value={textValue(draft.primary_cta_href)} onChange={(v) => set("primary_cta_href", v)} />
          <Field label="Secondary button text" value={textValue(draft.secondary_cta_text)} onChange={(v) => set("secondary_cta_text", v)} />
          <Field label="Secondary button link" value={textValue(draft.secondary_cta_href)} onChange={(v) => set("secondary_cta_href", v)} />
        </div>
        <Field label="Subheading" value={textValue(draft.subheading)} multiline onChange={(v) => set("subheading", v)} />
        <TextList label="Trust items" values={stringArray(draft.trust_items)} onChange={(v) => set("trust_items", v)} />
      </div>
    );
  }

  if (sectionKey === "footer") {
    return (
      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Brand text" value={textValue(draft.brand_text)} onChange={(v) => set("brand_text", v)} />
          <Field label="Brand highlight" value={textValue(draft.brand_highlight)} onChange={(v) => set("brand_highlight", v)} />
          <Field label="Copyright text" value={textValue(draft.copyright_text)} onChange={(v) => set("copyright_text", v)} />
          <Field label="Bottom note" value={textValue(draft.bottom_note)} onChange={(v) => set("bottom_note", v)} />
        </div>
        <Field label="Description" value={textValue(draft.description)} multiline onChange={(v) => set("description", v)} />
        <ObjectList
          label="Social links"
          values={objectArray(draft.social_links)}
          fields={[
            { key: "label", label: "Label" },
            { key: "href", label: "Link" },
          ]}
          onChange={(v) => set("social_links", v)}
        />
        <ObjectList
          label="Footer columns"
          values={objectArray(draft.columns).map((column) => ({
            ...column,
            links: Array.isArray(column.links)
              ? (column.links as Record<string, string>[])
                  .map((link) => `${link.label ?? ""}|${link.href ?? ""}`)
                  .join("\n")
              : String(column.links ?? ""),
          }))}
          fields={[
            { key: "heading", label: "Heading" },
            { key: "links", label: "Links, one per line as Label|URL", multiline: true },
          ]}
          onChange={(columns) =>
            set(
              "columns",
              columns.map((column) => ({
                heading: column.heading ?? "",
                links: (column.links ?? "")
                  .split("\n")
                  .map((line) => {
                    const [label = "", href = ""] = line.split("|");
                    return { label: label.trim(), href: href.trim() };
                  })
                  .filter((link) => link.label || link.href),
              })) as unknown as Record<string, string>[]
            )
          }
        />
      </div>
    );
  }

  return <p className="text-sm text-zinc-500">This section type does not have an editor yet.</p>;
}

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
  const [draft, setDraft] = useState<DraftContent>(asDraft(section.content));
  const [error, setError] = useState("");

  const run = (fn: () => Promise<void>) =>
    start(async () => {
      await fn();
      router.refresh();
    });

  async function handleSave() {
    setError("");
    try {
      await updateSectionContent(section.id, draft as object);
      setEditing(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
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
      <div className="flex items-center gap-3 p-4">
        <span
          className={`inline-flex shrink-0 items-center rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${badgeClass}`}
        >
          {SECTION_LABELS[section.section_key] ?? section.section_key}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-zinc-500">
            order: {section.order_index} / updated {new Date(section.updated_at).toLocaleDateString()}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => run(() => toggleSectionActive(section.id, !section.is_active))}
            disabled={pending}
            title={section.is_active ? "Hide section" : "Show section"}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-40"
          >
            {section.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => run(() => moveSectionUp(section.id))}
            disabled={pending || isFirst}
            title="Move up"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-30"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => run(() => moveSectionDown(section.id))}
            disabled={pending || isLast}
            title="Move down"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-30"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              setEditing(!editing);
              setError("");
              setDraft(asDraft(section.content));
            }}
            title="Edit content"
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
              editing
                ? "bg-violet-500/20 text-violet-400"
                : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
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

      {editing && (
        <div className="border-t border-zinc-800 p-4">
          <ContentEditor sectionKey={section.section_key} draft={draft} setDraft={setDraft} />
          {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => {
                setEditing(false);
                setDraft(asDraft(section.content));
                setError("");
              }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            >
              <X className="h-3 w-3" /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={pending}
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
            No sections yet. Run the homepage CMS migration in Supabase to seed the defaults.
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
