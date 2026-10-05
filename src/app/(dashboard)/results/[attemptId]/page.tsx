import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { TheorySnapshot } from "@/lib/exam-types";
import { ResultDetailClient } from "./ResultDetailClient";

interface Props { params: Promise<{ attemptId: string }> }

export default async function ResultDetailPage({ params }: Props) {
  const { attemptId } = await params;
  const session = await auth();
  if (!session) redirect("/login");

  const { data: attempt } = await supabase
    .from("exam_attempts")
    .select(`
      *,
      exam:exams(title_en, title_fr, passing_score),
      answers:attempt_answers(
        *,
        question:questions(*, answers(*)),
        answer:answers(*)
      )
    `)
    .eq("id", attemptId)
    .eq("user_id", session.user.id)
    .single();

  if (!attempt || !["COMPLETED", "TIMED_OUT"].includes(attempt.status)) notFound();

  const snapshot = attempt.exam_snapshot as TheorySnapshot | null;
  if (snapshot) {
    attempt.exam = snapshot;
    attempt.answers = attempt.answers.map((answer: { question_id: string; answer_id: string | null }) => {
      const question = snapshot.questions.find((q) => q.id === answer.question_id);
      return { ...answer, question, answer: question?.answers.find((a) => a.id === answer.answer_id) ?? null };
    });
  }
  return <ResultDetailClient attempt={attempt} />;
}
