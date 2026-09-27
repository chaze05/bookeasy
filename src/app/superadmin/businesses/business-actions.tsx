"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { suspendBusiness, reactivateBusiness, setBusinessPlan } from "@/actions/superadmin";
import { Button } from "@/components/ui/button";
import type { BusinessStatus } from "@/types";

interface BusinessActionsProps {
  businessId: string;
  status: BusinessStatus;
  plan: string;
}

export function BusinessActions({ businessId, status, plan }: BusinessActionsProps) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      try {
        if (status === "active") {
          await suspendBusiness(businessId);
          toast.success("Business suspended");
        } else {
          await reactivateBusiness(businessId);
          toast.success("Business reactivated");
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Action failed");
      }
    });
  }

  function handlePlanChange(next: string) {
    startTransition(async () => {
      try {
        await setBusinessPlan(businessId, next as "free" | "pro" | "business");
        toast.success(`Plan set to ${next}`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Action failed");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={plan}
        onChange={(e) => handlePlanChange(e.target.value)}
        disabled={isPending}
        className="h-8 rounded-lg border border-zinc-700 bg-zinc-900 px-2 text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none disabled:opacity-50"
        title="Subscription plan"
      >
        <option value="free">Free</option>
        <option value="pro">Pro</option>
        <option value="business">Business</option>
      </select>

      <Button
        variant="outline"
        size="sm"
        onClick={handleToggle}
        disabled={isPending}
        className={
          status === "active"
            ? "border-red-900/60 text-red-400 hover:bg-red-950/40 hover:text-red-300"
            : "border-emerald-900/60 text-emerald-400 hover:bg-emerald-950/40 hover:text-emerald-300"
        }
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : status === "active" ? (
          "Suspend"
        ) : (
          "Reactivate"
        )}
      </Button>
    </div>
  );
}
