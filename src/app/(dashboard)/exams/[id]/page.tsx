import { notFound, redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { auth } from "@/lib/auth";
import { ExamEngine } from "@/components/exam/ExamEngine";
import { canAccessExam } from "@/lib/subscriptions";

interface Props {
  params: Promise<{ id: string }>;
}

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

  const { data: exam } = await supabase
    .from("exams")
    .select("*, category:categories(*), questions:exam_questions(*, question:questions(*, answers(*)))")
    .eq("id", id)
    .eq("is_published", true)
    .single();

  if (!exam) notFound();

  if (!(await canAccessExam(session.user.id, exam.is_free))) redirect("/subscription?required=true");

  // Resume the current attempt so refreshes do not create duplicates.
  const { data: existingAttempt } = await supabase
    .from("exam_attempts")
    .select("*")
    .eq("user_id", session.user.id)
    .eq("exam_id", exam.id)
    .eq("status", "IN_PROGRESS")
    .maybeSingle();
  const attempt = existingAttempt ?? (await supabase
    .from("exam_attempts")
    .insert({ user_id: session.user.id, exam_id: exam.id, status: "IN_PROGRESS" })
    .select()
    .single()).data;
  if (!attempt) notFound();

  // Shuffle questions if enabled
  let questions = exam.questions.map((eq: { question: { id: string; text_en: string; text_fr?: string; image_url?: string; difficulty: string; answers: { id: string; text_en: string; text_fr?: string; order: number }[] } }) => eq.question);
  if (exam.shuffle_questions) questions = seededShuffle(questions, `${attempt.id}:questions`);

  // Shuffle answers if enabled
  if (exam.shuffle_answers) {
    questions = questions.map((q: { id: string; text_en: string; text_fr?: string; image_url?: string; difficulty: string; answers: { id: string; text_en: string; text_fr?: string; order: number }[] }) => ({
      ...q,
      answers: seededShuffle(q.answers, `${attempt.id}:${q.id}:answers`),
    }));
  }

  const examData = {
    id: exam.id,
    titleEn: exam.title_en,
    titleFr: exam.title_fr ?? null,
    durationMinutes: exam.duration_minutes,
    passingScore: exam.passing_score,
    negativeMarking: exam.negative_marking,
    attemptId: attempt.id,
    initialState: attempt.saved_state ?? null,
    questions: questions.map((q: { id: string; text_en: string; text_fr?: string; image_url?: string; difficulty: string; answers: { id: string; text_en: string; text_fr?: string }[] }) => ({
      id: q.id,
      textEn: q.text_en,
      textFr: q.text_fr,
      imageUrl: q.image_url,
      difficulty: q.difficulty,
      answers: q.answers.map((a: { id: string; text_en: string; text_fr?: string }) => ({ id: a.id, textEn: a.text_en, textFr: a.text_fr })),
    })),
  };

  return <ExamEngine exam={examData} />;
}
