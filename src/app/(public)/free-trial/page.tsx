import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Clock, FileText, CheckCircle } from "lucide-react";

export const metadata: Metadata = { title: "Free Trial Exam" };

export default function FreeTrialPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Try a Free Sample Exam</h1>
        <p className="text-xl text-gray-500 dark:text-gray-400">
          Experience the real medical licensing exam format with our free 20-question sample test.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">Sample Exam</h2>
          <div className="space-y-3 mb-6">
            {[
              { icon: FileText, text: "20 multiple choice questions" },
              { icon: Clock, text: "25 minute time limit" },
              { icon: CheckCircle, text: "Instant results & explanations" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-indigo-200" />
                <span className="text-indigo-100">{text}</span>
              </div>
            ))}
          </div>
          <Link href="/register">
            <Button className="w-full bg-white text-indigo-700 hover:bg-indigo-50" size="lg">
              Start Free Exam
            </Button>
          </Link>
          <p className="text-indigo-300 text-sm mt-3 text-center">No credit card required</p>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">What to expect</h3>
          {[
            { title: "Real Exam Format", desc: "Questions are formatted exactly like the official medical licensing exam." },
            { title: "Timed Environment", desc: "Experience the pressure of a timed exam before test day." },
            { title: "Immediate Feedback", desc: "See which answers were right or wrong with full explanations." },
            { title: "No Registration Required", desc: "Take the free trial without creating an account." },
          ].map(({ title, desc }) => (
            <div key={title} className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">{title}</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
