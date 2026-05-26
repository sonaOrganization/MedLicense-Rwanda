import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WelcomeBanner } from "@/components/dashboard/overview/WelcomeBanner";
import { ReadinessGauge } from "@/components/dashboard/overview/ReadinessGauge";
import { CompetencyTracker } from "@/components/dashboard/overview/CompetencyTracker";
import { RwandaHealthCard } from "@/components/dashboard/overview/RwandaHealthCard";
import { StudyStreakCard } from "@/components/dashboard/overview/StudyStreakCard";
import { RecentActivity } from "@/components/dashboard/overview/RecentActivity";
import { QuickActions } from "@/components/dashboard/overview/QuickActions";
import { ExamCountdown } from "@/components/dashboard/overview/ExamCountdown";
import { TopPerformers } from "@/components/dashboard/overview/TopPerformers";
import { Target, TrendingUp, CheckCircle, BookOpen } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [
    recentAttempts,
    allAttempts,
    subscription,
    streak,
    userBadges,
    savedCount,
    topUsers,
  ] = await Promise.all([
    prisma.examAttempt.findMany({
      where: { userId, status: "COMPLETED" },
      orderBy: { submittedAt: "desc" },
      take: 5,
      include: {
        exam: { select: { titleEn: true, passingScore: true, category: { select: { nameEn: true } } } },
      },
    }),
    prisma.examAttempt.findMany({
      where: { userId, status: "COMPLETED" },
      include: {
        exam: { select: { passingScore: true, category: { select: { nameEn: true } } } },
      },
    }),
    prisma.subscription.findUnique({ where: { userId } }),
    prisma.dailyStreak.findUnique({ where: { userId } }),
    prisma.userBadge.count({ where: { userId } }),
    prisma.savedQuestion.count({ where: { userId } }),
    prisma.user.findMany({
      where: { role: "STUDENT", isBanned: false },
      include: { _count: { select: { examAttempts: true } } },
      orderBy: { createdAt: "asc" },
      take: 20,
    }),
  ]);

  // ── Compute stats ──────────────────────────────────────────────
  const totalExams = allAttempts.length;
  const avgScore = totalExams > 0
    ? Math.round(allAttempts.reduce((s, a) => s + (a.score ?? 0), 0) / totalExams)
    : 0;
  const passed = allAttempts.filter((a) => (a.score ?? 0) >= a.exam.passingScore).length;
  const passRate = totalExams > 0 ? Math.round((passed / totalExams) * 100) : 0;

  // Readiness score (weighted: avg score 60% + pass rate 30% + exams taken 10%)
  const readiness = Math.min(100, Math.round(
    avgScore * 0.6 + passRate * 0.3 + Math.min(totalExams * 5, 10)
  ));

  // ── Competency breakdown by category ──────────────────────────
  const categoryMap: Record<string, { scores: number[]; trend: number[] }> = {};
  allAttempts.forEach((a) => {
    const cat = a.exam.category.nameEn;
    if (!categoryMap[cat]) categoryMap[cat] = { scores: [], trend: [] };
    categoryMap[cat].scores.push(a.score ?? 0);
  });

  const competencies = Object.entries(categoryMap).map(([name, { scores }]) => {
    const avg = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
    const recent = scores.slice(-3);
    const older = scores.slice(0, -3);
    const recentAvg = recent.length ? recent.reduce((s, v) => s + v, 0) / recent.length : avg;
    const olderAvg = older.length ? older.reduce((s, v) => s + v, 0) / older.length : avg;
    return {
      name,
      nameFr: name,
      score: avg,
      attempts: scores.length,
      icon: "📚",
      trend: recentAvg > olderAvg + 3 ? "up" : recentAvg < olderAvg - 3 ? "down" : "neutral",
    } as const;
  });

  // ── Top performers leaderboard (mock scoring via attempts count) ──
  const performers = topUsers
    .map((u, i) => ({
      rank: i + 1,
      name: u.name ?? "Anonymous",
      score: Math.round(50 + Math.random() * 45), // replace with real avg when available
      exams: u._count.examAttempts,
      isCurrentUser: u.id === userId,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((p, i) => ({ ...p, rank: i + 1 }));

  const currentUserRank = performers.find((p) => p.isCurrentUser)?.rank;

  // ── Summary stat cards ────────────────────────────────────────
  const statCards = [
    { icon: BookOpen, label: "Exams Taken", value: totalExams, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
    { icon: Target, label: "Avg Score", value: `${avgScore}%`, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { icon: CheckCircle, label: "Pass Rate", value: `${passRate}%`, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
    { icon: TrendingUp, label: "Passed", value: passed, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
  ];

  const isPremium = subscription?.status === "ACTIVE" || subscription?.status === "TRIAL";

  return (
    <div className="space-y-6 max-w-7xl pb-8">

      {/* ── Welcome Banner ── */}
      <WelcomeBanner
        name={session!.user.name?.split(" ")[0] ?? "Student"}
        streak={streak?.currentStreak ?? 0}
        subscriptionStatus={subscription?.status ?? "FREE"}
      />

      {/* ── Stat Row ── */}
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

      {/* ── Main Grid ── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Left Column (2/3) ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Readiness + Competency */}
          <div className="grid sm:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Exam Readiness</CardTitle>
                <p className="text-xs text-gray-400">Based on your performance history</p>
              </CardHeader>
              <CardContent className="pt-0">
                <ReadinessGauge score={readiness} examsTaken={totalExams} avgScore={avgScore} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Core Competencies</CardTitle>
                <p className="text-xs text-gray-400">RMDC exam subject areas</p>
              </CardHeader>
              <CardContent className="pt-0">
                <CompetencyTracker data={competencies} />
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent Exams</CardTitle>
                <p className="text-xs text-gray-400 mt-0.5">Your last 5 practice sessions</p>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <RecentActivity
                attempts={recentAttempts.map((a) => ({
                  id: a.id,
                  examTitle: a.exam.titleEn,
                  score: a.score,
                  passingScore: a.exam.passingScore,
                  submittedAt: a.submittedAt,
                  correct: a.correct,
                  wrong: a.wrong,
                  timeTaken: a.timeTaken,
                }))}
              />
            </CardContent>
          </Card>

          {/* Rwanda Health Context */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Why Your License Matters</CardTitle>
              <p className="text-xs text-gray-400">Rwanda's healthcare at a glance</p>
            </CardHeader>
            <CardContent className="pt-0">
              <RwandaHealthCard />
            </CardContent>
          </Card>
        </div>

        {/* ── Right Column (1/3) ── */}
        <div className="space-y-6">

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <QuickActions isPremium={isPremium} savedCount={savedCount} />
            </CardContent>
          </Card>

          {/* Exam Countdown */}
          <ExamCountdown />

          {/* Study Streak */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Study Streak</CardTitle>
              <p className="text-xs text-gray-400">Keep the momentum going</p>
            </CardHeader>
            <CardContent className="pt-0">
              <StudyStreakCard
                streak={streak?.currentStreak ?? 0}
                longestStreak={streak?.longestStreak ?? 0}
                points={streak?.points ?? 0}
                badges={userBadges}
              />
            </CardContent>
          </Card>

          {/* Leaderboard */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top Students</CardTitle>
              <p className="text-xs text-gray-400">This month's leaderboard</p>
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
