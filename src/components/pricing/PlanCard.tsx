import type { ReactNode } from "react";
import { CalendarDays, CalendarRange, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { PREMIUM_FEATURES, pricePerDay, savingsVsWeekly, type Plan } from "@/lib/plans";

const planIcon = { weekly: CalendarDays, monthly: CalendarRange } as const;

interface PlanCardProps {
  plan: Plan;
  /** Whatever should sit at the bottom of the card — a link, a pay button, or a status note. */
  action: ReactNode;
}

export function PlanCard({ plan, action }: PlanCardProps) {
  const Icon    = planIcon[plan.id];
  const savings = savingsVsWeekly(plan);
  const accent  = plan.highlighted;

  return (
    <div
      className={cn(
        "relative flex h-full flex-col rounded-2xl border p-6 transition-all duration-200 sm:p-7",
        accent
          ? "border-teal-500/50 bg-[#07202e] shadow-xl shadow-teal-950/25"
          : "border-slate-200 bg-white hover:border-teal-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-teal-800"
      )}
    >
      {/* Header: icon + name on the left, value badge on the right */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
              accent ? "bg-teal-400/15 text-teal-300" : "bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400"
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <h3 className={cn("text-lg font-bold leading-tight", accent ? "text-white" : "text-slate-900 dark:text-white")}>
              {plan.name}
            </h3>
            <p className={cn("text-xs", accent ? "text-teal-200/70" : "text-slate-500 dark:text-slate-400")}>
              {plan.durationDays} days of full access
            </p>
          </div>
        </div>

        {plan.badge && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-teal-400 px-2.5 py-1 text-[11px] font-bold text-slate-950">
            <Sparkles className="h-3 w-3" />
            {plan.badge}
          </span>
        )}
      </div>

      <p className={cn("mt-4 text-sm leading-relaxed", accent ? "text-slate-300" : "text-slate-500 dark:text-slate-400")}>
        {plan.tagline}
      </p>

      {/* Price */}
      <div className="mt-5">
        <div className="flex flex-wrap items-baseline gap-x-1.5">
          <span
            className={cn(
              "text-4xl font-extrabold tabular-nums tracking-tight sm:text-[2.75rem]",
              accent ? "text-white" : "text-slate-900 dark:text-white"
            )}
          >
            {plan.price.toLocaleString()}
          </span>
          <span className={cn("text-sm font-semibold", accent ? "text-teal-300" : "text-slate-600 dark:text-slate-300")}>
            {plan.currency}
          </span>
          <span className={cn("text-sm", accent ? "text-slate-400" : "text-slate-400 dark:text-slate-500")}>
            / {plan.periodLabel}
          </span>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-lg px-2 py-1 text-[11px] font-medium tabular-nums",
              accent ? "bg-white/10 text-slate-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            )}
          >
            ≈ {pricePerDay(plan).toLocaleString()} {plan.currency} per day
          </span>
          {savings > 0 && (
            <span className="rounded-lg bg-emerald-400/15 px-2 py-1 text-[11px] font-bold text-emerald-300">
              Save {savings}% vs weekly
            </span>
          )}
        </div>
      </div>

      <div className={cn("mt-6 border-t pt-5", accent ? "border-white/10" : "border-slate-100 dark:border-slate-800")}>
        <p className={cn("text-xs font-medium", accent ? "text-slate-400" : "text-slate-500 dark:text-slate-400")}>
          Everything in MedLicense Premium, billed once — no automatic renewal.
        </p>
      </div>

      <div className="mt-6 flex-1" />
      {action}
    </div>
  );
}

/**
 * The feature list lives outside the cards: both plans unlock the identical
 * platform, so repeating it per card would only add noise to the comparison.
 */
export function PremiumFeatureList({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-slate-50/70 p-6 dark:border-slate-800 dark:bg-slate-900/50 sm:p-8",
        className
      )}
    >
      <h3 className="text-base font-bold text-slate-900 dark:text-white">Included in every plan</h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Weekly and monthly unlock the same platform — only the access window differs.
      </p>
      <ul className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {PREMIUM_FEATURES.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <span className="mt-0.5 grid h-4.5 w-4.5 shrink-0 place-items-center rounded-full bg-teal-100 dark:bg-teal-950/70">
              <Check className="h-3 w-3 text-teal-700 dark:text-teal-400" />
            </span>
            <span className="text-sm text-slate-700 dark:text-slate-200">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
