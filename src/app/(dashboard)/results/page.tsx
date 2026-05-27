import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle, XCircle, Eye } from "lucide-react";
import { formatDate, formatDuration, formatScore, getGradeColor } from "@/lib/utils";

export default async function ResultsPage() {
  const session = await auth();
  const { data: attempts } = await supabase
    .from("exam_attempts")
    .select("*, exam:exams(title_en, passing_score, duration_minutes, category:categories(name_en))")
    .eq("user_id", session!.user.id)
    .eq("status", "COMPLETED")
    .order("submitted_at", { ascending: false });

  const attemptList = attempts ?? [];

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Results</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{attemptList.length} completed exams</p>
      </div>

      {attemptList.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">No exam results yet.</p>
          <Link href="/exams"><Button>Take Your First Exam</Button></Link>
        </div>
      ) : (
        <div className="space-y-4">
          {attemptList.map((attempt: {
            id: string;
            score?: number;
            correct: number;
            wrong: number;
            skipped: number;
            time_taken?: number;
            submitted_at?: string;
            exam_id: string;
            exam: { title_en: string; passing_score: number; duration_minutes: number; category: { name_en: string } };
          }) => {
            const passed = (attempt.score ?? 0) >= attempt.exam.passing_score;
            return (
              <Card key={attempt.id}>
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className={`p-2 rounded-full self-start flex-shrink-0 ${passed ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                      {passed ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{attempt.exam.title_en}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-400">{attempt.exam.category.name_en}</span>
                            <span className="text-xs text-gray-400">{attempt.submitted_at ? formatDate(new Date(attempt.submitted_at)) : "—"}</span>
                            {attempt.time_taken && (
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {formatDuration(attempt.time_taken)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getGradeColor(attempt.score ?? 0, attempt.exam.passing_score)}`}>
                            {formatScore(attempt.score ?? 0)}
                          </div>
                          <Badge variant={passed ? "success" : "danger"}>{passed ? "Passed" : "Failed"}</Badge>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Progress value={attempt.score ?? 0} showLabel />
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span className="text-green-500">{attempt.correct} correct</span>
                        <span className="text-red-500">{attempt.wrong} wrong</span>
                        <span className="text-gray-400">{attempt.skipped} skipped</span>
                      </div>
                    </div>
                    <Link href={`/results/${attempt.id}`}>
                      <Button variant="outline" size="sm" className="gap-2 flex-shrink-0">
                        <Eye className="w-4 h-4" /> Review
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
