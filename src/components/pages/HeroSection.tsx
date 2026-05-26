import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle, PlayCircle, ArrowRight, ShieldCheck, Users, Star } from "lucide-react";

const highlights = [
  "Real RMDC exam simulation with timer",
  "2,500+ curated practice questions",
  "AI-powered performance analytics",
  "Expert video tutorials & study notes",
];

const trustBadges = [
  { icon: Users, label: "5,000+ students" },
  { icon: Star, label: "98% pass rate" },
  { icon: ShieldCheck, label: "RMDC aligned" },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#0b0f1e]">
      {/* Gradient mesh background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[700px] h-[700px] bg-indigo-700/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-700/15 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%234f46e5%22%20fill-opacity%3D%220.04%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-40" />
      </div>

      {/* Rwanda flag top stripe */}
      <div className="absolute top-0 left-0 right-0 h-0.5 flex opacity-60">
        <div className="flex-1 bg-sky-400" />
        <div className="flex-[2] bg-yellow-400" />
        <div className="flex-1 bg-green-500" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-36">
        <div className="grid lg:grid-cols-2 gap-14 items-center">

          {/* ── Left ── */}
          <div>
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 border border-indigo-500/30 bg-indigo-500/10 rounded-full px-4 py-1.5 mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-xs font-semibold text-indigo-300 tracking-wider uppercase">
                #1 RMDC Exam Platform in Rwanda
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold leading-[1.1] tracking-tight text-white mb-6">
              Prepare Smarter.{" "}
              <span className="relative">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                  Pass Your RMDC
                </span>
              </span>{" "}
              Exam with Confidence.
            </h1>

            <p className="text-[17px] text-gray-400 leading-relaxed mb-8 max-w-lg">
              Rwanda's most comprehensive medical licensing exam prep platform. Real exam simulations, expert content, and data-driven analytics — built for future healthcare heroes.
            </p>

            {/* Feature list */}
            <ul className="space-y-2.5 mb-10">
              {highlights.map((h) => (
                <li key={h} className="flex items-center gap-3 text-[15px] text-gray-300">
                  <CheckCircle className="w-4.5 h-4.5 text-emerald-400 flex-shrink-0" />
                  {h}
                </li>
              ))}
            </ul>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <Link href="/register">
                <Button
                  size="lg"
                  className="h-12 px-7 text-[15px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-900/50 w-full sm:w-auto gap-2"
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/free-trial">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-7 text-[15px] font-medium border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white hover:border-gray-600 w-full sm:w-auto gap-2"
                >
                  <PlayCircle className="w-4.5 h-4.5 text-indigo-400" />
                  Try a Demo Exam
                </Button>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-5">
              {trustBadges.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-sm text-gray-500">
                  <Icon className="w-4 h-4 text-indigo-500" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right — Mock exam card ── */}
          <div className="hidden lg:block">
            <div className="relative">
              {/* Glow */}
              <div className="absolute -inset-4 bg-indigo-600/20 rounded-3xl blur-2xl" />

              <div className="relative bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-700/60 shadow-2xl overflow-hidden">
                {/* Card header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/80 bg-gray-900/60">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">RMDC Mock Exam</p>
                    <p className="text-sm font-semibold text-white">Clinical Medicine — Session 1</p>
                  </div>
                  <div className="flex items-center gap-2 bg-red-950/60 border border-red-800/50 rounded-xl px-3 py-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                    <span className="text-sm font-mono font-bold text-red-400">45:23</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="px-6 py-3 border-b border-gray-800/60 bg-gray-950/40">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full w-3/5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
                    </div>
                    <span className="text-xs text-gray-500 font-mono flex-shrink-0">30 / 50</span>
                  </div>
                </div>

                {/* Question */}
                <div className="px-6 py-5">
                  <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">Question 30</p>
                  <p className="text-sm text-gray-200 leading-relaxed mb-5">
                    A 45-year-old male presents with acute chest pain radiating to the left arm, diaphoresis, and dyspnea. Which is the most appropriate first investigation?
                  </p>

                  <div className="space-y-2">
                    {["12-lead ECG", "Chest X-ray", "Echocardiogram", "Cardiac enzymes (Troponin)"].map((opt, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors cursor-default ${
                          i === 0
                            ? "bg-indigo-600/20 border border-indigo-500/50 text-indigo-200"
                            : "bg-gray-800/40 border border-gray-700/40 text-gray-400"
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          i === 0 ? "bg-indigo-500 text-white" : "bg-gray-700 text-gray-400"
                        }`}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats footer */}
                <div className="px-6 py-4 border-t border-gray-800/60 bg-gray-950/40 grid grid-cols-3 gap-4">
                  {[
                    { label: "Correct", value: "22", color: "text-emerald-400" },
                    { label: "Wrong", value: "5", color: "text-red-400" },
                    { label: "Skipped", value: "3", color: "text-yellow-400" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="text-center">
                      <div className={`text-xl font-bold tabular-nums ${color}`}>{value}</div>
                      <div className="text-xs text-gray-600 mt-0.5">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
