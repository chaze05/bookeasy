"use client";

import { motion } from "framer-motion";
import { Building2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type RecentBusiness = {
  id: string;
  name: string;
  status: string;
  created_at: Date;
  owner: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

export function RecentBusinessesWidget({ businesses }: { businesses: RecentBusiness[] }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'suspended': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
    }
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900/50 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium text-zinc-100 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-emerald-500" /> Recent Businesses
        </h3>
      </div>
      
      <div className="space-y-4">
        {businesses.map((business, i) => (
          <motion.div 
            key={business.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 border border-zinc-800">
                <AvatarImage src={business.owner?.avatar_url || ''} />
                <AvatarFallback className="bg-zinc-800 text-zinc-400 text-xs">
                  {business.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-zinc-200 line-clamp-1">{business.name}</p>
                <p className="text-xs text-zinc-500">{business.owner?.full_name || 'No Owner'}</p>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-1">
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border uppercase tracking-wider ${getStatusColor(business.status)}`}>
                {business.status}
              </span>
              <span className="text-[10px] text-zinc-600">
                {new Date(business.created_at).toLocaleDateString()}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
