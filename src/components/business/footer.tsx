"use client";

import { motion } from "framer-motion";
import { Clock, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BusinessFooterProps {
  name: string;
  business_hours_start: string;
  business_hours_end: string;
}

function fmtTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

export function BusinessFooter({
  name,
  business_hours_start,
  business_hours_end,
}: BusinessFooterProps) {
  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <footer className="border-t border-zinc-800/60 bg-zinc-950">
      {/* CTA band */}
      <div className="relative overflow-hidden border-b border-zinc-800/60 px-6 py-20">
        {/* Glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-72 w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/6 blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative mx-auto flex max-w-2xl flex-col items-center gap-5 text-center"
        >
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-emerald-400">
            Ready to book?
          </span>
          <h2 className="text-3xl font-bold text-zinc-100 sm:text-4xl">
            Secure your appointment today
          </h2>
          <p className="max-w-md text-zinc-500">
            Join hundreds of happy clients. Book online in under 2 minutes — no phone calls needed.
          </p>
          <Button
            size="lg"
            onClick={() => scrollTo("services")}
            className="h-12 gap-2 bg-emerald-500 px-10 text-base font-semibold text-white shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 hover:shadow-emerald-400/25 transition-all duration-200"
          >
            <CalendarCheck className="h-5 w-5" />
            Book Appointment
          </Button>
        </motion.div>
      </div>

      {/* Footer bottom bar */}
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 sm:flex-row">
        <div className="flex flex-col gap-1 text-center sm:text-left">
          <p className="font-semibold text-zinc-300">{name}</p>
          <p className="flex items-center justify-center gap-1.5 text-xs text-zinc-600 sm:justify-start">
            <Clock className="h-3 w-3" />
            {fmtTime(business_hours_start)} – {fmtTime(business_hours_end)}
          </p>
        </div>
        <p className="text-xs text-zinc-700">
          Powered by <span className="text-zinc-500">BookEasy</span>
        </p>
      </div>
    </footer>
  );
}
