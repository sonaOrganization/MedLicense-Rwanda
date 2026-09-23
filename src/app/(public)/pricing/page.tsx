import type { Metadata } from "next";
import { PricingPreview } from "@/components/pages/PricingPreview";
import { HelpCircle } from "lucide-react";

export const metadata: Metadata = { title: "Pricing" };

const faq = [
  { q: "What is the difference between the weekly and monthly plan?", a: "Only the length of access. The weekly plan gives you 7 days of full access for 1,500 RWF; the monthly plan gives you 30 days for 3,000 RWF. Both unlock exactly the same exams, cases and analytics." },
  { q: "Do I need to cancel my subscription?", a: "No. Both plans are a single payment and nothing renews automatically. Your access simply ends on the date shown in your dashboard, and you can buy another plan whenever you like." },
  { q: "What happens if I buy a second plan before the first expires?", a: "The new plan is added on top of your remaining days instead of replacing them, so you never lose time you have already paid for." },
  { q: "What payment methods do you accept?", a: "Mobile Money (MTN, Airtel) and credit/debit cards, processed securely through Afripay." },
  { q: "Can I try the platform before paying?", a: "Yes. Create a free account and take the free trial exams — no payment details required." },
];

export default function PricingPage() {
  return (
    <div>
      <div className="px-4 pt-20 pb-4 text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">Pricing Plans</h1>
        <p className="text-lg text-gray-500 dark:text-gray-400">Start free. Pay only for the weeks you need.</p>
      </div>

      <PricingPreview />

      <div className="max-w-3xl mx-auto px-4 pb-20">
        <h2 className="mb-8 flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
          <HelpCircle className="h-6 w-6 text-teal-600 dark:text-teal-400" /> Pricing FAQ
        </h2>
        <div className="space-y-4">
          {faq.map(({ q, a }) => (
            <div key={q} className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">{q}</h3>
              <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
