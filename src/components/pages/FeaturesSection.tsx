import { Timer, BarChart2, BookOpen, Video, Shield, Smartphone, ArrowRight } from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: Timer,
    title: "Real Exam Simulation",
    description: "Timed, proctored exam sessions that exactly mirror the RMDC format. Auto-submit, flag & review, and randomized shuffling built in.",
    accent: "from-blue-500 to-blue-700",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    iconColor: "text-blue-700 dark:text-blue-400",
  },
  {
    icon: BarChart2,
    title: "Performance Analytics",
    description: "Granular score breakdowns by category, difficulty, and topic. Track your trajectory and identify exactly where to focus.",
    accent: "from-purple-500 to-purple-700",
    bg: "bg-purple-50 dark:bg-purple-950/40",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
  {
    icon: BookOpen,
    title: "2,500+ Questions",
    description: "Expertly curated question bank spanning all six RMDC core competency areas. Each question includes a detailed explanation.",
    accent: "from-emerald-500 to-emerald-700",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: Video,
    title: "Expert Video Tutorials",
    description: "High-quality video lessons from experienced Rwandan medical professionals. Watch, pause, rewind — study at your own pace.",
    accent: "from-yellow-500 to-amber-600",
    bg: "bg-yellow-50 dark:bg-yellow-950/40",
    iconColor: "text-yellow-600 dark:text-yellow-500",
  },
  {
    icon: Shield,
    title: "Integrity & Security",
    description: "Secure exam environment with anti-cheat mechanisms so your practice scores reflect your true readiness.",
    accent: "from-rose-500 to-red-600",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
  {
    icon: Smartphone,
    title: "Study Anywhere",
    description: "Fully responsive mobile-first design. Study on phone, tablet, or desktop — even with saved notes offline.",
    accent: "from-cyan-500 to-sky-600",
    bg: "bg-cyan-50 dark:bg-cyan-950/40",
    iconColor: "text-cyan-600 dark:text-cyan-400",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 lg:py-32 bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-400 mb-3">
            Platform Features
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-gray-900 dark:text-white leading-tight mb-4">
            Everything You Need to Pass
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed">
            Built specifically for RMDC exam candidates, with every tool needed to study efficiently and walk in on exam day with confidence.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, description, bg, iconColor }) => (
            <div
              key={title}
              className="group relative p-7 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 bg-white dark:bg-gray-900 hover:shadow-xl hover:shadow-gray-100/80 dark:hover:shadow-none transition-all duration-300"
            >
              <div className={`inline-flex p-3 rounded-xl ${bg} mb-5`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
              <h3 className="text-[16px] font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>

        {/* Bottom CTA link */}
        <div className="mt-14 text-center">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 text-blue-700 dark:text-blue-400 font-semibold hover:underline underline-offset-4"
          >
            Start your free trial today
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
