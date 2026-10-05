import { hasPremiumAccess } from "@/lib/subscriptions";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { DashboardOverviewClient } from "./DashboardOverviewClient";

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
  ] = await Promise.all([
    supabase
      .from("exam_attempts")
      .select("*, exam:exams(title_en, passing_score, category:categories(name_en))")
      .eq("user_id", userId)
      .in("status", ["COMPLETED", "TIMED_OUT"])
      .order("submitted_at", { ascending: false })
      .limit(5),
    supabase
      .from("exam_attempts")
      .select("*, exam:exams(passing_score)")
      .eq("user_id", userId)
      .in("status", ["COMPLETED", "TIMED_OUT"]),
    supabase.from("subscriptions").select("*").eq("user_id", userId).single(),
    supabase.from("daily_streaks").select("*").eq("user_id", userId).single(),
    supabase.from("user_badges").select("*", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("saved_questions").select("*", { count: "exact", head: true }).eq("user_id", userId),
  ]);

  const recentAttempts = recentAttemptsRes.data ?? [];
  const allAttempts = allAttemptsRes.data ?? [];
  const subscription = subscriptionRes.data;
  const streak = streakRes.data;
  const userBadgesCount = badgeCountRes.count ?? 0;
  const savedCount = savedCountRes.count ?? 0;

  const totalExams = allAttempts.length;
  const avgScore = totalExams > 0
    ? Math.round(allAttempts.reduce((s: number, a: { score?: number }) => s + (a.score ?? 0), 0) / totalExams)
    : 0;
  const passed = allAttempts.filter(
    (a: { score?: number; exam: { passing_score: number } }) => (a.score ?? 0) >= a.exam.passing_score
  ).length;
  const passRate = totalExams > 0 ? Math.round((passed / totalExams) * 100) : 0;
  const readiness = Math.min(100, Math.round(avgScore * 0.6 + passRate * 0.3 + Math.min(totalExams * 5, 10)));

  const isPremium = await hasPremiumAccess(session!.user.id);

  return (
    <DashboardOverviewClient
      userName={session!.user.name?.split(" ")[0] ?? "Student"}
      streak={streak?.current_streak ?? 0}
      subscriptionStatus={subscription?.status ?? "FREE"}
      licenseCategory={session!.user.licenseCategory ?? null}
      totalExams={totalExams}
      avgScore={avgScore}
      passRate={passRate}
      passed={passed}
      readiness={readiness}
      recentAttempts={recentAttempts.map((a: {
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
        score: a.score ?? null,
        passingScore: a.exam.passing_score,
        submittedAt: a.submitted_at ? new Date(a.submitted_at) : null,
        correct: a.correct,
        wrong: a.wrong,
        timeTaken: a.time_taken ?? null,
      }))}
      isPremium={isPremium}
      savedCount={savedCount}
      longestStreak={streak?.longest_streak ?? 0}
      points={streak?.points ?? 0}
      badges={userBadgesCount}
    />
  );
}
