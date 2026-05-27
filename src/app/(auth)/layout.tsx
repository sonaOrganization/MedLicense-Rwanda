import Link from "next/link";
import { Stethoscope, CheckCircle, ArrowLeft } from "lucide-react";

const features = [
  "2,500+ curated RMDC practice questions",
  "Full timed mock exam simulations",
  "Performance analytics & competency tracking",
  "HD video tutorials from medical experts",
  "Study streaks, badges & leaderboard",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">

      {/* ── Left Panel ── */}
      <div className="hidden lg:flex flex-col w-[480px] flex-shrink-0 relative overflow-hidden bg-[#0b0f1e]">
        {/* Background glows */}
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-blue-800/25 rounded-full blur-[80px]" />
        <div className="absolute bottom-1/4 right-0 w-56 h-56 bg-cyan-800/20 rounded-full blur-[80px]" />

        {/* Rwanda flag strip */}
        <div className="absolute top-0 left-0 right-0 h-0.5 flex">
          <div className="flex-1 bg-sky-400" />
          <div className="flex-[2] bg-yellow-400" />
          <div className="flex-1 bg-green-500" />
        </div>

        {/* Content */}
        <div className="relative flex flex-col h-full px-10 py-10">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 mb-auto group">
            <div className="w-9 h-9 rounded-xl bg-blue-700 flex items-center justify-center shadow-lg shadow-blue-900/50">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div className="leading-none">
              <span className="font-bold text-xl text-white tracking-tight">RMDC</span>
              <span className="font-bold text-xl text-cyan-300 tracking-tight"> Prep</span>
            </div>
          </Link>

          {/* Main copy */}
          <div className="py-12">
            <div className="inline-flex items-center gap-2 border border-cyan-500/30 bg-cyan-500/10 rounded-full px-3 py-1 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-semibold text-cyan-300 tracking-wide">Rwanda's #1 Medical Exam Prep</span>
            </div>

            <h2 className="text-3xl font-extrabold text-white leading-snug mb-4">
              Your path to professional{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-cyan-300">
                licensure
              </span>{" "}
              starts here.
            </h2>

            <p className="text-gray-400 text-[15px] leading-relaxed mb-8">
              Join thousands of aspiring physicians, nurses, and clinical officers preparing for the RMDC exam with confidence.
            </p>

            <div className="space-y-3">
              {features.map((f) => (
                <div key={f} className="flex items-start gap-3">
                  <CheckCircle className="w-4.5 h-4.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className="text-[14px] text-gray-300">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial */}
          <div className="bg-gray-800/40 border border-gray-700/40 rounded-2xl p-5">
            <p className="text-sm text-gray-300 italic leading-relaxed mb-3">
              "Passed the RMDC on my first attempt. The exam simulation was almost identical to the real thing."
            </p>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-blue-700 flex items-center justify-center text-white text-xs font-bold">
                JP
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Dr. Jean Pierre M.</p>
                <p className="text-[10px] text-gray-500">RMDC Graduate, 2024</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-700 mt-6" suppressHydrationWarning>© {new Date().getFullYear()} RMDC Exam Prep · Kigali, Rwanda</p>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-950">

        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-6 pt-6 pb-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-[16px] text-gray-900 dark:text-white">
              RMDC <span className="text-blue-700">Prep</span>
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Link>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-[400px]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
