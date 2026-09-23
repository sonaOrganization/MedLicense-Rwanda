import Link from "next/link";
import { ArrowRight, ShieldCheck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlanCard, PremiumFeatureList } from "@/components/pricing/PlanCard";
import { PLAN_LIST, formatPrice, type Plan } from "@/lib/plans";

function PlanAction({ plan }: { plan: Plan }) {
  return (
    <Link href="/register" className="block">
      <Button
        size="lg"
        className={
          plan.highlighted
            ? "w-full bg-teal-400 text-slate-950 shadow-lg shadow-teal-950/30 hover:bg-teal-300"
            : "w-full bg-teal-700 text-white hover:bg-teal-800"
        }
      >
        Choose {plan.name} · {formatPrice(plan)}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </Link>
  );
}

export function PricingPreview() {
  return (
    <section className="bg-white py-14 sm:py-20 lg:py-28 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-teal-700 sm:mb-3 sm:text-xs dark:text-teal-400">
            Pricing
          </p>
          <h2 className="mb-3 text-2xl font-extrabold leading-tight text-gray-900 sm:mb-4 sm:text-4xl lg:text-[42px] dark:text-white">
            One membership, two ways to pay
          </h2>
          <p className="text-sm text-gray-500 sm:text-lg dark:text-gray-400">
            Revising for an exam next week, or preparing over a full cycle? Pick the window that fits — the platform is the same either way.
          </p>
        </div>

        {/* Plans */}
        <div className="mx-auto grid max-w-3xl gap-5 sm:grid-cols-2 sm:gap-6">
          {PLAN_LIST.map((plan) => (
            <PlanCard key={plan.id} plan={plan} action={<PlanAction plan={plan} />} />
          ))}
        </div>

        {/* Shared feature list */}
        <PremiumFeatureList className="mx-auto mt-6 max-w-3xl sm:mt-8" />

        {/* Trust strip */}
        <div className="mx-auto mt-6 flex max-w-3xl flex-col items-center justify-center gap-3 text-center text-xs text-gray-500 sm:mt-8 sm:flex-row sm:gap-6 sm:text-sm dark:text-gray-400">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Secure payment via Afripay
          </span>
          <span className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            Mobile Money and card accepted
          </span>
        </div>
      </div>
    </section>
  );
}
