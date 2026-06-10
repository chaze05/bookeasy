"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X, FileImage, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { adminApproveSubscriptionPayment, adminRejectSubscriptionPayment } from "@/actions/superadmin";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type PendingPayment = {
  id: string;
  payment_method_type: string;
  payment_proof_url: string;
  created_at: Date;
  business: {
    id: string;
    name: string;
    status: string;
  };
};

export function PendingPaymentsPanel({ payments }: { payments: PendingPayment[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (payments.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center border-zinc-800 bg-zinc-900/50 p-8 text-center backdrop-blur-sm min-h-[300px] h-full">
        <div className="rounded-full bg-emerald-500/10 p-4 mb-4">
          <Check className="h-8 w-8 text-emerald-500/50" />
        </div>
        <h3 className="text-lg font-medium text-zinc-300">All Caught Up!</h3>
        <p className="mt-1 text-sm text-zinc-500">No pending subscription payments to review.</p>
      </Card>
    );
  }

  const handleApprove = (id: string) => {
    startTransition(async () => {
      try {
        await adminApproveSubscriptionPayment(id);
        toast.success("Payment approved and business activated.");
        router.refresh();
      } catch (error: any) {
        toast.error(error.message || "Failed to approve payment.");
      }
    });
  };

  const handleReject = (id: string) => {
    startTransition(async () => {
      try {
        await adminRejectSubscriptionPayment(id, "Rejected by superadmin");
        toast.success("Payment rejected.");
        router.refresh();
      } catch (error: any) {
        toast.error(error.message || "Failed to reject payment.");
      }
    });
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm h-full flex flex-col min-h-[400px]">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-zinc-100">Pending Reviews</h2>
        <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-amber-500">
          {payments.length} Pending
        </Badge>
      </div>
      
      <div className="flex-1 space-y-4 overflow-y-auto pr-2">
        {payments.map((payment, i) => (
          <motion.div 
            key={payment.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4 transition-colors hover:border-zinc-700"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <h4 className="font-medium text-zinc-200">{payment.business.name}</h4>
                <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                  <span className="capitalize px-1.5 py-0.5 rounded bg-zinc-800/50">{payment.payment_method_type.replace(/_/g, ' ')}</span>
                  <span>•</span>
                  <span>{new Date(payment.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <a 
                href={payment.payment_proof_url} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-md bg-zinc-800/50 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-zinc-800 transition-colors w-full sm:w-auto"
              >
                <FileImage className="h-3.5 w-3.5" /> View Proof
              </a>
            </div>
            
            <div className="flex gap-2 pt-2 border-t border-zinc-800/50">
              <Button 
                onClick={() => handleApprove(payment.id)}
                disabled={isPending}
                size="sm"
                className="flex-1 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 h-9"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="mr-2 h-4 w-4" /> Approve</>}
              </Button>
              <Button 
                onClick={() => handleReject(payment.id)}
                disabled={isPending}
                size="sm"
                variant="outline"
                className="flex-1 border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10 hover:text-red-400 h-9"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><X className="mr-2 h-4 w-4" /> Reject</>}
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
