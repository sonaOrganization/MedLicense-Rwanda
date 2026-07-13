import { supabase } from "@/lib/supabase";
import { auth } from "@/lib/auth";
import { PracticalDashboardClient } from "@/components/practical/PracticalDashboardClient";

export default async function PracticalDashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const { data: subscription } = await supabase
    .from("subscriptions").select("*").eq("user_id", userId).single();
  const isPremium = subscription?.status === "ACTIVE" || subscription?.status === "TRIAL";

  const licenseCategory = session?.user?.licenseCategory;

  let examsQuery = supabase
    .from("practical_exams")
    .select("id", { count: "exact", head: true })
    .eq("is_published", true);
  if (licenseCategory) {
    examsQuery = examsQuery.or(`license_category.eq.${licenseCategory},license_category.is.null`);
  }

  const [{ count: casesAvailable }, { data: attempts }] = await Promise.all([
    examsQuery,
    supabase
      .from("practical_attempts")
      .select("id, practical_exam_id, status, score, submitted_at, exam:practical_exams(title_en, title_fr)")
      .eq("user_id", userId)
      .order("submitted_at", { ascending: false, nullsFirst: true }),
  ]);

  const allAttempts = attempts ?? [];
  const inProgress = allAttempts.find((a) => a.status === "IN_PROGRESS");
  const completed = allAttempts.filter((a) => a.status === "COMPLETED");

  function examTitle(a: (typeof allAttempts)[number]) {
    const exam = Array.isArray(a.exam) ? a.exam[0] : a.exam;
    return exam?.title_fr && session?.user?.language === "FR" ? exam.title_fr : exam?.title_en ?? "";
  }

  const resume = inProgress
    ? { examId: inProgress.practical_exam_id, examTitle: examTitle(inProgress) }
    : null;

  const recentAttempts = completed.slice(0, 5).map((a) => ({
    id: a.id,
    examTitle: examTitle(a),
    score: a.score,
    submittedAt: a.submitted_at,
  }));

  const casesReviewed = completed.length;
  const accuracy = completed.length > 0
    ? Math.round(completed.reduce((s, a) => s + (a.score ?? 0), 0) / completed.length)
    : null;

  const dateSet = new Set(
    completed
      .filter((a) => a.submitted_at)
      .map((a) => new Date(a.submitted_at as string).toISOString().slice(0, 10))
  );
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  let cursor = dateSet.has(todayStr) ? now : new Date(now.getTime() - ONE_DAY);
  let streak = 0;
  while (dateSet.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor = new Date(cursor.getTime() - ONE_DAY);
  }

  return (
    <PracticalDashboardClient
      userName={session?.user?.name ?? ""}
      isPremium={isPremium}
      casesAvailable={casesAvailable ?? 0}
      casesReviewed={casesReviewed}
      accuracy={accuracy}
      streak={streak}
      resume={resume}
      recentAttempts={recentAttempts}
    />
  );
}
