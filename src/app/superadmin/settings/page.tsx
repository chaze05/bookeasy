import { Settings, ShieldCheck, Globe, Bell, Database } from "lucide-react";

export const metadata = { title: "Settings — Superadmin" };

const sections = [
  {
    icon: Globe,
    title: "Platform Identity",
    description: "Brand name, logo, and public-facing details.",
    fields: [
      { label: "Platform Name", value: "BookEasy", type: "text" },
      { label: "Support Email", value: "support@bookeasy.app", type: "email" },
      { label: "Platform URL", value: "https://bookeasy.app", type: "url" },
    ],
  },
  {
    icon: ShieldCheck,
    title: "Security & Access",
    description: "Session policy, allowed domains, and access controls.",
    fields: [
      { label: "Session Timeout (minutes)", value: "60", type: "number" },
      { label: "Allowed Email Domains", value: "", type: "text", placeholder: "Leave blank to allow all" },
      { label: "Max Login Attempts", value: "5", type: "number" },
    ],
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "Platform-level email and webhook configuration.",
    fields: [
      { label: "SMTP Host", value: "", type: "text", placeholder: "smtp.mailgun.org" },
      { label: "SMTP Port", value: "587", type: "number" },
      { label: "From Email", value: "", type: "email", placeholder: "no-reply@bookeasy.app" },
      { label: "Webhook URL (global)", value: "", type: "url", placeholder: "https://hooks.example.com/..." },
    ],
  },
  {
    icon: Database,
    title: "Data & Retention",
    description: "Booking data retention and export policies.",
    fields: [
      { label: "Booking Retention (days)", value: "365", type: "number" },
      { label: "Audit Log Retention (days)", value: "90", type: "number" },
    ],
  },
];

export default function SuperadminSettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15">
          <Settings className="h-5 w-5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Platform Settings</h1>
          <p className="text-sm text-zinc-500">Global configuration for the BookEasy platform.</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.title}
              className="rounded-2xl border border-zinc-800 bg-zinc-900"
            >
              {/* Section header */}
              <div className="flex items-center gap-3 border-b border-zinc-800 px-6 py-4">
                <Icon className="h-4 w-4 text-violet-400" />
                <div>
                  <p className="text-sm font-semibold text-zinc-100">{section.title}</p>
                  <p className="text-xs text-zinc-500">{section.description}</p>
                </div>
              </div>

              {/* Fields */}
              <div className="grid gap-4 p-6 sm:grid-cols-2">
                {section.fields.map((field) => (
                  <div key={field.label} className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-zinc-400">{field.label}</label>
                    <input
                      type={field.type}
                      defaultValue={field.value}
                      placeholder={"placeholder" in field ? field.placeholder : undefined}
                      className="h-9 rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                    />
                  </div>
                ))}
              </div>

              {/* Save button */}
              <div className="border-t border-zinc-800 px-6 py-4">
                <button className="rounded-lg bg-violet-500 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-violet-400">
                  Save {section.title}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
