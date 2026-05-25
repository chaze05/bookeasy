"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingWidget, type BookingService, type PaymentMethodData } from "./booking-widget";

interface ServicesSectionProps {
  business: { id: string; name: string };
  services: BookingService[];
  paymentMethods?: PaymentMethodData[];
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 28 },
  },
};

function fmtPrice(price: number) {
  return price % 1 === 0 ? price.toFixed(0) : price.toFixed(2);
}

export function ServicesSection({ business, services, paymentMethods = [] }: ServicesSectionProps) {
  const [selected, setSelected] = useState<BookingService | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  function book(svc: BookingService) {
    setSelected(svc);
    setDialogOpen(true);
  }

  if (services.length === 0) return null;

  return (
    <section id="services" className="bg-zinc-950 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-14 text-center"
        >
          <span className="mb-3 inline-block rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-emerald-400">
            What We Offer
          </span>
          <h2 className="mt-3 text-4xl font-bold text-zinc-100 sm:text-5xl">Our Services</h2>
          <p className="mt-3 text-zinc-500">
            Choose a service and book your appointment in seconds.
          </p>
        </motion.div>

        {/* Cards */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {services.map((svc, idx) => (
            <motion.div
              key={svc.id}
              variants={item}
              whileHover={{ y: -5, transition: { duration: 0.18 } }}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 transition-shadow hover:border-zinc-700 hover:shadow-2xl hover:shadow-black/40"
            >
              {/* Top color accent */}
              <div className="h-1 w-full" style={{ backgroundColor: svc.color }} />

              {/* Popular badge on first service */}
              {idx === 0 && (
                <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400">
                  <Sparkles className="h-3 w-3" />
                  Popular
                </div>
              )}

              <div className="flex flex-1 flex-col p-6">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-zinc-100 pr-16">{svc.name}</h3>
                  {svc.description && (
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-500">
                      {svc.description}
                    </p>
                  )}
                </div>

                {/* Price + duration */}
                <div className="mt-6 flex items-end justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-3xl font-bold text-zinc-100">
                      ${fmtPrice(svc.price)}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-zinc-600">
                      <Clock className="h-3.5 w-3.5" />
                      {svc.duration} min session
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => book(svc)}
                  className="mt-5 w-full border border-zinc-700 bg-zinc-800 text-zinc-100 transition-colors duration-200 hover:border-emerald-500 hover:bg-emerald-500 hover:text-white"
                >
                  Book Now
                </Button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Booking dialog */}
      {selected && (
        <BookingWidget
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          business={business}
          service={selected}
          paymentMethods={paymentMethods}
        />
      )}
    </section>
  );
}
