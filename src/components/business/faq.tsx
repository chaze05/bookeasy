"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "How do I book an appointment?",
    a: "Booking is simple — browse our services above, choose the one that's right for you, and click 'Book Now'. Select your preferred date and time, fill in your details, and you're confirmed. The whole process takes under 2 minutes.",
  },
  {
    q: "Can I cancel or reschedule my booking?",
    a: "Yes. We ask that you cancel or reschedule at least 24 hours before your appointment. Contact us directly and we'll take care of it. Late cancellations may be subject to our standard cancellation policy.",
  },
  {
    q: "How far in advance can I book?",
    a: "You can book up to 60 days in advance. We recommend booking early to secure your preferred time slot, especially on weekends and peak hours.",
  },
  {
    q: "Do I need to pay upfront when booking online?",
    a: "Payment is collected at the time of service. We accept cash, card, and major digital payment methods. No deposit is required for standard bookings.",
  },
  {
    q: "What if I'm running late to my appointment?",
    a: "We understand that things happen. Please contact us if you're running late — we'll do our best to accommodate you, though the session may need to be shortened to avoid affecting other clients.",
  },
  {
    q: "Do you offer packages or loyalty discounts?",
    a: "Yes! We offer multi-session packages and loyalty rewards for returning clients. Ask about our current offers when you visit or reach out through the booking notes field.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-zinc-800 last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left text-sm font-medium text-zinc-200 transition-colors hover:text-zinc-100"
      >
        {q}
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-zinc-600"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm leading-relaxed text-zinc-500">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FaqSection() {
  return (
    <section id="faq" className="bg-zinc-900/30 px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <span className="mb-3 inline-block rounded-full border border-zinc-700 bg-zinc-800 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-zinc-400">
            FAQ
          </span>
          <h2 className="mt-3 text-4xl font-bold text-zinc-100 sm:text-5xl">
            Common Questions
          </h2>
          <p className="mt-3 text-zinc-500">Everything you need to know before your visit.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="rounded-2xl border border-zinc-800 bg-zinc-900 px-6"
        >
          {faqs.map((faq, i) => (
            <FaqItem key={i} {...faq} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
