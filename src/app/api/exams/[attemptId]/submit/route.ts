import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { emitAutomationEvent } from "@/lib/automation";

export async function POST(req: NextRequest, { params }: { params: Promise<{ attemptId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { attemptId } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body.answers !== "object" || body.answers === null) {
    return NextResponse.json({ error: "Invalid answers" }, { status: 400 });
  }
  const answers = body.answers as Record<string, string | null>;
  const timedOut = body.timedOut === true;

  const { data: attempt } = await supabase
    .from("exam_attempts")
    .select("*, exam:exams(*, questions:exam_questions(*, question:questions(*, answers(*))))")
    .eq("id", attemptId)
    .eq("user_id", session.user.id)
    .single();

  if (!attempt || attempt.status !== "IN_PROGRESS") {
    return NextResponse.json({ error: "Attempt not found or already submitted" }, { status: 404 });
  }

  const questions = attempt.exam.questions.map((eq: { question: { id: string; answers: { id: string; is_correct: boolean }[] } }) => eq.question);
  let correct = 0;
  let wrong = 0;
  let skipped = 0;

  const answerRecords = questions.map((q: { id: string; answers: { id: string; is_correct: boolean }[] }) => {
    const requestedAnswerId = answers[q.id] ?? null;
    const selectedAnswerId = q.answers.some((answer) => answer.id === requestedAnswerId) ? requestedAnswerId : null;
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

  if (questions.length === 0) return NextResponse.json({ error: "Exam has no questions" }, { status: 400 });
  const score = attempt.exam.negative_marking
    ? Math.max(0, ((correct - wrong * 0.25) / questions.length) * 100)
    : (correct / questions.length) * 100;

  const timeTaken = Math.round((Date.now() - new Date(attempt.started_at).getTime()) / 1000);

  const { error: answersError } = await supabase.from("attempt_answers").upsert(answerRecords, {
    onConflict: "attempt_id,question_id",
  });
  if (answersError) return NextResponse.json({ error: "Could not save answers" }, { status: 500 });
  const { data: updatedAttempt, error: updateError } = await supabase
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
    .eq("id", attemptId)
    .eq("status", "IN_PROGRESS")
    .select("id")
    .maybeSingle();
  if (updateError) return NextResponse.json({ error: "Could not finalize attempt" }, { status: 500 });
  if (!updatedAttempt) return NextResponse.json({ error: "Attempt already submitted" }, { status: 409 });

  await emitAutomationEvent({
    type: "exam.completed",
    userId: session.user.id,
    data: { attemptId, examId: attempt.exam_id, score, correct, wrong, skipped, timedOut },
  }).catch((error) => console.error("[AUTOMATION_EXAM_COMPLETED]", error));

  return NextResponse.json({ ok: true, score, correct, wrong, skipped, attemptId });
}
