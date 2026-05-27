import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Target, Trophy, Calendar } from "lucide-react";
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
  const avgScore = totalAttempts > 0 ? attemptList.reduce((s: number, a: { score?: number }) => s + (a.score ?? 0), 0) / totalAttempts : 0;
  const passed = attemptList.filter((a: { score?: number; exam: { passing_score: number } }) => (a.score ?? 0) >= a.exam.passing_score).length;
  const passRate = calculatePercentage(passed, totalAttempts);

  // Category performance
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

  const summaryCards = [
    { label: "Total Exams", value: totalAttempts, icon: Target, color: "text-indigo-500" },
    { label: "Average Score", value: `${Math.round(avgScore)}%`, icon: TrendingUp, color: "text-green-500" },
    { label: "Pass Rate", value: `${passRate}%`, icon: Trophy, color: "text-yellow-500" },
    { label: "Exams Passed", value: passed, icon: Calendar, color: "text-purple-500" },
  ];

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Performance Analytics</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Track your progress and identify areas for improvement</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Performance by Category</CardTitle></CardHeader>
        <CardContent>
          {categoryStats.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Take some exams to see your category performance.</p>
          ) : (
            <div className="space-y-5">
              {categoryStats.map(({ name, avgScore, attempts, passRate }) => (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white text-sm">{name}</span>
                      <span className="text-xs text-gray-400 ml-2">{attempts} exams</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-gray-900 dark:text-white text-sm">{avgScore}%</span>
                      <span className="text-xs text-gray-400 ml-2">({passRate}% pass rate)</span>
                    </div>
                  </div>
                  <Progress value={avgScore} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {totalAttempts > 1 && (
        <Card>
          <CardHeader><CardTitle>Score Progression</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-32">
              {(attemptList as { id: string; score?: number; exam: { passing_score: number } }[]).slice(-20).map((a, i) => {
                const h = Math.round(((a.score ?? 0) / 100) * 100);
                return (
                  <div key={a.id} className="flex-1 flex flex-col items-center gap-1 group">
                    <div
                      className={`w-full rounded-t transition-all ${(a.score ?? 0) >= a.exam.passing_score ? "bg-green-400" : "bg-red-400"}`}
                      style={{ height: `${h}%` }}
                      title={`${Math.round(a.score ?? 0)}%`}
                    />
                    <span className="text-xs text-gray-400 hidden group-hover:block">{Math.round(a.score ?? 0)}%</span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">Last {Math.min(attemptList.length, 20)} exam scores</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
