import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bookmark } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function SavedQuestionsPage() {
  const session = await auth();
  const saved = await prisma.savedQuestion.findMany({
    where: { userId: session!.user.id },
    include: {
      question: {
        include: { answers: true, category: { select: { nameEn: true } } },
      },
    },
    orderBy: { savedAt: "desc" },
  });

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Saved Questions</h1>
        <span className="text-sm text-gray-400">{saved.length} questions</span>
      </div>

      {saved.length === 0 ? (
        <div className="text-center py-16">
          <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">No saved questions yet.</p>
          <Link href="/exams"><Button>Take an Exam to Save Questions</Button></Link>
        </div>
      ) : (
        <div className="space-y-4">
          {saved.map(({ question, savedAt }) => (
            <Card key={question.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="info">{question.category.nameEn}</Badge>
                      <Badge variant={question.difficulty === "EASY" ? "success" : question.difficulty === "HARD" ? "danger" : "warning"}>
                        {question.difficulty}
                      </Badge>
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm mb-3">{question.textEn}</p>
                    <div className="space-y-1.5">
                      {question.answers.map((ans) => (
                        <div key={ans.id} className={`text-sm px-3 py-1.5 rounded-lg ${ans.isCorrect ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300" : "text-gray-500 dark:text-gray-400"}`}>
                          {ans.isCorrect && "✓ "}{ans.textEn}
                        </div>
                      ))}
                    </div>
                    {question.explanationEn && (
                      <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-sm text-indigo-700 dark:text-indigo-300">
                        <strong>Explanation:</strong> {question.explanationEn}
                      </div>
                    )}
                  </div>
                  <Bookmark className="w-5 h-5 text-indigo-500 flex-shrink-0 fill-indigo-500" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
