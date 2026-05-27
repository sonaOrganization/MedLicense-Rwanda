"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReadinessGauge } from "@/components/dashboard/overview/ReadinessGauge";
import { LicenseFocusCard } from "@/components/dashboard/overview/LicenseFocusCard";
import { StudyStreakCard } from "@/components/dashboard/overview/StudyStreakCard";
import { RecentActivity } from "@/components/dashboard/overview/RecentActivity";
import { QuickActions } from "@/components/dashboard/overview/QuickActions";
import { ExamCountdown } from "@/components/dashboard/overview/ExamCountdown";
import { TopPerformers } from "@/components/dashboard/overview/TopPerformers";
import { WelcomeBanner } from "@/components/dashboard/overview/WelcomeBanner";
import { Target, TrendingUp, CheckCircle, BookOpen } from "lucide-react";
import { useLanguage } from "@/lib/language";
import { useT } from "@/lib/translations";

interface RecentAttempt {
  id: string;
  examTitle: string;
  score: number | null;
  passingScore: number;
  submittedAt: Date | null;
  correct: number;
  wrong: number;
  timeTaken: number | null;
}

interface Performer {
  rank: number;
  name: string;
  score: number;
  exams: number;
  isCurrentUser: boolean;
}

interface Props {
  userName: string;
  streak: number;
  subscriptionStatus: string;
  licenseCategory: string | null;
  totalExams: number;
  avgScore: number;
  passRate: number;
  passed: number;
  readiness: number;
  recentAttempts: RecentAttempt[];
  isPremium: boolean;
  savedCount: number;
  longestStreak: number;
  points: number;
  badges: number;
  performers: Performer[];
  currentUserRank?: number;
}

export function DashboardOverviewClient({
  userName, streak, subscriptionStatus, licenseCategory,
  totalExams, avgScore, passRate, passed, readiness,
  recentAttempts, isPremium, savedCount,
  longestStreak, points, badges,
  performers, currentUserRank,
}: Props) {
  const { language } = useLanguage();
  const T = useT(language);

  const statCards = [
    { icon: BookOpen,    label: T("dash_exams_taken"), value: totalExams,      color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
    { icon: Target,      label: T("dash_avg_score"),   value: `${avgScore}%`,  color: "text-blue-500",   bg: "bg-blue-50 dark:bg-blue-900/20" },
    { icon: CheckCircle, label: T("dash_pass_rate"),   value: `${passRate}%`,  color: "text-emerald-500",bg: "bg-emerald-50 dark:bg-emerald-900/20" },
    { icon: TrendingUp,  label: T("dash_passed"),      value: passed,          color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
  ];

  return (
    <div className="space-y-6 max-w-7xl pb-8">

      <WelcomeBanner
        name={userName}
        streak={streak}
        subscriptionStatus={subscriptionStatus}
        licenseCategory={licenseCategory}
      />

      {/* Stat Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ icon: Icon, label, value, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
                <div className={`p-2 rounded-lg ${bg}`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{T("dash_readiness")}</CardTitle>
              <p className="text-xs text-gray-400">{T("dash_readiness_sub")}</p>
            </CardHeader>
            <CardContent className="pt-0">
              <ReadinessGauge score={readiness} examsTaken={totalExams} avgScore={avgScore} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">{T("dash_recent")}</CardTitle>
                <p className="text-xs text-gray-400 mt-0.5">{T("dash_recent_sub")}</p>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <RecentActivity attempts={recentAttempts} />
            </CardContent>
          </Card>

          <LicenseFocusCard licenseCategory={licenseCategory} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{T("dash_quick")}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <QuickActions isPremium={isPremium} savedCount={savedCount} />
            </CardContent>
          </Card>

          <ExamCountdown />

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{T("dash_streak")}</CardTitle>
              <p className="text-xs text-gray-400">{T("dash_streak_sub")}</p>
            </CardHeader>
            <CardContent className="pt-0">
              <StudyStreakCard
                streak={streak}
                longestStreak={longestStreak}
                points={points}
                badges={badges}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{T("dash_top")}</CardTitle>
              <p className="text-xs text-gray-400">{T("dash_top_sub")}</p>
            </CardHeader>
            <CardContent className="pt-0">
              <TopPerformers performers={performers} currentUserRank={currentUserRank} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
