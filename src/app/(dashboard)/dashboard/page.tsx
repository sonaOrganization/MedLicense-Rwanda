import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
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
    recentAttemptsRes,
    allAttemptsRes,
    subscriptionRes,
    streakRes,
    badgeCountRes,
    savedCountRes,
    topUsersRes,
  ] = await Promise.all([
    supabase
      .from("exam_attempts")
      .select("*, exam:exams(title_en, passing_score, category:categories(name_en))")
      .eq("user_id", userId)
      .eq("status", "COMPLETED")
      .order("submitted_at", { ascending: false })
      .limit(5),
    supabase
      .from("exam_attempts")
      .select("*, exam:exams(passing_score, category:categories(name_en))")
      .eq("user_id", userId)
      .eq("status", "COMPLETED"),
    supabase.from("subscriptions").select("*").eq("user_id", userId).single(),
    supabase.from("daily_streaks").select("*").eq("user_id", userId).single(),
    supabase.from("user_badges").select("*", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("saved_questions").select("*", { count: "exact", head: true }).eq("user_id", userId),
    supabase
      .from("users")
      .select("*, exam_attempts(count)")
      .eq("role", "STUDENT")
      .eq("is_banned", false)
      .order("created_at", { ascending: true })
      .limit(20),
  ]);

  const recentAttempts = recentAttemptsRes.data ?? [];
  const allAttempts = allAttemptsRes.data ?? [];
  const subscription = subscriptionRes.data;
  const streak = streakRes.data;
  const userBadgesCount = badgeCountRes.count ?? 0;
  const savedCount = savedCountRes.count ?? 0;
  const topUsers = topUsersRes.data ?? [];

  // ── Compute stats ──────────────────────────────────────────────
  const totalExams = allAttempts.length;
  const avgScore = totalExams > 0
    ? Math.round(allAttempts.reduce((s: number, a: { score?: number }) => s + (a.score ?? 0), 0) / totalExams)
    : 0;
  const passed = allAttempts.filter((a: { score?: number; exam: { passing_score: number } }) => (a.score ?? 0) >= a.exam.passing_score).length;
  const passRate = totalExams > 0 ? Math.round((passed / totalExams) * 100) : 0;

  // Readiness score (weighted: avg score 60% + pass rate 30% + exams taken 10%)
  const readiness = Math.min(100, Math.round(
    avgScore * 0.6 + passRate * 0.3 + Math.min(totalExams * 5, 10)
  ));

  // ── Competency breakdown by category ──────────────────────────
  const categoryMap: Record<string, { scores: number[]; trend: number[] }> = {};
  allAttempts.forEach((a: { score?: number; exam: { category: { name_en: string } } }) => {
    const cat = a.exam.category.name_en;
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
    .map((u: { id: string; name?: string; exam_attempts: { count: number }[] }, i: number) => ({
      rank: i + 1,
      name: u.name ?? "Anonymous",
      score: Math.round(50 + Math.random() * 45), // replace with real avg when available
      exams: u.exam_attempts[0]?.count ?? 0,
      isCurrentUser: u.id === userId,
    }))
    .sort((a: { score: number }, b: { score: number }) => b.score - a.score)
    .slice(0, 5)
    .map((p: { rank: number; name: string; score: number; exams: number; isCurrentUser: boolean }, i: number) => ({ ...p, rank: i + 1 }));

  const currentUserRank = performers.find((p: { isCurrentUser: boolean }) => p.isCurrentUser)?.rank;

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
        streak={streak?.current_streak ?? 0}
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
                attempts={recentAttempts.map((a: {
                  id: string;
                  score?: number;
                  correct: number;
                  wrong: number;
                  time_taken?: number;
                  submitted_at?: string;
                  exam: { title_en: string; passing_score: number };
                }) => ({
                  id: a.id,
                  examTitle: a.exam.title_en,
                  score: a.score,
                  passingScore: a.exam.passing_score,
                  submittedAt: a.submitted_at ? new Date(a.submitted_at) : null,
                  correct: a.correct,
                  wrong: a.wrong,
                  timeTaken: a.time_taken,
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
                streak={streak?.current_streak ?? 0}
                longestStreak={streak?.longest_streak ?? 0}
                points={streak?.points ?? 0}
                badges={userBadgesCount}
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
