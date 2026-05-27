"use client";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle, XCircle, Eye } from "lucide-react";
import { formatDate, formatDuration, formatScore, getGradeColor } from "@/lib/utils";
import { useLanguage, t } from "@/lib/language";
import { useT } from "@/lib/translations";

interface Attempt {
  id: string;
  score?: number;
  correct: number;
  wrong: number;
  skipped: number;
  time_taken?: number;
  submitted_at?: string;
  exam_id: string;
  exam: {
    title_en: string;
    title_fr?: string | null;
    passing_score: number;
    duration_minutes: number;
    category: { name_en: string; name_fr?: string | null };
  };
}

export function ResultsClient({ attempts }: { attempts: Attempt[] }) {
  const { language } = useLanguage();
  const T = useT(language);

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{T("results_title")}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{attempts.length} {T("results_sub")}</p>
      </div>

      {attempts.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">{T("results_empty")}</p>
          <Link href="/exams"><Button>{T("results_first")}</Button></Link>
        </div>
      ) : (
        <div className="space-y-4">
          {attempts.map((attempt) => {
            const passed = (attempt.score ?? 0) >= attempt.exam.passing_score;
            const examTitle = t(attempt.exam.title_en, attempt.exam.title_fr, language);
            const catName = t(
              attempt.exam.category?.name_en,
              (attempt.exam.category as { name_fr?: string | null })?.name_fr,
              language
            );
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
                          <h3 className="font-semibold text-gray-900 dark:text-white">{examTitle}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            {catName && <span className="text-xs text-gray-400">{catName}</span>}
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
                          <Badge variant={passed ? "success" : "danger"}>
                            {passed ? T("results_passed") : T("results_failed")}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Progress value={attempt.score ?? 0} showLabel />
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span className="text-green-500">{attempt.correct} {T("results_correct")}</span>
                        <span className="text-red-500">{attempt.wrong} {T("results_wrong")}</span>
                        <span className="text-gray-400">{attempt.skipped} {T("results_skipped")}</span>
                      </div>
                    </div>
                    <Link href={`/results/${attempt.id}`}>
                      <Button variant="outline" size="sm" className="gap-2 flex-shrink-0">
                        <Eye className="w-4 h-4" /> {T("results_review")}
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
