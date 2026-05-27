import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle, PlayCircle, ArrowRight, ShieldCheck, Users, Star } from "lucide-react";

const highlights = [
  "Real medical licensing exam simulation with timer",
  "2,500+ curated practice questions",
  "AI-powered performance analytics",
  "Expert video tutorials & study notes",
];

const trustBadges = [
  { icon: Users, label: "5,000+ students" },
  { icon: Star, label: "98% pass rate" },
  { icon: ShieldCheck, label: "License aligned" },
];

const mobileAnswers = [
  { label: "A", text: "12-lead ECG", selected: true },
  { label: "B", text: "Chest X-ray", selected: false },
  { label: "C", text: "Echocardiogram", selected: false },
  { label: "D", text: "Cardiac enzymes", selected: false },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#071a2e]">
      {/* Gradient mesh */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[700px] h-[700px] bg-blue-800/25 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-900/20 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%234f46e5%22%20fill-opacity%3D%220.04%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-40" />
      </div>

      {/* Rwanda flag stripe */}
      <div className="absolute top-0 left-0 right-0 h-0.5 flex opacity-60">
        <div className="flex-1 bg-sky-400" />
        <div className="flex-[2] bg-yellow-400" />
        <div className="flex-1 bg-green-500" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14 sm:py-24 lg:py-36">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">

          {/* ── Left ── */}
          <div>
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 border border-cyan-500/30 bg-cyan-500/10 rounded-full px-3 sm:px-4 py-1 sm:py-1.5 mb-5 sm:mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[10px] sm:text-xs font-semibold text-cyan-300 tracking-wider uppercase">
                #1 Medical License Exam Platform in Rwanda
              </span>
            </div>

            <h1 className="text-[30px] leading-[1.15] sm:text-5xl lg:text-[56px] font-extrabold tracking-tight text-white mb-4 sm:mb-6">
              Prepare Smarter.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-cyan-300 to-teal-300">
                Pass Your Licensing
              </span>{" "}
              Exam with Confidence.
            </h1>

            <p className="text-[14px] sm:text-[17px] text-gray-400 leading-relaxed mb-5 sm:mb-8 max-w-lg">
              Rwanda's most comprehensive medical licensing exam preparation platform — authentic simulations, clinician-authored content, and evidence-based analytics.
            </p>

            {/* Feature list */}
            <ul className="space-y-2 sm:space-y-2.5 mb-6 sm:mb-10">
              {highlights.map((h) => (
                <li key={h} className="flex items-center gap-2.5 text-[13px] sm:text-[15px] text-gray-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  {h}
                </li>
              ))}
            </ul>

            {/* CTA buttons — side by side on mobile */}
            <div className="flex gap-2 sm:gap-3 mb-6 sm:mb-10">
              <Link href="/register" className="flex-1 sm:flex-none">
                <Button
                  size="lg"
                  className="h-11 sm:h-12 px-4 sm:px-7 text-[14px] sm:text-[15px] font-semibold bg-blue-700 hover:bg-blue-600 text-white shadow-xl shadow-blue-900/50 w-full gap-1.5"
                >
                  Start Free Trial
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Button>
              </Link>
              <Link href="/free-trial" className="flex-1 sm:flex-none">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-11 sm:h-12 px-3 sm:px-7 text-[14px] sm:text-[15px] font-medium border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white hover:border-gray-600 w-full gap-1.5"
                >
                  <PlayCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span className="hidden sm:inline">Try a Demo Exam</span>
                  <span className="sm:hidden">Try Demo</span>
                </Button>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-5">
              {trustBadges.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-[12px] sm:text-sm text-gray-500">
                  <Icon className="w-3.5 h-3.5 text-blue-400" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right — Desktop exam card ── */}
          <div className="hidden lg:block">
            <div className="relative">
              <div className="absolute -inset-4 bg-blue-700/20 rounded-3xl blur-2xl" />
              <div className="relative bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-700/60 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/80 bg-gray-900/60">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">MedLicense Mock Exam</p>
                    <p className="text-sm font-semibold text-white">Clinical Medicine — Session 1</p>
                  </div>
                  <div className="flex items-center gap-2 bg-red-950/60 border border-red-800/50 rounded-xl px-3 py-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                    <span className="text-sm font-mono font-bold text-red-400">45:23</span>
                  </div>
                </div>
                <div className="px-6 py-3 border-b border-gray-800/60 bg-gray-950/40">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full w-3/5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" />
                    </div>
                    <span className="text-xs text-gray-500 font-mono flex-shrink-0">30 / 50</span>
                  </div>
                </div>
                <div className="px-6 py-5">
                  <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">Question 30</p>
                  <p className="text-sm text-gray-200 leading-relaxed mb-5">
                    A 45-year-old male presents with acute chest pain radiating to the left arm, diaphoresis, and dyspnea. Which is the most appropriate first investigation?
                  </p>
                  <div className="space-y-2">
                    {["12-lead ECG", "Chest X-ray", "Echocardiogram", "Cardiac enzymes (Troponin)"].map((opt, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm cursor-default ${
                          i === 0
                            ? "bg-blue-600/20 border border-blue-500/50 text-sky-200"
                            : "bg-gray-800/40 border border-gray-700/40 text-gray-400"
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          i === 0 ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-400"
                        }`}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
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

        {/* ── Mobile-only exam preview card ── */}
        <div className="lg:hidden mt-8">
          <div className="relative">
            <div className="absolute -inset-2 bg-blue-700/10 rounded-2xl blur-xl" />
            <div className="relative bg-gray-900/90 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/80 bg-gray-900/60">
                <div>
                  <p className="text-[10px] text-gray-500 mb-0.5">MedLicense · Mock Exam</p>
                  <p className="text-xs font-semibold text-white">Clinical Medicine — Session 1</p>
                </div>
                <div className="flex items-center gap-1.5 bg-red-950/60 border border-red-800/50 rounded-lg px-2.5 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-red-400">45:23</span>
                </div>
              </div>
              <div className="px-4 py-2 border-b border-gray-800/60 bg-gray-950/40">
                <div className="flex items-center gap-2.5">
                  <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full w-3/5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" />
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono flex-shrink-0">30 / 50</span>
                </div>
              </div>
              <div className="px-4 py-4">
                <p className="text-[10px] text-gray-500 mb-2 font-medium uppercase tracking-wide">Question 30</p>
                <p className="text-xs text-gray-200 leading-relaxed mb-3">
                  A 45-year-old male presents with acute chest pain. Most appropriate first investigation?
                </p>
                <div className="space-y-1.5">
                  {mobileAnswers.map((a) => (
                    <div
                      key={a.label}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs ${
                        a.selected
                          ? "bg-blue-600/20 border border-blue-500/50 text-sky-200"
                          : "bg-gray-800/40 border border-gray-700/40 text-gray-400"
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                        a.selected ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-400"
                      }`}>{a.label}</span>
                      {a.text}
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-4 py-3 border-t border-gray-800/60 bg-gray-950/40 grid grid-cols-3 divide-x divide-gray-800">
                {[
                  { label: "Correct", value: "22", color: "text-emerald-400" },
                  { label: "Wrong", value: "5", color: "text-red-400" },
                  { label: "Skipped", value: "3", color: "text-yellow-400" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="text-center py-1">
                    <div className={`text-sm font-bold tabular-nums ${color}`}>{value}</div>
                    <div className="text-[9px] text-gray-600 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
