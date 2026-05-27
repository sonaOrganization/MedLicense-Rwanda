import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, PlayCircle, CheckCircle } from "lucide-react";

const perks = [
  "No credit card required",
  "Free trial — no commitment",
  "Access 50 questions instantly",
];

export function CTASection() {
  return (
    <section className="relative overflow-hidden bg-[#071a2e] py-24 lg:py-32">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-800/25 rounded-full blur-[120px]" />

      {/* Rwanda flag accent */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 flex opacity-50">
        <div className="flex-1 bg-sky-400" />
        <div className="flex-[2] bg-yellow-400" />
        <div className="flex-1 bg-green-500" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400 mb-4">
          Join 5,000+ Candidates
        </p>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-5">
          Ready to Pass Your Medical Licensing Exam?
        </h2>
        <p className="text-lg text-gray-400 mb-10 max-w-xl mx-auto leading-relaxed">
          Start your free trial today. Access authentic exam simulations, clinician-authored video tutorials, and the most comprehensive medical license question bank in Rwanda.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link href="/register">
            <Button
              size="lg"
              className="h-13 px-8 text-[15px] font-semibold bg-blue-700 hover:bg-blue-600 text-white shadow-xl shadow-blue-900/50 gap-2"
            >
              Start Free Today
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/free-trial">
            <Button
              size="lg"
              variant="outline"
              className="h-13 px-8 text-[15px] font-medium border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600 hover:text-white gap-2"
            >
              <PlayCircle className="w-4.5 h-4.5 text-cyan-400" />
              Try Demo Exam
            </Button>
          </Link>
        </div>

        {/* Perks */}
        <div className="flex flex-wrap items-center justify-center gap-5">
          {perks.map((perk) => (
            <div key={perk} className="flex items-center gap-2 text-sm text-gray-500">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              {perk}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
