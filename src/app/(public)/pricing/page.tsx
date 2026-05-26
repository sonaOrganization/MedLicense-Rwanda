import type { Metadata } from "next";
import { PricingPreview } from "@/components/pages/PricingPreview";
import { HelpCircle } from "lucide-react";

export const metadata: Metadata = { title: "Pricing" };

const faq = [
  { q: "Can I cancel my subscription anytime?", a: "Yes, you can cancel at any time. Your access continues until the end of the billing period." },
  { q: "What payment methods do you accept?", a: "We accept Mobile Money (MTN, Airtel), credit/debit cards, and Afripay." },
  { q: "Is there a student discount?", a: "Yes! Contact us with your student ID for a 20% student discount." },
  { q: "Can I get a refund?", a: "We offer a 7-day money-back guarantee if you are not satisfied with the service." },
];

export default function PricingPage() {
  return (
    <div>
      <div className="text-center pt-20 pb-4 px-4">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Pricing Plans</h1>
        <p className="text-lg text-gray-500 dark:text-gray-400">Start free. Upgrade when you need more.</p>
      </div>

      <PricingPreview />

      <div className="max-w-3xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-indigo-500" /> Pricing FAQ
        </h2>
        <div className="space-y-4">
          {faq.map(({ q, a }) => (
            <div key={q} className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{q}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
