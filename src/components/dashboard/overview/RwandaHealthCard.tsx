import { Heart, Users, Target, Globe } from "lucide-react";

const healthPillars = [
  {
    icon: Heart,
    title: "Universal Health Coverage",
    stat: "93%",
    desc: "Rwanda's UHC coverage — among the highest in Africa",
    color: "text-rose-500",
    bg: "bg-rose-50 dark:bg-rose-900/20",
  },
  {
    icon: Users,
    title: "Healthcare Workforce",
    stat: "4.45",
    desc: "Health workers per 1,000 people — growing every year",
    color: "text-indigo-500",
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
  },
  {
    icon: Target,
    title: "Shortage to Fill",
    stat: "~3,000",
    desc: "Licensed medical professionals needed by 2030",
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
  },
  {
    icon: Globe,
    title: "Vision 2050 Goal",
    stat: "Top 10",
    desc: "Rwanda aims to be in Africa's top 10 health systems",
    color: "text-purple-500",
    bg: "bg-purple-50 dark:bg-purple-900/20",
  },
];

export function RwandaHealthCard() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        {/* Rwanda flag */}
        <div className="flex h-5 w-8 rounded overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-700">
          <div className="flex-1 bg-sky-400" />
          <div className="flex-[2] bg-yellow-400" />
          <div className="flex-1 bg-green-500" />
        </div>
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Rwanda Health Snapshot
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {healthPillars.map(({ icon: Icon, title, stat, desc, color, bg }) => (
          <div key={title} className={`rounded-xl p-3 ${bg}`}>
            <div className="flex items-center gap-1.5 mb-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 leading-tight">{title}</span>
            </div>
            <div className={`text-2xl font-bold ${color} mb-0.5`}>{stat}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">{desc}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 italic text-center pt-1">
        "Ndi umunyarwanda" — Your license helps build a healthier Rwanda.
      </p>
    </div>
  );
}
