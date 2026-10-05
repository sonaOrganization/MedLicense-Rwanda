import { notFound, redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { auth } from "@/lib/auth";
import { ExamEngine } from "@/components/exam/ExamEngine";
import type { StartedAttempt, TheorySnapshot, TheoryState } from "@/lib/exam-types";

interface Props { params: Promise<{ id: string }> }
function seededShuffle<T>(items: T[], seedText: string): T[] {
  let seed = 2166136261;
  for (const char of seedText) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619);
  const random = () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export default async function ExamPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/login");
  const { data, error } = await supabase.rpc("start_exam_attempt", { p_user_id: session.user.id, p_exam_id: id, p_kind: "theory" });
  if (error) { console.error("[START_EXAM]", error); throw new Error("Could not start exam"); }
  const attempt = data as StartedAttempt<TheorySnapshot, TheoryState> | null;
  if (attempt?.error === "access_denied") redirect("/subscription?required=true");
  if (!attempt || attempt.error || !attempt.exam_snapshot || !attempt.deadline_at) notFound();
  const exam = attempt.exam_snapshot;
  let questions = exam.questions;
  if (exam.shuffle_questions) questions = seededShuffle(questions, attempt.id + ":questions");
  if (exam.shuffle_answers) questions = questions.map((q) => ({ ...q, answers: seededShuffle(q.answers, attempt.id + ":" + q.id + ":answers") }));
  // Only presentation data crosses the server/client boundary. No answer keys.
  const examData = {
    id: exam.id, titleEn: exam.title_en, titleFr: exam.title_fr ?? null,
    durationMinutes: exam.duration_minutes, passingScore: exam.passing_score,
    negativeMarking: exam.negative_marking, attemptId: attempt.id,
    deadlineAt: attempt.deadline_at, initialTimeLeft: attempt.remaining_seconds ?? 0,
    initialState: attempt.saved_state, initialRevision: attempt.saved_revision,
    questions: questions.map((q) => ({
      id: q.id, textEn: q.text_en ?? q.text_fr ?? "", textFr: q.text_fr, imageUrl: q.image_url, difficulty: q.difficulty,
      answers: q.answers.map((a) => ({ id: a.id, textEn: a.text_en ?? a.text_fr ?? "", textFr: a.text_fr })),
    })),
  };
  return <ExamEngine exam={examData} />;
}
