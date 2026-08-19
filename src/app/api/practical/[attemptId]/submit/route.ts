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
  const answers = body.answers as Record<string, boolean>;

  const { data: attempt } = await supabase
    .from("practical_attempts")
    .select("*, exam:practical_exams(*, groups:practical_groups(*, subquestions:practical_subquestions(id)))")
    .eq("id", attemptId)
    .eq("user_id", session.user.id)
    .single();

  if (!attempt || attempt.status !== "IN_PROGRESS") {
    return NextResponse.json({ error: "Attempt not found or already submitted" }, { status: 404 });
  }

  const subquestionIds: string[] = attempt.exam.groups.flatMap(
    (g: { subquestions: { id: string }[] }) => g.subquestions.map((s) => s.id)
  );

  let correct = 0;
  let incorrect = 0;
  const answerRecords = subquestionIds
    .filter((subId) => subId in answers)
    .map((subId) => {
      const isCorrect = Boolean(answers[subId]);
      if (isCorrect) correct++; else incorrect++;
      return { attempt_id: attemptId, subquestion_id: subId, is_correct: isCorrect };
    });

  const reviewedCount = answerRecords.length;
  const score = reviewedCount > 0 ? (correct / reviewedCount) * 100 : 0;
  const timeTaken = Math.round((Date.now() - new Date(attempt.started_at).getTime()) / 1000);

  if (answerRecords.length > 0) {
    const { error } = await supabase.from("practical_attempt_answers").upsert(answerRecords, {
      onConflict: "attempt_id,subquestion_id",
    });
    if (error) return NextResponse.json({ error: "Could not save answers" }, { status: 500 });
  }

  const { data: updatedAttempt, error: updateError } = await supabase
    .from("practical_attempts")
    .update({
      status: "COMPLETED",
      reviewed_count: reviewedCount,
      correct_count: correct,
      incorrect_count: incorrect,
      score,
      time_taken: timeTaken,
      submitted_at: new Date().toISOString(),
      saved_state: null,
    })
    .eq("id", attemptId)
    .eq("status", "IN_PROGRESS")
    .select("id")
    .maybeSingle();
  if (updateError) return NextResponse.json({ error: "Could not finalize attempt" }, { status: 500 });
  if (!updatedAttempt) return NextResponse.json({ error: "Attempt already submitted" }, { status: 409 });

  await emitAutomationEvent({
    type: "practical.completed",
    userId: session.user.id,
    data: { attemptId, practicalExamId: attempt.practical_exam_id, score, correct, incorrect, reviewedCount },
  }).catch((error) => console.error("[AUTOMATION_PRACTICAL_COMPLETED]", error));

  return NextResponse.json({ ok: true, score, correct, incorrect, reviewedCount, attemptId });
}
