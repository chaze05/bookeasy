"use client";

import { useState } from "react";
import { Link2, Copy, Check, ExternalLink } from "lucide-react";

interface BookingUrlBannerProps {
  url: string;
  slug: string;
}

export function BookingUrlBanner({ url, slug }: BookingUrlBannerProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
        <Link2 className="h-4 w-4 text-emerald-400" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-zinc-500">Your public booking link</p>
        <p className="truncate text-sm font-medium text-zinc-200">
          /{slug}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          title="Open booking page"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <button
          onClick={handleCopy}
          className="flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy link
            </>
          )}
        </button>
      </div>
    </div>
  );
}
