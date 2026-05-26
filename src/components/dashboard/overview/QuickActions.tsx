import Link from "next/link";
import { FileText, Zap, Bookmark, Video, BarChart2, CreditCard } from "lucide-react";

interface QuickActionsProps {
  isPremium: boolean;
  savedCount: number;
}

export function QuickActions({ isPremium, savedCount }: QuickActionsProps) {
  const actions = [
    {
      icon: Zap,
      label: "Daily Quiz",
      desc: "5-min practice",
      href: "/exams?mode=daily",
      color: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
    },
    {
      icon: FileText,
      label: "Mock Exam",
      desc: "Full simulation",
      href: "/exams",
      color: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
    },
    {
      icon: Bookmark,
      label: "Saved",
      desc: `${savedCount} questions`,
      href: "/saved",
      color: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
    },
    {
      icon: Video,
      label: "Tutorials",
      desc: "Watch & learn",
      href: "/tutorials",
      color: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    },
    {
      icon: BarChart2,
      label: "Analytics",
      desc: "Your progress",
      href: "/analytics",
      color: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    },
    {
      icon: CreditCard,
      label: isPremium ? "Subscription" : "Go Premium",
      desc: isPremium ? "Active plan" : "Unlock all",
      href: "/subscription",
      color: isPremium
        ? "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"
        : "bg-gradient-to-br from-indigo-600 to-purple-600 text-white border-transparent",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {actions.map(({ icon: Icon, label, desc, href, color }) => (
        <Link
          key={label}
          href={href}
          className={`flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl border text-center hover:scale-105 transition-all duration-200 cursor-pointer ${color}`}
        >
          <Icon className="w-5 h-5" />
          <div>
            <div className="text-xs font-semibold leading-tight">{label}</div>
            <div className="text-xs opacity-70 mt-0.5 leading-tight">{desc}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
