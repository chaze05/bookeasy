"use client";

import { motion } from "framer-motion";
import { CalendarCheck } from "lucide-react";
import { Card } from "@/components/ui/card";

type RecentBooking = {
  id: string;
  status: string;
  created_at: Date;
  business: {
    name: string;
  };
  service: {
    name: string;
    price: number | any;
  };
};

export function RecentBookingsWidget({ bookings }: { bookings: RecentBooking[] }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-emerald-500';
      case 'confirmed': return 'text-blue-500';
      case 'cancelled': return 'text-red-500';
      case 'no_show': return 'text-amber-500';
      default: return 'text-zinc-400';
    }
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900/50 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium text-zinc-100 flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-blue-500" /> Platform Bookings
        </h3>
      </div>
      
      <div className="space-y-4">
        {bookings.map((booking, i) => (
          <motion.div 
            key={booking.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-medium text-zinc-200 line-clamp-1">{booking.service.name}</p>
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-0.5">
                <span className="truncate max-w-[120px]">{booking.business.name}</span>
                <span>•</span>
                <span className={`capitalize font-medium ${getStatusColor(booking.status)}`}>{booking.status.replace('_', ' ')}</span>
              </div>
            </div>
            
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold text-zinc-300">
                ${Number(booking.service.price).toFixed(2)}
              </span>
              <span className="text-[10px] text-zinc-600 mt-0.5">
                {new Date(booking.created_at).toLocaleDateString()}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
