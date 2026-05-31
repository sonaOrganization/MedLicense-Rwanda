import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { AnalyticsClient } from "./AnalyticsClient";
import { calculatePercentage } from "@/lib/utils";

export default async function AnalyticsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const { data: attempts } = await supabase
    .from("exam_attempts")
    .select("*, exam:exams(title_en, passing_score, category:categories(name_en))")
    .eq("user_id", userId)
    .eq("status", "COMPLETED")
    .order("submitted_at", { ascending: true });

  const attemptList = (attempts ?? []).filter(
    // Guard: skip rows where exam was somehow deleted
    (a: { exam: unknown }) => a.exam != null
  );

  const totalAttempts = attemptList.length;

  const avgScore = totalAttempts > 0
    ? attemptList.reduce((s: number, a: { score?: number | null }) => s + (a.score ?? 0), 0) / totalAttempts
    : 0;

  const passed = attemptList.filter(
    (a: { score?: number | null; exam: { passing_score: number } }) =>
      (a.score ?? 0) >= (a.exam?.passing_score ?? 70)
  ).length;

  const passRate = calculatePercentage(passed, totalAttempts);

  // Category breakdown — handle null category gracefully
  const categoryMap: Record<string, { total: number; score: number; passed: number }> = {};
  for (const attempt of attemptList as {
    score?: number | null;
    exam: {
      title_en: string;
      passing_score: number;
      category: { name_en: string } | { name_en: string }[] | null;
    };
  }[]) {
    // category may be null (no category assigned) or an array (Supabase join quirk)
    const rawCat = attempt.exam?.category;
    const catObj = Array.isArray(rawCat) ? rawCat[0] : rawCat;
    const cat = catObj?.name_en ?? attempt.exam?.title_en ?? "Uncategorised";

    if (!categoryMap[cat]) categoryMap[cat] = { total: 0, score: 0, passed: 0 };
    categoryMap[cat].total++;
    categoryMap[cat].score += attempt.score ?? 0;
    if ((attempt.score ?? 0) >= (attempt.exam?.passing_score ?? 70)) categoryMap[cat].passed++;
  }

  const categoryStats = Object.entries(categoryMap).map(([name, stats]) => ({
    name,
    avgScore: stats.total > 0 ? Math.round(stats.score / stats.total) : 0,
    attempts: stats.total,
    passRate: calculatePercentage(stats.passed, stats.total),
  })).sort((a, b) => b.avgScore - a.avgScore);

  const attemptBars = (attemptList as {
    id: string;
    score?: number | null;
    exam: { passing_score: number };
  }[]).map((a) => ({
    id: a.id,
    score: a.score ?? 0,
    passingScore: a.exam?.passing_score ?? 70,
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
