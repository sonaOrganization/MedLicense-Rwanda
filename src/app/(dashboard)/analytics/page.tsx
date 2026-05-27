import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { AnalyticsClient } from "./AnalyticsClient";
import { calculatePercentage } from "@/lib/utils";

export default async function AnalyticsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const { data: attempts } = await supabase
    .from("exam_attempts")
    .select("*, exam:exams(passing_score, category:categories(name_en))")
    .eq("user_id", userId)
    .eq("status", "COMPLETED")
    .order("submitted_at", { ascending: true });

  const attemptList = attempts ?? [];
  const totalAttempts = attemptList.length;
  const avgScore = totalAttempts > 0
    ? attemptList.reduce((s: number, a: { score?: number }) => s + (a.score ?? 0), 0) / totalAttempts
    : 0;
  const passed = attemptList.filter(
    (a: { score?: number; exam: { passing_score: number } }) => (a.score ?? 0) >= a.exam.passing_score
  ).length;
  const passRate = calculatePercentage(passed, totalAttempts);

  const categoryMap: Record<string, { total: number; score: number; passed: number }> = {};
  for (const attempt of attemptList as { score?: number; exam: { passing_score: number; category: { name_en: string } } }[]) {
    const cat = attempt.exam.category.name_en;
    if (!categoryMap[cat]) categoryMap[cat] = { total: 0, score: 0, passed: 0 };
    categoryMap[cat].total++;
    categoryMap[cat].score += attempt.score ?? 0;
    if ((attempt.score ?? 0) >= attempt.exam.passing_score) categoryMap[cat].passed++;
  }

  const categoryStats = Object.entries(categoryMap).map(([name, stats]) => ({
    name,
    avgScore: stats.total > 0 ? Math.round(stats.score / stats.total) : 0,
    attempts: stats.total,
    passRate: calculatePercentage(stats.passed, stats.total),
  })).sort((a, b) => b.avgScore - a.avgScore);

  const attemptBars = (attemptList as { id: string; score?: number; exam: { passing_score: number } }[]).map((a) => ({
    id: a.id,
    score: a.score,
    passingScore: a.exam.passing_score,
  }));

  return (
    <AnalyticsClient
      totalAttempts={totalAttempts}
      avgScore={avgScore}
      passRate={passRate}
      passed={passed}
      categoryStats={categoryStats}
      attemptBars={attemptBars}
    />
  );
}
