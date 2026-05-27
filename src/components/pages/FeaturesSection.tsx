import { Timer, BarChart2, BookOpen, Video, Shield, Smartphone, ArrowRight } from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: Timer,
    title: "Real Exam Simulation",
    description: "Timed, proctored sessions mirroring the real licensing exam format — auto-submit, flag & review, randomized shuffling.",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    iconColor: "text-blue-700 dark:text-blue-400",
  },
  {
    icon: BarChart2,
    title: "Performance Analytics",
    description: "Score breakdowns by category, difficulty, and topic. Track your trajectory and pinpoint where to focus.",
    bg: "bg-purple-50 dark:bg-purple-950/40",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
  {
    icon: BookOpen,
    title: "2,500+ Questions",
    description: "Expertly curated question bank spanning all core competency areas. Each question includes a detailed explanation.",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: Video,
    title: "Video Tutorials",
    description: "High-quality video lessons from experienced Rwandan medical professionals. Watch at your own pace, anytime.",
    bg: "bg-yellow-50 dark:bg-yellow-950/40",
    iconColor: "text-yellow-600 dark:text-yellow-500",
  },
  {
    icon: Shield,
    title: "Secure Environment",
    description: "Anti-cheat mechanisms ensure your practice scores genuinely reflect your exam readiness.",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
  {
    icon: Smartphone,
    title: "Study Anywhere",
    description: "Mobile-first design — study on phone, tablet, or desktop with your saved notes always accessible.",
    bg: "bg-cyan-50 dark:bg-cyan-950/40",
    iconColor: "text-cyan-600 dark:text-cyan-400",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-14 sm:py-20 lg:py-28 bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-400 mb-2 sm:mb-3">
            Platform Features
          </p>
          <h2 className="text-2xl sm:text-4xl lg:text-[42px] font-extrabold text-gray-900 dark:text-white leading-tight mb-3 sm:mb-4">
            Everything You Need to Pass
          </h2>
          <p className="text-sm sm:text-lg text-gray-500 dark:text-gray-400 leading-relaxed">
            Built for medical license exam candidates — every tool to study efficiently and walk in with confidence.
          </p>
        </div>

        {/* Feature grid — 2 cols on mobile, 3 on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {features.map(({ icon: Icon, title, description, bg, iconColor }) => (
            <div
              key={title}
              className="group p-4 sm:p-7 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 bg-white dark:bg-gray-900 hover:shadow-xl hover:shadow-gray-100/80 dark:hover:shadow-none transition-all duration-300"
            >
              <div className={`inline-flex p-2.5 sm:p-3 rounded-xl ${bg} mb-3 sm:mb-5`}>
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconColor}`} />
              </div>
              <h3 className="text-[13px] sm:text-[16px] font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 leading-snug">{title}</h3>
              <p className="text-[11px] sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 sm:mt-14 text-center">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 text-blue-700 dark:text-blue-400 font-semibold text-sm sm:text-base hover:underline underline-offset-4"
          >
            Start your free trial today
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
