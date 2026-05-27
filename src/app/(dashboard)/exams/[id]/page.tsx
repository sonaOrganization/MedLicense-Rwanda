import { notFound, redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { auth } from "@/lib/auth";
import { ExamEngine } from "@/components/exam/ExamEngine";

interface Props {
  params: Promise<{ id: string }>;
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

  // Create attempt
  const { data: attempt } = await supabase
    .from("exam_attempts")
    .insert({ user_id: session.user.id, exam_id: exam.id, status: "IN_PROGRESS" })
    .select()
    .single();

  // Shuffle questions if enabled
  let questions = exam.questions.map((eq: { question: { id: string; text_en: string; text_fr?: string; image_url?: string; difficulty: string; answers: { id: string; text_en: string; text_fr?: string; order: number }[] } }) => eq.question);
  if (exam.shuffle_questions) questions = questions.sort(() => Math.random() - 0.5);

  // Shuffle answers if enabled
  if (exam.shuffle_answers) {
    questions = questions.map((q: { id: string; text_en: string; text_fr?: string; image_url?: string; difficulty: string; answers: { id: string; text_en: string; text_fr?: string; order: number }[] }) => ({
      ...q,
      answers: [...q.answers].sort(() => Math.random() - 0.5),
    }));
  }

  const examData = {
    id: exam.id,
    titleEn: exam.title_en,
    titleFr: exam.title_fr ?? null,
    durationMinutes: exam.duration_minutes,
    passingScore: exam.passing_score,
    negativeMarking: exam.negative_marking,
    attemptId: attempt!.id,
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
