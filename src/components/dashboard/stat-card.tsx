"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  accent?: "emerald" | "blue" | "violet" | "amber";
  delay?: number;
}

const accentMap = {
  emerald: {
    icon: "bg-emerald-500/15 text-emerald-400",
    glow: "group-hover:shadow-emerald-500/10",
  },
  blue: {
    icon: "bg-blue-500/15 text-blue-400",
    glow: "group-hover:shadow-blue-500/10",
  },
  violet: {
    icon: "bg-violet-500/15 text-violet-400",
    glow: "group-hover:shadow-violet-500/10",
  },
  amber: {
    icon: "bg-amber-500/15 text-amber-400",
    glow: "group-hover:shadow-amber-500/10",
  },
};

export function StatCard({
  title,
  value,
  icon,
  trend,
  trendLabel,
  accent = "emerald",
  delay = 0,
}: StatCardProps) {
  const colors = accentMap[accent];

  const isPositive = trend !== undefined && trend > 0;
  const isNegative = trend !== undefined && trend < 0;

  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay }}
      whileHover={{ y: -2 }}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-5",
        "transition-shadow duration-300 hover:shadow-xl",
        colors.glow
      )}
    >
      {/* Subtle top-edge gradient on hover */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
            {title}
          </p>
          <p className="text-3xl font-bold text-zinc-100">{value}</p>
          {trend !== undefined && trendLabel && (
            <div
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                isPositive && "text-emerald-400",
                isNegative && "text-red-400",
                !isPositive && !isNegative && "text-zinc-500"
              )}
            >
              <TrendIcon className="h-3.5 w-3.5" />
              <span>
                {isPositive ? "+" : ""}
                {trend}% {trendLabel}
              </span>
            </div>
          )}
        </div>

        <div className={cn("rounded-xl p-2.5", colors.icon)}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
