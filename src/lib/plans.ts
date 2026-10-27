/**
 * Subscription plans — single source of truth for limits and features.
 * All enforcement reads from here so pricing copy and code never drift.
 *
 * 'free' is the internal trial state: 14 days of Pro features
 * (trial_ends_at), then locked until a paid plan is purchased.
 */

export type PlanId = "free" | "starter" | "pro" | "business";

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

export const TRIAL_DAYS = 14;

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Trial ended",
    price: 0,
    staffLimit: 0,
    monthlyBookings: 0,
    onlinePayments: false,
    deposits: false,
    reminders: false,
    reports: false,
  },
  starter: {
    id: "starter",
    name: "Starter",
    price: 799,
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
    price: 1299,
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
  return value === "starter" || value === "pro" || value === "business" ? value : "free";
}

/** True while a free-signup business is inside its 14-day trial. */
export function isInTrial(business: {
  plan?: string | null;
  trial_ends_at?: Date | string | null;
}): boolean {
  if (normalizePlan(business.plan) !== "free") return false;
  if (!business.trial_ends_at) return false;
  return new Date(business.trial_ends_at).getTime() > Date.now();
}

/** Effective plan: free + active trial = Pro features; expired paid plans = locked. */
export function effectivePlan(business: {
  plan?: string | null;
  plan_expires_at?: Date | string | null;
  trial_ends_at?: Date | string | null;
}): PlanId {
  const plan = normalizePlan(business.plan);

  if (plan === "free") {
    return isInTrial(business) ? "pro" : "free";
  }

  const expiry = business.plan_expires_at ? new Date(business.plan_expires_at) : null;
  if (expiry && expiry.getTime() < Date.now()) return "free";
  return plan;
}

export function planDefinition(business: {
  plan?: string | null;
  plan_expires_at?: Date | string | null;
  trial_ends_at?: Date | string | null;
}): PlanDefinition {
  return PLANS[effectivePlan(business)];
}

export type PlanFeature = "onlinePayments" | "deposits" | "reminders" | "reports";

export function canUse(
  feature: PlanFeature,
  business: {
    plan?: string | null;
    plan_expires_at?: Date | string | null;
    trial_ends_at?: Date | string | null;
  }
): boolean {
  return planDefinition(business)[feature];
}

export const PLAN_ORDER: PlanId[] = ["free", "starter", "pro", "business"];
export const PAID_PLANS: PlanId[] = ["starter", "pro", "business"];
