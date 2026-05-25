"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const reviews = [
  {
    name: "Sarah M.",
    text: "Absolutely incredible experience from start to finish. Booked online in under a minute and the service exceeded every expectation. Will 100% be back.",
    rating: 5,
    label: "Premium Service",
    gradient: "from-violet-500/10",
  },
  {
    name: "James R.",
    text: "Best in the area by far. The team is professional, the atmosphere is welcoming, and the results speak for themselves. Highly recommend.",
    rating: 5,
    label: "Monthly Package",
    gradient: "from-blue-500/10",
  },
  {
    name: "Priya K.",
    text: "I've been a loyal client for over a year. Consistent quality every single time. The online booking makes it so easy to schedule around my busy calendar.",
    rating: 5,
    label: "Consultation",
    gradient: "from-emerald-500/10",
  },
  {
    name: "Daniel T.",
    text: "The real-time booking is a game changer. I can see exactly what's available and lock it in instantly. Five stars without hesitation.",
    rating: 5,
    label: "Express Session",
    gradient: "from-amber-500/10",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 280, damping: 28 },
  },
};

export function TestimonialsSection() {
  return (
    <section id="reviews" className="bg-zinc-950 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-14 text-center"
        >
          <span className="mb-3 inline-block rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-amber-400">
            Testimonials
          </span>
          <h2 className="mt-3 text-4xl font-bold text-zinc-100 sm:text-5xl">What Clients Say</h2>
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-sm text-zinc-500">4.9 average · 200+ reviews</span>
          </div>
        </motion.div>

        {/* Review grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid gap-5 sm:grid-cols-2"
        >
          {reviews.map((review, i) => (
            <motion.div
              key={i}
              variants={item}
              className={`relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br ${review.gradient} to-transparent p-6`}
            >
              <Quote className="absolute right-5 top-5 h-8 w-8 text-zinc-800/60" />

              {/* Stars */}
              <div className="mb-4 flex gap-0.5">
                {Array.from({ length: review.rating }).map((_, j) => (
                  <Star key={j} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <p className="leading-relaxed text-zinc-300">&ldquo;{review.text}&rdquo;</p>

              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold text-zinc-300">
                  {review.name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-200">{review.name}</p>
                  <p className="text-xs text-zinc-600">{review.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
