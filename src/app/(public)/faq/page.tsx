import type { Metadata } from "next";

export const metadata: Metadata = { title: "FAQ" };

const categories = [
  {
    title: "Getting Started",
    items: [
      { q: "What is RMDC Exam Prep?", a: "RMDC Exam Prep is Rwanda's leading platform for professional medical license exam preparation, offering practice exams, video tutorials, and analytics." },
      { q: "How do I create an account?", a: "Click 'Get Started' on the homepage, fill in your details, verify your email, and you're ready to go. The free plan is available immediately." },
      { q: "Is there a free trial?", a: "Yes! Our free plan gives you access to 20 questions and 1 sample exam. No credit card required." },
    ],
  },
  {
    title: "Exams & Practice",
    items: [
      { q: "How does the exam simulation work?", a: "Our exam engine mirrors the real RMDC format with timed sessions, randomized questions, shuffled answers, and auto-submit when time runs out." },
      { q: "Can I retake exams?", a: "Yes, you can retake any exam as many times as you want." },
      { q: "How many questions are in the question bank?", a: "Our premium plan includes 2,500+ curated questions across all RMDC exam categories." },
    ],
  },
  {
    title: "Payments",
    items: [
      { q: "What payment methods are accepted?", a: "MTN Mobile Money, Airtel Money, credit/debit cards, and Afripay." },
      { q: "Is my payment secure?", a: "Yes. All payments are processed through encrypted, PCI-compliant payment gateways." },
      { q: "Can I get a refund?", a: "Yes, we offer a 7-day money-back guarantee." },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Frequently Asked Questions</h1>
        <p className="text-lg text-gray-500 dark:text-gray-400">Everything you need to know about RMDC Exam Prep.</p>
      </div>

      <div className="space-y-12">
        {categories.map(({ title, items }) => (
          <div key={title}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">{title}</h2>
            <div className="space-y-4">
              {items.map(({ q, a }) => (
                <div key={q} className="p-6 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{q}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
