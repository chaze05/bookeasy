"use client";

import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Copy, Check, Link2, Briefcase, ImageIcon } from "lucide-react";
import { toast } from "sonner";

import { updateBusiness, createBusiness } from "@/actions/business";
import { businessSchema, type BusinessInput } from "@/lib/validations";
import type { Business } from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Australia/Sydney",
];

interface BusinessFormProps {
  business: Business | null;
}

export function BusinessForm({ business }: BusinessFormProps) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<BusinessInput>({
    resolver: zodResolver(businessSchema) as any,
    defaultValues: {
      name: business?.name ?? "",
      slug: business?.slug ?? "",
      description: business?.description ?? "",
      timezone: business?.timezone ?? "UTC",
      logo_url: business?.logo_url ?? "",
    },
  });

  const slug = watch("slug");
  const bookingUrl = typeof window !== "undefined"
    ? `${window.location.origin}/${slug}`
    : `https://yourdomain.com/${slug}`;

  function copyLink() {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function submit(data: BusinessInput) {
    startTransition(async () => {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => fd.append(k, String(v ?? "")));
      try {
        if (business) {
          await updateBusiness(business.id, fd);
        } else {
          await createBusiness(fd);
        }
        toast.success(business ? "Business updated" : "Business created!");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  const inputClass =
    "border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20";

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-6">
      {/* Business profile */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-zinc-500" />
          <h2 className="text-sm font-semibold text-zinc-100">Business Profile</h2>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-zinc-300">Business name</Label>
            <Input
              placeholder="Acme Hair Studio"
              className={inputClass}
              {...register("name")}
            />
            {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-zinc-300">URL slug</Label>
            <div className="flex items-center gap-0">
              <span className="flex h-8 items-center rounded-l-lg border border-r-0 border-zinc-700 bg-zinc-800/50 px-2.5 text-xs text-zinc-500">
                yourdomain.com/
              </span>
              <Input
                placeholder="acme-hair"
                className="rounded-l-none border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
                {...register("slug")}
              />
            </div>
            {errors.slug && <p className="text-xs text-red-400">{errors.slug.message}</p>}
            <p className="text-xs text-zinc-600">
              Lowercase letters, numbers, and hyphens only.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-zinc-300">Description</Label>
            <Textarea
              placeholder="Tell clients what your business is about…"
              {...register("description")}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-zinc-300">Timezone</Label>
            <select
              {...register("timezone")}
              className="h-8 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz} className="bg-zinc-800">
                  {tz}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Homepage settings */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="mb-4 flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-zinc-500" />
          <h2 className="text-sm font-semibold text-zinc-100">Homepage Settings</h2>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-zinc-300">Logo URL</Label>
            <Input
              placeholder="https://example.com/logo.png"
              className={inputClass}
              {...register("logo_url")}
            />
            {errors.logo_url && (
              <p className="text-xs text-red-400">{errors.logo_url.message}</p>
            )}
            <p className="text-xs text-zinc-600">
              Paste a direct image URL. This appears on your public booking page.
            </p>
          </div>
          {business && (
            <a
              href={`/${business.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Preview your homepage →
            </a>
          )}
        </div>
      </div>

      {/* Public booking link */}
      {business && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Link2 className="h-4 w-4 text-zinc-500" />
            <h2 className="text-sm font-semibold text-zinc-100">Public Booking Link</h2>
          </div>
          <p className="mb-3 text-xs text-zinc-500">
            Share this link with your clients so they can book appointments 24/7.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-300 truncate">
              {bookingUrl}
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={copyLink}
              className="shrink-0 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isPending || (!isDirty && !!business)}
          className="bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : business ? (
            "Save changes"
          ) : (
            "Create business"
          )}
        </Button>
      </div>
    </form>
  );
}
