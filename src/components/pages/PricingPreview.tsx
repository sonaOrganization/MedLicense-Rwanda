import Link from "next/link";
import { Check, ArrowRight, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    id: "basic",
    name: "Basic",
    price: 1500,
    currency: "RWF",
    period: "/ month",
    description: "Get started with focused exam practice",
    features: [
      "2 mock exams",
      "Priority support",
    ],
    cta: "Get Basic",
    href: "/register",
    highlighted: false,
    badge: null,
    icon: Zap,
  },
  {
    id: "pro",
    name: "Pro",
    price: 4000,
    currency: "RWF",
    period: "/ month",
    description: "Everything you need to pass your licensing exam",
    features: [
      "Unlimited mock exams",
      "1-on-1 support sessions",
      "Online Notes",
    ],
    cta: "Get Pro",
    href: "/register",
    highlighted: true,
    badge: "Best Value",
    icon: Crown,
  },
];

function PlanCard({ plan }: { plan: typeof plans[0] }) {
  const Icon = plan.icon;
  return (
    <div
      className={`relative flex flex-col rounded-2xl border transition-all duration-300 h-full ${
        plan.highlighted
          ? "border-indigo-600 shadow-2xl shadow-indigo-600/20 bg-indigo-700"
          : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-indigo-200 dark:hover:border-indigo-900 hover:shadow-lg"
      }`}
    >
      {plan.badge && (
        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${
          plan.highlighted ? "bg-yellow-400 text-yellow-900" : "bg-emerald-500 text-white"
        }`}>
          {plan.badge}
        </div>
      )}
      <div className="p-6 sm:p-8 flex-1 flex flex-col">
        <div className="mb-5 sm:mb-6">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
            plan.highlighted ? "bg-white/20" : "bg-indigo-100 dark:bg-indigo-900/40"
          }`}>
            <Icon className={`w-5 h-5 ${plan.highlighted ? "text-white" : "text-indigo-600 dark:text-indigo-400"}`} />
          </div>
          <h3 className={`text-xl font-bold mb-1 ${plan.highlighted ? "text-white" : "text-gray-900 dark:text-white"}`}>
            {plan.name}
          </h3>
          <p className={`text-sm ${plan.highlighted ? "text-indigo-200" : "text-gray-500 dark:text-gray-400"}`}>
            {plan.description}
          </p>
        </div>

        <div className="mb-6 sm:mb-8">
          <div className="flex items-baseline gap-1 flex-wrap">
            <span className={`text-4xl sm:text-5xl font-extrabold tabular-nums ${plan.highlighted ? "text-white" : "text-gray-900 dark:text-white"}`}>
              {plan.price.toLocaleString()}
            </span>
            <span className={`text-sm font-medium ${plan.highlighted ? "text-indigo-300" : "text-gray-400 dark:text-gray-500"}`}>
              {plan.currency} {plan.period}
            </span>
          </div>
        </div>

        <ul className="space-y-3 mb-8 flex-1">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                plan.highlighted ? "bg-white/20" : "bg-indigo-100 dark:bg-indigo-900/40"
              }`}>
                <Check className={`w-3 h-3 ${plan.highlighted ? "text-white" : "text-indigo-600 dark:text-indigo-400"}`} />
              </div>
              <span className={`text-sm font-medium ${plan.highlighted ? "text-indigo-100" : "text-gray-700 dark:text-gray-200"}`}>
                {feature}
              </span>
            </li>
          ))}
        </ul>

        <Link href={plan.href}>
          <Button
            className={`w-full font-semibold ${
              plan.highlighted
                ? "bg-white text-indigo-700 hover:bg-indigo-50"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            {plan.cta}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function PricingPreview() {
  return (
    <section className="py-14 sm:py-20 lg:py-28 bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-16">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 mb-2 sm:mb-3">
            Pricing
          </p>
          <h2 className="text-2xl sm:text-4xl lg:text-[42px] font-extrabold text-gray-900 dark:text-white leading-tight mb-3 sm:mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-sm sm:text-lg text-gray-500 dark:text-gray-400">
            Choose the plan that fits your preparation goals.
          </p>
        </div>

        {/* Mobile: horizontal scroll carousel */}
        <div className="sm:hidden flex gap-4 overflow-x-auto -mx-4 px-4 pb-4 snap-x snap-mandatory">
          {plans.map((plan) => (
            <div key={plan.name} className="flex-none w-[82vw] snap-start pt-4">
              <PlanCard plan={plan} />
            </div>
          ))}
        </div>

        {/* Desktop: 2-col grid */}
        <div className="hidden sm:grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {plans.map((plan) => (
            <div key={plan.name} className="pt-4">
              <PlanCard plan={plan} />
            </div>
          ))}
        </div>

        <p className="mt-8 sm:mt-10 text-center text-[12px] sm:text-sm text-gray-400 dark:text-gray-500">
          Secure payments via Afripay · Cancel anytime
        </p>
      </div>
    </section>
  );
}
