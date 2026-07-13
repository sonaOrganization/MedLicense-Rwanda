import { supabase } from "@/lib/supabase";
import { auth } from "@/lib/auth";
import { PracticalListClient } from "./PracticalListClient";

export default async function PracticalExamsPage() {
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

  return <PracticalListClient exams={examList} isPremium={isPremium} />;
}
