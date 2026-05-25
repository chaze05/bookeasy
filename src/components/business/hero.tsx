"use client";

import { motion } from "framer-motion";
import { Star, Clock, ChevronDown, Zap, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BusinessHeroProps {
  name: string;
  description: string | null;
  logo_url: string | null;
  business_hours_start: string;
  business_hours_end: string;
}

function fmtTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

function isOpen(start: string, end: string) {
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return cur >= sh * 60 + sm && cur < eh * 60 + em;
}

export function BusinessHero({
  name,
  description,
  logo_url,
  business_hours_start,
  business_hours_end,
}: BusinessHeroProps) {
  const open = isOpen(business_hours_start, business_hours_end);
  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-zinc-950 px-6 py-24">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/6 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-emerald-600/4 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-64 w-64 rounded-full bg-emerald-400/3 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative z-10 flex max-w-3xl flex-col items-center gap-6 text-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
        >
          {logo_url ? (
            <img
              src={logo_url}
              alt={name}
              className="h-24 w-24 rounded-3xl object-cover shadow-2xl ring-2 ring-white/8"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 shadow-2xl ring-1 ring-emerald-500/25">
              <span className="text-4xl font-bold text-emerald-400">{name[0]}</span>
            </div>
          )}
        </motion.div>

        {/* Status badge */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium ring-1 ${
            open
              ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
              : "bg-zinc-800/80 text-zinc-500 ring-zinc-700/50"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              open ? "animate-pulse bg-emerald-400" : "bg-zinc-600"
            }`}
          />
          {open ? "Open Now" : "Currently Closed"}
          <span className="text-zinc-700">·</span>
          {fmtTime(business_hours_start)} – {fmtTime(business_hours_end)}
        </motion.div>

        {/* Business name + description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center gap-4"
        >
          <h1 className="bg-gradient-to-b from-zinc-100 to-zinc-400 bg-clip-text text-6xl font-extrabold tracking-tight text-transparent sm:text-7xl lg:text-8xl">
            {name}
          </h1>
          {description && (
            <p className="max-w-xl text-lg leading-relaxed text-zinc-400">{description}</p>
          )}
        </motion.div>

        {/* Stars */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-2"
        >
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <span className="text-sm text-zinc-500">4.9 · 200+ happy clients</span>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
          className="flex flex-wrap justify-center gap-3"
        >
          <Button
            size="lg"
            onClick={() => scrollTo("services")}
            className="h-12 gap-2 bg-emerald-500 px-8 text-base font-semibold text-white shadow-xl shadow-emerald-500/25 hover:bg-emerald-400 hover:shadow-emerald-400/30 transition-all duration-200"
          >
            <CalendarCheck className="h-5 w-5" />
            Book Appointment
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => scrollTo("about")}
            className="h-12 border-zinc-700 bg-zinc-900/50 px-8 text-base text-zinc-300 backdrop-blur-sm hover:bg-zinc-800 hover:text-zinc-100 hover:border-zinc-600"
          >
            Learn More
          </Button>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.52 }}
          className="flex flex-wrap justify-center gap-2 pt-2"
        >
          {[
            { icon: <Zap className="h-3.5 w-3.5" />, text: "Instant confirmation" },
            { icon: <Clock className="h-3.5 w-3.5" />, text: "Same-day available" },
            { icon: <Star className="h-3.5 w-3.5" />, text: "5-star rated" },
          ].map((b, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-xs text-zinc-500 backdrop-blur-sm"
            >
              <span className="text-emerald-500">{b.icon}</span>
              {b.text}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        onClick={() => scrollTo("services")}
        className="absolute bottom-8 flex flex-col items-center gap-1.5 text-xs text-zinc-700 hover:text-zinc-500 transition-colors"
      >
        <span className="uppercase tracking-widest">Scroll</span>
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </motion.button>
    </section>
  );
}
