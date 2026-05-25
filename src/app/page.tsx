import Link from "next/link";
import { CalendarCheck, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";
import { HomepageRenderer, type HomepageSection } from "@/components/homepage/HomepageRenderer";

export const revalidate = 300;

export default async function HomePage() {
  let sections: HomepageSection[] = [];
  try {
    const raw = await prisma.homepageConfig.findMany({
      where: { is_active: true },
      orderBy: { order_index: "asc" },
      select: { id: true, section_key: true, content: true, order_index: true },
    });
    sections = serialize(raw) as HomepageSection[];
  } catch {
    // DB unreachable — HomepageRenderer falls back to static defaults
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950">
      {/* ── Navigation ── */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">

          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/25 transition-shadow group-hover:shadow-emerald-500/40">
              <CalendarCheck className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-zinc-100">
              Book<span className="text-emerald-400">Easy</span>
            </span>
          </Link>

          {/* Nav links */}
          <nav className="hidden items-center gap-1 sm:flex">
            {[
              { label: "Features", href: "#features" },
              { label: "Pricing", href: "#pricing" },
              { label: "Demo", href: "/glow-beauty-studio" },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-100"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-100 sm:block"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="group inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 transition-all hover:-translate-y-px hover:bg-emerald-400 hover:shadow-emerald-400/30"
            >
              Get started
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1">
        <HomepageRenderer sections={sections} />
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start sm:justify-between">

            {/* Brand */}
            <div className="flex flex-col items-center gap-3 sm:items-start">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500">
                  <CalendarCheck className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-zinc-100">
                  Book<span className="text-emerald-400">Easy</span>
                </span>
              </Link>
              <p className="max-w-xs text-center text-xs leading-relaxed text-zinc-600 sm:text-left">
                The all-in-one booking platform for service businesses. Set up in minutes, loved by thousands.
              </p>
              <div className="flex items-center gap-3">
                {/* X (Twitter) */}
                <a
                  href="#"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 text-zinc-600 transition-colors hover:border-zinc-700 hover:text-zinc-400"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                {/* GitHub */}
                <a
                  href="#"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 text-zinc-600 transition-colors hover:border-zinc-700 hover:text-zinc-400"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Links */}
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              {[
                {
                  heading: "Product",
                  links: [
                    { label: "Features", href: "#features" },
                    { label: "Pricing", href: "#pricing" },
                    { label: "Demo", href: "/glow-beauty-studio" },
                    { label: "Changelog", href: "#" },
                  ],
                },
                {
                  heading: "Company",
                  links: [
                    { label: "About", href: "#" },
                    { label: "Blog", href: "#" },
                    { label: "Careers", href: "#" },
                    { label: "Contact", href: "#" },
                  ],
                },
                {
                  heading: "Legal",
                  links: [
                    { label: "Privacy", href: "#" },
                    { label: "Terms", href: "#" },
                    { label: "Security", href: "#" },
                  ],
                },
              ].map((col) => (
                <div key={col.heading}>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    {col.heading}
                  </p>
                  <ul className="space-y-2">
                    {col.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className="text-xs text-zinc-600 transition-colors hover:text-zinc-400"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-8 sm:flex-row">
            <p className="text-xs text-zinc-700">
              © {new Date().getFullYear()} BookEasy. All rights reserved.
            </p>
            <p className="text-xs text-zinc-700">
              Built for service businesses worldwide
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
