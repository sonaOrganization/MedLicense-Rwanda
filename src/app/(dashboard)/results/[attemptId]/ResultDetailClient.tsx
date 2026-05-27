"use client";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, MinusCircle, Clock, ArrowLeft, RotateCcw, LayoutDashboard } from "lucide-react";
import { formatDuration, formatScore, getGradeColor } from "@/lib/utils";
import { useLanguage, t } from "@/lib/language";
import { useT } from "@/lib/translations";

interface Answer {
  id: string;
  text_en: string;
  text_fr?: string | null;
  is_correct: boolean;
}

interface AttemptAnswer {
  id: string;
  answer_id?: string;
  is_correct: boolean;
  question: {
    text_en: string;
    text_fr?: string | null;
    explanation_en?: string | null;
    explanation_fr?: string | null;
    answers: Answer[];
  };
  answer?: { id: string; text_en: string } | null;
}

interface Attempt {
  score?: number;
  correct: number;
  wrong: number;
  skipped: number;
  time_taken?: number;
  exam_id: string;
  exam: { title_en: string; title_fr?: string | null; passing_score: number };
  answers: AttemptAnswer[];
}

export function ResultDetailClient({ attempt }: { attempt: Attempt }) {
  const { language } = useLanguage();
  const T = useT(language);

  const passed = (attempt.score ?? 0) >= attempt.exam.passing_score;
  const examTitle = t(attempt.exam.title_en, attempt.exam.title_fr, language);

  const stats = [
    { label: T("rd_correct"),  value: attempt.correct,                                       icon: CheckCircle,  color: "text-green-500" },
    { label: T("rd_wrong"),    value: attempt.wrong,                                         icon: XCircle,      color: "text-red-500" },
    { label: T("rd_skipped"),  value: attempt.skipped,                                       icon: MinusCircle,  color: "text-gray-400" },
    { label: T("rd_time"),     value: attempt.time_taken ? formatDuration(attempt.time_taken) : "—", icon: Clock, color: "text-indigo-500" },
  ];

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/results">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="w-4 h-4" /> {T("rd_back")}
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{examTitle} — {T("rd_results")}</h1>
      </div>

      {/* Score card */}
      <Card className={`border-2 ${passed ? "border-green-400" : "border-red-400"}`}>
        <CardContent className="p-8">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="text-center">
              <div className={`text-6xl font-bold ${getGradeColor(attempt.score ?? 0, attempt.exam.passing_score)}`}>
                {formatScore(attempt.score ?? 0)}
              </div>
              <Badge variant={passed ? "success" : "danger"} className="mt-2 text-sm px-3 py-1">
                {passed ? T("rd_badge_passed") : T("rd_badge_failed")}
              </Badge>
              <p className="text-xs text-gray-400 mt-1">{T("rd_passing")} {attempt.exam.passing_score}%</p>
            </div>
            <div className="flex-1 w-full">
              <Progress value={attempt.score ?? 0} className="h-4 mb-6" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {stats.map(({ label, value, icon: Icon, color }) => (
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
      <div className="flex gap-3 flex-wrap">
        <Link href="/dashboard">
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
            <LayoutDashboard className="w-4 h-4" /> {T("nav_dashboard")}
          </Button>
        </Link>
        <Link href={`/exams/${attempt.exam_id}`}>
          <Button variant="outline" className="gap-2">
            <RotateCcw className="w-4 h-4" /> {T("rd_retake")}
          </Button>
        </Link>
      </div>

      {/* Question review */}
      <Card>
        <CardHeader><CardTitle>{T("rd_review")}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {attempt.answers.map((aa, i) => {
              const isCorrect = aa.is_correct;
              const isSkipped = !aa.answer_id;
              const qText = t(aa.question.text_en, aa.question.text_fr, language);
              const explanation = t(aa.question.explanation_en, aa.question.explanation_fr, language);

              return (
                <div key={aa.id} className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`mt-0.5 flex-shrink-0 p-1 rounded-full ${isSkipped ? "bg-gray-100 dark:bg-gray-800" : isCorrect ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                      {isSkipped ? <MinusCircle className="w-4 h-4 text-gray-400" /> :
                       isCorrect  ? <CheckCircle className="w-4 h-4 text-green-500" /> :
                       <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        <span className="text-gray-400 mr-1">Q{i + 1}.</span>
                        {qText}
                      </p>
                      <div className="space-y-1.5 mt-2">
                        {aa.question.answers.map((ans) => {
                          const ansText = t(ans.text_en, ans.text_fr, language);
                          return (
                            <div
                              key={ans.id}
                              className={`text-sm px-3 py-1.5 rounded-lg ${
                                ans.is_correct
                                  ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 font-medium"
                                  : aa.answer_id === ans.id && !ans.is_correct
                                  ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                                  : "text-gray-500 dark:text-gray-400"
                              }`}
                            >
                              {ans.is_correct && <CheckCircle className="inline w-3.5 h-3.5 mr-1" />}
                              {aa.answer_id === ans.id && !ans.is_correct && <XCircle className="inline w-3.5 h-3.5 mr-1" />}
                              {ansText}
                            </div>
                          );
                        })}
                      </div>
                      {explanation && (
                        <div className="mt-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-sm text-indigo-800 dark:text-indigo-300">
                          <strong>{T("rd_explanation")}</strong> {explanation}
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
