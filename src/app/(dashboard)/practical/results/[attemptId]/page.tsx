import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { PracticalSnapshot } from "@/lib/exam-types";
import { PracticalResultClient } from "./PracticalResultClient";

interface Props { params: Promise<{ attemptId: string }> }

export default async function PracticalResultPage({ params }: Props) {
  const { attemptId } = await params;
  const session = await auth();
  if (!session) redirect("/login");

  const { data: attempt } = await supabase
    .from("practical_attempts")
    .select(`
      *,
      exam:practical_exams(id, title_en, title_fr),
      answers:practical_attempt_answers(
        *,
        subquestion:practical_subquestions(*, group:practical_groups(*))
      )
    `)
    .eq("id", attemptId)
    .eq("user_id", session.user.id)
    .single();

  if (!attempt || attempt.status !== "COMPLETED") notFound();

  const snapshot = attempt.exam_snapshot as PracticalSnapshot | null;
  if (snapshot) {
    attempt.exam = snapshot;
    attempt.answers = attempt.answers.map((answer: { subquestion_id: string }) => {
      const group = snapshot.groups.find((g) => g.subquestions.some((s) => s.id === answer.subquestion_id));
      const sub = group?.subquestions.find((s) => s.id === answer.subquestion_id);
      return { ...answer, subquestion: sub ? { ...sub, group } : null };
    });
  }
  return <PracticalResultClient attempt={attempt} />;
}
