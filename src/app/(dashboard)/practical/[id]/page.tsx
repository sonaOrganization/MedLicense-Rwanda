import { notFound, redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { auth } from "@/lib/auth";
import { PracticalEngine } from "@/components/practical/PracticalEngine";
import { canAccessExam } from "@/lib/subscriptions";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PracticalExamPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/login");

  const { data: exam } = await supabase
    .from("practical_exams")
    .select("*, groups:practical_groups(*, subquestions:practical_subquestions(*))")
    .eq("id", id)
    .eq("is_published", true)
    .single();

  if (!exam) notFound();
  if (!(await canAccessExam(session.user.id, exam.is_free))) redirect("/subscription?required=true");

  const groups = [...(exam.groups ?? [])]
    .sort((a, b) => a.order - b.order)
    .map((g) => ({ ...g, subquestions: [...(g.subquestions ?? [])].sort((a, b) => a.order - b.order) }))
    .filter((g) => g.subquestions.length > 0);

  if (groups.length === 0) notFound();

  const totalSubquestions = groups.reduce((s, g) => s + g.subquestions.length, 0);

  // Resume an existing in-progress attempt, or start a fresh one.
  const { data: existing } = await supabase
    .from("practical_attempts")
    .select("*")
    .eq("user_id", session.user.id)
    .eq("practical_exam_id", exam.id)
    .eq("status", "IN_PROGRESS")
    .maybeSingle();

  const attempt = existing ?? (
    await supabase
      .from("practical_attempts")
      .insert({ user_id: session.user.id, practical_exam_id: exam.id, total_subquestions: totalSubquestions })
      .select()
      .single()
  ).data;

  if (!attempt) notFound();

  const savedState = attempt.saved_state as { groupIndex?: number; subIndex?: number; answers?: Record<string, boolean> } | null;

  const examData = {
    id: exam.id,
    titleEn: exam.title_en,
    titleFr: exam.title_fr ?? null,
    attemptId: attempt.id,
    groups: groups.map((g) => ({
      id: g.id,
      stemEn: g.stem_en,
      stemFr: g.stem_fr ?? null,
      imageUrl: g.image_url ?? null,
      subquestions: g.subquestions.map((s) => ({
        id: s.id,
        promptEn: s.prompt_en,
        promptFr: s.prompt_fr ?? null,
        modelAnswerEn: s.model_answer_en,
        modelAnswerFr: s.model_answer_fr ?? null,
      })),
    })),
    initialState: savedState
      ? {
          groupIndex: savedState.groupIndex ?? 0,
          subIndex: savedState.subIndex ?? 0,
          answers: savedState.answers ?? {},
        }
      : null,
  };

  return <PracticalEngine exam={examData} />;
}
