import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ExamEngine } from "@/components/exam/ExamEngine";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ExamPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/login");

  const exam = await prisma.exam.findUnique({
    where: { id, isPublished: true },
    include: {
      category: true,
      questions: {
        include: {
          question: {
            include: { answers: { orderBy: { order: "asc" } } },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!exam) notFound();

  // Create attempt
  const attempt = await prisma.examAttempt.create({
    data: { userId: session.user.id, examId: exam.id, status: "IN_PROGRESS" },
  });

  // Shuffle questions if enabled
  let questions = exam.questions.map((eq) => eq.question);
  if (exam.shuffleQuestions) questions = questions.sort(() => Math.random() - 0.5);

  // Shuffle answers if enabled
  if (exam.shuffleAnswers) {
    questions = questions.map((q) => ({
      ...q,
      answers: [...q.answers].sort(() => Math.random() - 0.5),
    }));
  }

  const examData = {
    id: exam.id,
    title: exam.titleEn,
    durationMinutes: exam.durationMinutes,
    passingScore: exam.passingScore,
    negativeMarking: exam.negativeMarking,
    attemptId: attempt.id,
    questions: questions.map((q) => ({
      id: q.id,
      textEn: q.textEn,
      textFr: q.textFr,
      imageUrl: q.imageUrl,
      difficulty: q.difficulty,
      answers: q.answers.map((a) => ({ id: a.id, textEn: a.textEn, textFr: a.textFr })),
    })),
  };

  return <ExamEngine exam={examData} />;
}
