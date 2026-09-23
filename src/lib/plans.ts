export type PlanId = "weekly" | "monthly";

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  price: number;
  currency: string;
  /** Access length in days. Days (not months) keep month-end arithmetic unambiguous. */
  durationDays: number;
  /** Rendered after the price, e.g. "1,500 RWF / week". */
  periodLabel: string;
  /** Shown as the payment description on the AfriPay checkout page. */
  checkoutLabel: string;
  badge?: string;
  highlighted?: boolean;
}

export const PLANS: Record<PlanId, Plan> = {
  weekly: {
    id: "weekly",
    name: "Weekly",
    tagline: "Full access for a focused week of revision.",
    price: 1500,
    currency: "RWF",
    durationDays: 7,
    periodLabel: "week",
    checkoutLabel: "MedLicense Weekly Plan (7 days)",
  },
  monthly: {
    id: "monthly",
    name: "Monthly",
    tagline: "Full access for a complete preparation cycle.",
    price: 3000,
    currency: "RWF",
    durationDays: 30,
    periodLabel: "month",
    checkoutLabel: "MedLicense Monthly Plan (30 days)",
    badge: "Best value",
    highlighted: true,
  },
};

export const PLAN_LIST: Plan[] = [PLANS.weekly, PLANS.monthly];

/** Both plans unlock exactly the same platform — only the access window differs. */
export const PREMIUM_FEATURES = [
  "Unlimited theory mock exams",
  "Full practical case library",
  "Detailed answer explanations",
  "Progress analytics by competency",
  "English and French content",
  "Online notes and saved questions",
  "1-on-1 support sessions",
  "Study on phone, tablet or desktop",
];

// Payments and subscriptions created before the two-tier redesign carry plan "pro",
// which was a one-month plan. Keep resolving it so old records still renew correctly.
const LEGACY_PLAN_DAYS: Record<string, number> = { pro: 30 };

// Object.hasOwn, not `in` — `in` walks the prototype chain, so a client posting
// planId "toString" would otherwise resolve to Object.prototype.toString.
export function getPlan(id: unknown): Plan | null {
  return typeof id === "string" && Object.hasOwn(PLANS, id) ? PLANS[id as PlanId] : null;
}

export function planDurationDays(planId: string): number {
  if (Object.hasOwn(LEGACY_PLAN_DAYS, planId)) return LEGACY_PLAN_DAYS[planId];
  return getPlan(planId)?.durationDays ?? 30;
}

/**
 * End of the access window for `planId`. `from` lets a renewal extend an
 * unexpired subscription instead of discarding the time already paid for.
 */
export function planEndDate(planId: string, from: Date = new Date()): Date {
  const end = new Date(from);
  end.setDate(end.getDate() + planDurationDays(planId));
  return end;
}

export function pricePerDay(plan: Plan): number {
  return Math.round(plan.price / plan.durationDays);
}

/** Whole-percent saving per day against the weekly plan; 0 for the weekly plan itself. */
export function savingsVsWeekly(plan: Plan): number {
  const { weekly } = PLANS;
  if (plan.id === weekly.id) return 0;
  return Math.round((1 - pricePerDay(plan) / pricePerDay(weekly)) * 100);
}

export function formatPrice(plan: Plan): string {
  return `${plan.price.toLocaleString()} ${plan.currency}`;
}
