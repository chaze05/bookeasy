import Link from "next/link";
import { CalendarCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";
import { HomepageRenderer, type HomepageSection } from "@/components/homepage/HomepageRenderer";

// Cache for 5 minutes; admin server actions call revalidatePath("/") for instant updates
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
      {/* Navigation */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500">
              <CalendarCheck className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-zinc-100">BookEasy</span>
          </div>
          <nav className="hidden items-center gap-6 sm:flex">
            <Link href="#features" className="text-sm text-zinc-400 transition-colors hover:text-zinc-100">
              Features
            </Link>
            <Link href="#pricing" className="text-sm text-zinc-400 transition-colors hover:text-zinc-100">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild className="text-zinc-400 hover:text-zinc-100">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild className="bg-emerald-500 text-white hover:bg-emerald-400">
              <Link href="/register">
                Get started
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <HomepageRenderer sections={sections} />
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500">
              <CalendarCheck className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-xs font-semibold text-zinc-400">BookEasy</span>
          </div>
          <p className="text-xs text-zinc-600">
            © {new Date().getFullYear()} BookEasy. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
