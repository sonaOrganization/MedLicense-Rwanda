import { supabase } from "@/lib/supabase";
import { auth } from "@/lib/auth";
import { PracticalListClient } from "./PracticalListClient";

export default async function PracticalPage() {
  const session = await auth();
  const userId = session!.user.id;

  const { data: subscription } = await supabase
    .from("subscriptions").select("*").eq("user_id", userId).single();
  const isPremium = subscription?.status === "ACTIVE" || subscription?.status === "TRIAL";

  const licenseCategory = session?.user?.licenseCategory;

  let examsQuery = supabase
    .from("practical_exams")
    .select("*, category:categories(name_en, name_fr)")
    .eq("is_published", true);

  if (licenseCategory) {
    examsQuery = examsQuery.or(`license_category.eq.${licenseCategory},license_category.is.null`);
  }

  const [{ data: exams }, { data: attempts }] = await Promise.all([
    examsQuery.order("is_free", { ascending: false }).order("created_at", { ascending: false }),
    supabase
      .from("practical_attempts")
      .select("practical_exam_id, status, score, submitted_at")
      .eq("user_id", userId)
      .order("submitted_at", { ascending: false }),
  ]);

  // One relevant attempt per exam — prefer an in-progress attempt (to resume) over the most recent completed one.
  const attemptsByExam = new Map<string, { status: string; score: number | null }>();
  for (const a of attempts ?? []) {
    const existing = attemptsByExam.get(a.practical_exam_id);
    if (!existing) attemptsByExam.set(a.practical_exam_id, { status: a.status, score: a.score });
    else if (a.status === "IN_PROGRESS" && existing.status !== "IN_PROGRESS")
      attemptsByExam.set(a.practical_exam_id, { status: a.status, score: a.score });
  }

  const examList = (exams ?? []).map((e) => {
    const latest = attemptsByExam.get(e.id);
    return {
      ...e,
      attemptStatus: (latest?.status as "IN_PROGRESS" | "COMPLETED" | undefined) ?? null,
      lastScore: latest?.score ?? null,
    };
  });

  const completed = (attempts ?? []).filter((a) => a.status === "COMPLETED");
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
    <PracticalListClient
      exams={examList}
      isPremium={isPremium}
      casesReviewed={casesReviewed}
      accuracy={accuracy}
      streak={streak}
    />
  );
}
