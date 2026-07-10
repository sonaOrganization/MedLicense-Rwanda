"use client";
import Link from "next/link";
import { ReadinessGauge } from "@/components/dashboard/overview/ReadinessGauge";
import { LicenseFocusCard } from "@/components/dashboard/overview/LicenseFocusCard";
import { RecentActivity } from "@/components/dashboard/overview/RecentActivity";
import { ExamCountdown } from "@/components/dashboard/overview/ExamCountdown";
import { WelcomeBanner } from "@/components/dashboard/overview/WelcomeBanner";
import { SessionTypeModal, SessionChoicePill } from "@/components/dashboard/overview/SessionTypeModal";
import { Target, TrendingUp, CheckCircle, BookOpen, ArrowRight, Zap, FileText, Bookmark, Video, BarChart2, CreditCard } from "lucide-react";
import { useLanguage } from "@/lib/language";
import { useT } from "@/lib/translations";
import { cn } from "@/lib/utils";

interface RecentAttempt {
  id: string; examTitle: string; score: number | null;
  passingScore: number; submittedAt: Date | null;
  correct: number; wrong: number; timeTaken: number | null;
}

interface Props {
  userName: string; streak: number; subscriptionStatus: string;
  licenseCategory: string | null; totalExams: number; avgScore: number;
  passRate: number; passed: number; readiness: number;
  recentAttempts: RecentAttempt[]; isPremium: boolean; savedCount: number;
  longestStreak: number; points: number; badges: number;
}

export function DashboardOverviewClient({
  userName, streak, subscriptionStatus, licenseCategory,
  totalExams, avgScore, passRate, passed, readiness,
  recentAttempts, isPremium, savedCount,
}: Props) {
  const { language } = useLanguage();
  const T = useT(language);

  const statCards = [
    { icon: BookOpen,    label: T("dash_exams_taken"), value: totalExams,      color: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
    { icon: Target,      label: T("dash_avg_score"),   value: `${avgScore}%`,  color: "text-blue-500",   bg: "bg-blue-500/10",   border: "border-blue-500/20"   },
    { icon: CheckCircle, label: T("dash_pass_rate"),   value: `${passRate}%`,  color: "text-emerald-500",bg: "bg-emerald-500/10",border: "border-emerald-500/20"},
    { icon: TrendingUp,  label: T("dash_passed"),      value: passed,          color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  ];

  const quickActions = [
    { icon: Zap,       label: T("qa_daily"),       href: "/exams?mode=daily", color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
    { icon: FileText,  label: T("qa_mock"),        href: "/exams",             color: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
    { icon: Bookmark,  label: T("qa_saved"),       href: "/saved",             color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" },
    { icon: Video,     label: T("qa_tutorials"),   href: "/tutorials",         color: "text-emerald-500",bg: "bg-emerald-500/10",border: "border-emerald-500/20"},
    { icon: BarChart2, label: T("qa_analytics"),   href: "/analytics",         color: "text-blue-500",   bg: "bg-blue-500/10",   border: "border-blue-500/20"   },
    {
      icon: CreditCard,
      label: isPremium ? T("qa_subscription") : T("qa_premium"),
      href: "/subscription",
      color: isPremium ? "text-gray-400" : "text-white",
      bg:    isPremium ? "bg-gray-500/10"  : "bg-gradient-to-br from-indigo-600 to-purple-600",
      border: isPremium ? "border-gray-600/30" : "border-transparent",
    },
  ];

  return (
    <div className="pb-6 space-y-4 sm:space-y-6 max-w-7xl">

      {/* ── Welcome Banner ── */}
      <SessionTypeModal />
      <WelcomeBanner
        name={userName}
        streak={streak}
        subscriptionStatus={subscriptionStatus}
        licenseCategory={licenseCategory}
      />
      <SessionChoicePill className="-mt-2" />

      {/* ── Stat chips ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        {statCards.map(({ icon: Icon, label, value, color, bg, border }) => (
          <div
            key={label}
            className={cn("rounded-2xl border p-3.5 sm:p-5 flex flex-col gap-2", bg, border,
              "bg-white dark:bg-gray-900/80")}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 leading-tight">{label}</span>
              <div className={cn("w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center flex-shrink-0", bg)}>
                <Icon className={cn("w-3.5 h-3.5", color)} />
              </div>
            </div>
            <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tabular-nums leading-none">{value}</span>
          </div>
        ))}
      </div>

      {/* ── Mobile: Quick Actions (2×3 grid) — hidden on lg+ (shown in sidebar column) ── */}
      <div className="lg:hidden">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3 px-0.5">{T("dash_quick")}</h2>
        <div className="grid grid-cols-3 gap-2">
          {quickActions.map(({ icon: Icon, label, href, color, bg, border }) => (
            <Link
              key={label}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-2xl border p-3 text-center transition-all active:scale-95",
                bg, border
              )}
            >
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", bg)}>
                <Icon className={cn("w-4.5 h-4.5", color)} />
              </div>
              <span className={cn("text-[11px] font-semibold leading-tight", color)}>{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Main content: mobile = single col, desktop = 2/3 + 1/3 ── */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">

        {/* Left column (takes 2/3 on desktop) */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">

          {/* Readiness card */}
          <div className="bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{T("dash_readiness")}</p>
                <p className="text-xs text-gray-400 mt-0.5">{T("dash_readiness_sub")}</p>
              </div>
              <span className={cn(
                "text-lg font-black tabular-nums",
                readiness >= 70 ? "text-emerald-500" : readiness >= 40 ? "text-amber-500" : "text-red-500"
              )}>{readiness}%</span>
            </div>
            <div className="px-4 sm:px-6 py-4">
              <ReadinessGauge score={readiness} examsTaken={totalExams} avgScore={avgScore} />
            </div>
          </div>

          {/* Recent activity */}
          <div className="bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{T("dash_recent")}</p>
                <p className="text-xs text-gray-400 mt-0.5">{T("dash_recent_sub")}</p>
              </div>
              <Link href="/results" className="flex items-center gap-1 text-xs font-semibold text-indigo-500 hover:text-indigo-600 transition-colors">
                {T("nav_results")} <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="px-4 sm:px-6 py-2">
              <RecentActivity attempts={recentAttempts} />
            </div>
          </div>

          {/* License focus — desktop */}
          <div className="hidden sm:block">
            <LicenseFocusCard licenseCategory={licenseCategory} />
          </div>
        </div>

        {/* Right column (1/3 on desktop, stacked below on mobile) */}
        <div className="space-y-4 sm:space-y-6">

          {/* Quick actions — desktop only (mobile version is above) */}
          <div className="hidden lg:block bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <p className="text-sm font-bold text-gray-900 dark:text-white">{T("dash_quick")}</p>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-3 gap-2.5">
                {quickActions.map(({ icon: Icon, label, href, color, bg, border }) => (
                  <Link key={label} href={href}
                    className={cn("flex flex-col items-center gap-2 p-3.5 rounded-xl border text-center hover:scale-105 transition-all duration-150 cursor-pointer", bg, border)}
                  >
                    <Icon className={cn("w-5 h-5", color)} />
                    <span className={cn("text-[10.5px] font-semibold leading-tight", color)}>{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Exam countdown */}
          <ExamCountdown />

          {/* License focus — mobile */}
          <div className="sm:hidden">
            <LicenseFocusCard licenseCategory={licenseCategory} />
          </div>
        </div>
      </div>
    </div>
  );
}
