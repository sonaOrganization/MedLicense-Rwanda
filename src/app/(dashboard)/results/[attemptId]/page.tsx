import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, MinusCircle, Clock, Trophy, ArrowLeft, RotateCcw } from "lucide-react";
import { formatDuration, formatScore, getGradeColor } from "@/lib/utils";

interface Props { params: Promise<{ attemptId: string }> }

export default async function ResultDetailPage({ params }: Props) {
  const { attemptId } = await params;
  const session = await auth();
  if (!session) redirect("/login");

  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId, userId: session.user.id },
    include: {
      exam: { select: { titleEn: true, passingScore: true } },
      answers: {
        include: {
          question: { include: { answers: true } },
          answer: true,
        },
      },
    },
  });

  if (!attempt || attempt.status !== "COMPLETED") notFound();

  const passed = (attempt.score ?? 0) >= attempt.exam.passingScore;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/results">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{attempt.exam.titleEn} — Results</h1>
      </div>

      {/* Score card */}
      <Card className={`border-2 ${passed ? "border-green-400" : "border-red-400"}`}>
        <CardContent className="p-8">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="text-center">
              <div className={`text-6xl font-bold ${getGradeColor(attempt.score ?? 0, attempt.exam.passingScore)}`}>
                {formatScore(attempt.score ?? 0)}
              </div>
              <Badge variant={passed ? "success" : "danger"} className="mt-2 text-sm px-3 py-1">
                {passed ? "PASSED" : "FAILED"}
              </Badge>
              <p className="text-xs text-gray-400 mt-1">Passing score: {attempt.exam.passingScore}%</p>
            </div>
            <div className="flex-1 w-full">
              <Progress value={attempt.score ?? 0} className="h-4 mb-6" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Correct", value: attempt.correct, icon: CheckCircle, color: "text-green-500" },
                  { label: "Wrong", value: attempt.wrong, icon: XCircle, color: "text-red-500" },
                  { label: "Skipped", value: attempt.skipped, icon: MinusCircle, color: "text-gray-400" },
                  { label: "Time", value: attempt.timeTaken ? formatDuration(attempt.timeTaken) : "—", icon: Clock, color: "text-indigo-500" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="text-center">
                    <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{value}</div>
                    <div className="text-xs text-gray-400">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Link href={`/exams/${attempt.examId}`}>
          <Button variant="outline" className="gap-2">
            <RotateCcw className="w-4 h-4" /> Retake Exam
          </Button>
        </Link>
      </div>

      {/* Question review */}
      <Card>
        <CardHeader><CardTitle>Question Review</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {attempt.answers.map((aa, i) => {
              const correct = aa.question.answers.find((a) => a.isCorrect);
              const isCorrect = aa.isCorrect;
              const isSkipped = !aa.answerId;

              return (
                <div key={aa.id} className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`mt-0.5 flex-shrink-0 p-1 rounded-full ${isSkipped ? "bg-gray-100 dark:bg-gray-800" : isCorrect ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                      {isSkipped ? <MinusCircle className="w-4 h-4 text-gray-400" /> :
                       isCorrect ? <CheckCircle className="w-4 h-4 text-green-500" /> :
                       <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        <span className="text-gray-400 mr-1">Q{i + 1}.</span>
                        {aa.question.textEn}
                      </p>
                      <div className="space-y-1.5 mt-2">
                        {aa.question.answers.map((ans) => (
                          <div
                            key={ans.id}
                            className={`text-sm px-3 py-1.5 rounded-lg ${
                              ans.isCorrect
                                ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 font-medium"
                                : aa.answerId === ans.id && !ans.isCorrect
                                ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                                : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {ans.isCorrect && <CheckCircle className="inline w-3.5 h-3.5 mr-1" />}
                            {aa.answerId === ans.id && !ans.isCorrect && <XCircle className="inline w-3.5 h-3.5 mr-1" />}
                            {ans.textEn}
                          </div>
                        ))}
                      </div>
                      {aa.question.explanationEn && (
                        <div className="mt-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-sm text-indigo-800 dark:text-indigo-300">
                          <strong>Explanation:</strong> {aa.question.explanationEn}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
