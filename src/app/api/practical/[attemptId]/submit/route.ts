import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest, { params }: { params: Promise<{ attemptId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { attemptId } = await params;
  const { answers } = (await req.json()) as { answers: Record<string, boolean> };

  const { data: attempt } = await supabase
    .from("practical_attempts")
    .select("*, exam:practical_exams(*, groups:practical_groups(*, subquestions:practical_subquestions(id)))")
    .eq("id", attemptId)
    .eq("user_id", session.user.id)
    .single();

  if (!attempt || attempt.status === "COMPLETED") {
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
    await supabase.from("practical_attempt_answers").insert(answerRecords);
  }

  await supabase
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
    .eq("id", attemptId);

  return NextResponse.json({ ok: true, score, correct, incorrect, reviewedCount, attemptId });
}
