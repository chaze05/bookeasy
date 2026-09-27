/**
 * Subscription plans — single source of truth for limits and features.
 * All enforcement reads from here so pricing copy and code never drift.
 */

export type PlanId = "free" | "pro" | "business";

export interface PlanDefinition {
  id: PlanId;
  name: string;
  price: number;
  /** null = unlimited */
  staffLimit: number | null;
  /** null = unlimited bookings per calendar month */
  monthlyBookings: number | null;
  onlinePayments: boolean;
  deposits: boolean;
  reminders: boolean;
  reports: boolean;
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Starter",
    price: 0,
    staffLimit: 1,
    monthlyBookings: 50,
    onlinePayments: false,
    deposits: false,
    reminders: false,
    reports: false,
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 999,
    staffLimit: 5,
    monthlyBookings: null,
    onlinePayments: true,
    deposits: true,
    reminders: true,
    reports: true,
  },
  business: {
    id: "business",
    name: "Business",
    price: 1999,
    staffLimit: null,
    monthlyBookings: null,
    onlinePayments: true,
    deposits: true,
    reminders: true,
    reports: true,
  },
};

export function normalizePlan(value: string | null | undefined): PlanId {
  return value === "pro" || value === "business" ? value : "free";
}

/** Paid plans past their expiry fall back to free automatically. */
export function effectivePlan(business: {
  plan?: string | null;
  plan_expires_at?: Date | string | null;
}): PlanId {
  const plan = normalizePlan(business.plan);
  if (plan === "free") return "free";
  const expiry = business.plan_expires_at ? new Date(business.plan_expires_at) : null;
  if (expiry && expiry.getTime() < Date.now()) return "free";
  return plan;
}

export function planDefinition(business: {
  plan?: string | null;
  plan_expires_at?: Date | string | null;
}): PlanDefinition {
  return PLANS[effectivePlan(business)];
}

export type PlanFeature = "onlinePayments" | "deposits" | "reminders" | "reports";

export function canUse(
  feature: PlanFeature,
  business: { plan?: string | null; plan_expires_at?: Date | string | null }
): boolean {
  return planDefinition(business)[feature];
}

export const PLAN_ORDER: PlanId[] = ["free", "pro", "business"];
