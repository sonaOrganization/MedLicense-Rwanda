import Link from "next/link";
import { Check, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Free",
    price: 0,
    currency: "RWF",
    period: "forever",
    description: "Begin your RMDC prep journey at no cost",
    features: [
      "50 free practice questions",
      "1 sample mock exam",
      "Basic score analytics",
      "Community forum access",
    ],
    cta: "Start Free",
    href: "/register",
    highlighted: false,
    badge: null,
  },
  {
    name: "Premium",
    price: 15000,
    currency: "RWF",
    period: "/ month",
    description: "Full access for serious RMDC candidates",
    features: [
      "2,500+ practice questions",
      "Unlimited mock exams",
      "HD video tutorials",
      "Deep analytics & insights",
      "Study notes & PDF exports",
      "Priority email support",
    ],
    cta: "Get Premium",
    href: "/pricing",
    highlighted: true,
    badge: "Most Popular",
  },
  {
    name: "Annual",
    price: 120000,
    currency: "RWF",
    period: "/ year",
    description: "Best value — equivalent to 8 months",
    features: [
      "Everything in Premium",
      "Flashcard study system",
      "Offline access",
      "Early feature access",
      "1-on-1 tutor session",
    ],
    cta: "Get Annual",
    href: "/pricing",
    highlighted: false,
    badge: "Save 33%",
  },
];

export function PricingPreview() {
  return (
    <section className="py-24 lg:py-32 bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-400 mb-3">
            Pricing
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-gray-900 dark:text-white leading-tight mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400">
            Start free and upgrade when you're ready for the full RMDC prep experience.
          </p>
        </div>

        {/* Plans */}
        <div className="grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border transition-all duration-300 ${
                plan.highlighted
                  ? "border-blue-600 dark:border-blue-600 shadow-2xl shadow-blue-600/20 bg-blue-700"
                  : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-blue-200 dark:hover:border-blue-900 hover:shadow-lg"
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold ${
                  plan.highlighted
                    ? "bg-yellow-400 text-yellow-900"
                    : "bg-emerald-500 text-white"
                }`}>
                  {plan.badge}
                </div>
              )}

              <div className="p-7 flex-1 flex flex-col">
                {/* Name + desc */}
                <div className="mb-6">
                  <h3 className={`text-lg font-bold mb-1.5 ${plan.highlighted ? "text-white" : "text-gray-900 dark:text-white"}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm ${plan.highlighted ? "text-blue-200" : "text-gray-500 dark:text-gray-400"}`}>
                    {plan.description}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-7">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-extrabold tabular-nums ${plan.highlighted ? "text-white" : "text-gray-900 dark:text-white"}`}>
                      {plan.price === 0 ? "Free" : plan.price.toLocaleString()}
                    </span>
                    {plan.price > 0 && (
                      <span className={`text-sm font-medium ${plan.highlighted ? "text-blue-300" : "text-gray-400 dark:text-gray-500"}`}>
                        {plan.currency} {plan.period}
                      </span>
                    )}
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                        plan.highlighted ? "bg-blue-400/30" : "bg-blue-100 dark:bg-blue-900/40"
                      }`}>
                        <Check className={`w-2.5 h-2.5 ${plan.highlighted ? "text-blue-100" : "text-blue-700 dark:text-blue-400"}`} />
                      </div>
                      <span className={`text-sm ${plan.highlighted ? "text-blue-100" : "text-gray-600 dark:text-gray-300"}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link href={plan.href}>
                  <Button
                    className={`w-full font-semibold ${
                      plan.highlighted
                        ? "bg-white text-blue-700 hover:bg-blue-50"
                        : "bg-blue-700 hover:bg-blue-800 text-white"
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Footnote */}
        <p className="mt-10 text-center text-sm text-gray-400 dark:text-gray-500">
          All plans include a 7-day free trial · Cancel anytime · Payments via Afripay & Mobile Money
        </p>
      </div>
    </section>
  );
}
