import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest, { params }: { params: Promise<{ attemptId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { attemptId } = await params;
  const { answers, timedOut } = await req.json();

  const { data: attempt } = await supabase
    .from("exam_attempts")
    .select("*, exam:exams(*, questions:exam_questions(*, question:questions(*, answers(*))))")
    .eq("id", attemptId)
    .eq("user_id", session.user.id)
    .single();

  if (!attempt || attempt.status === "COMPLETED") {
    return NextResponse.json({ error: "Attempt not found or already submitted" }, { status: 404 });
  }

  const questions = attempt.exam.questions.map((eq: { question: { id: string; answers: { id: string; is_correct: boolean }[] } }) => eq.question);
  let correct = 0;
  let wrong = 0;
  let skipped = 0;

  const answerRecords = questions.map((q: { id: string; answers: { id: string; is_correct: boolean }[] }) => {
    const selectedAnswerId = answers[q.id] ?? null;
    const correctAnswer = q.answers.find((a: { id: string; is_correct: boolean }) => a.is_correct);
    const isCorrect = selectedAnswerId ? selectedAnswerId === correctAnswer?.id : false;

    if (!selectedAnswerId) skipped++;
    else if (isCorrect) correct++;
    else wrong++;

    return {
      attempt_id: attemptId,
      question_id: q.id,
      answer_id: selectedAnswerId,
      is_correct: isCorrect,
    };
  });

  const score = attempt.exam.negative_marking
    ? Math.max(0, ((correct - wrong * 0.25) / questions.length) * 100)
    : (correct / questions.length) * 100;

  const timeTaken = Math.round((Date.now() - new Date(attempt.started_at).getTime()) / 1000);

  await supabase.from("attempt_answers").insert(answerRecords);
  await supabase
    .from("exam_attempts")
    .update({
      status: timedOut ? "TIMED_OUT" : "COMPLETED",
      score,
      correct,
      wrong,
      skipped,
      total_answered: correct + wrong,
      time_taken: timeTaken,
      submitted_at: new Date().toISOString(),
    })
    .eq("id", attemptId);

  return NextResponse.json({ ok: true, score, correct, wrong, skipped, attemptId });
}
