import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ attemptId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { attemptId } = await params;
  const { answers, timedOut } = await req.json();

  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId, userId: session.user.id },
    include: {
      exam: {
        include: {
          questions: {
            include: { question: { include: { answers: true } } },
          },
        },
      },
    },
  });

  if (!attempt || attempt.status === "COMPLETED") {
    return NextResponse.json({ error: "Attempt not found or already submitted" }, { status: 404 });
  }

  const questions = attempt.exam.questions.map((eq) => eq.question);
  let correct = 0;
  let wrong = 0;
  let skipped = 0;

  const answerRecords = questions.map((q) => {
    const selectedAnswerId = answers[q.id] ?? null;
    const correctAnswer = q.answers.find((a) => a.isCorrect);
    const isCorrect = selectedAnswerId ? selectedAnswerId === correctAnswer?.id : false;

    if (!selectedAnswerId) skipped++;
    else if (isCorrect) correct++;
    else wrong++;

    return {
      attemptId,
      questionId: q.id,
      answerId: selectedAnswerId,
      isCorrect,
    };
  });

  const score = attempt.exam.negativeMarking
    ? Math.max(0, ((correct - wrong * 0.25) / questions.length) * 100)
    : (correct / questions.length) * 100;

  const timeTaken = Math.round((Date.now() - attempt.startedAt.getTime()) / 1000);

  await prisma.$transaction([
    prisma.attemptAnswer.createMany({ data: answerRecords }),
    prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        status: timedOut ? "TIMED_OUT" : "COMPLETED",
        score,
        correct,
        wrong,
        skipped,
        totalAnswered: correct + wrong,
        timeTaken,
        submittedAt: new Date(),
      },
    }),
  ]);

  return NextResponse.json({ ok: true, score, correct, wrong, skipped, attemptId });
}
