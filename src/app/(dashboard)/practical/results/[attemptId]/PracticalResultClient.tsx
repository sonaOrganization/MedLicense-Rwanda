"use client";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Clock, ArrowLeft, RotateCcw, LayoutDashboard } from "lucide-react";
import { formatDuration, formatScore } from "@/lib/utils";
import { useLanguage, t } from "@/lib/language";
import { useT } from "@/lib/translations";

interface Group { id: string; stem_en: string; stem_fr?: string | null; order: number; }
interface Subquestion {
  id: string; prompt_en: string; prompt_fr?: string | null;
  model_answer_en: string; model_answer_fr?: string | null; order: number;
  group: Group | Group[];
}
interface AttemptAnswer {
  id: string; is_correct: boolean;
  subquestion: Subquestion | Subquestion[];
}
interface Attempt {
  reviewed_count: number;
  correct_count: number;
  incorrect_count: number;
  score?: number | null;
  time_taken?: number | null;
  exam: { id: string; title_en: string; title_fr?: string | null };
  answers: AttemptAnswer[];
}

function subLabel(groupIndex: number, subIndex: number, totalSubsInGroup: number) {
  const base = `Question ${groupIndex + 1}`;
  return totalSubsInGroup > 1 ? `${base}${String.fromCharCode(65 + subIndex)}` : base;
}

export function PracticalResultClient({ attempt }: { attempt: Attempt }) {
  const { language } = useLanguage();
  const T = useT(language);

  const examTitle = t(attempt.exam.title_en, attempt.exam.title_fr, language);

  // Reconstruct groups (ordered) from the flat answers list
  const groupsMap = new Map<string, { group: Group; subs: { sub: Subquestion; isCorrect: boolean }[] }>();
  for (const a of attempt.answers) {
    const sub = Array.isArray(a.subquestion) ? a.subquestion[0] : a.subquestion;
    const group = Array.isArray(sub.group) ? sub.group[0] : sub.group;
    if (!groupsMap.has(group.id)) groupsMap.set(group.id, { group, subs: [] });
    groupsMap.get(group.id)!.subs.push({ sub, isCorrect: a.is_correct });
  }
  const groups = [...groupsMap.values()]
    .sort((a, b) => a.group.order - b.group.order)
    .map((g) => ({ ...g, subs: g.subs.sort((a, b) => a.sub.order - b.sub.order) }));

  const stats = [
    { label: T("practical_results_correct"),   value: attempt.correct_count,   icon: CheckCircle, color: "text-emerald-500" },
    { label: T("practical_results_incorrect"), value: attempt.incorrect_count, icon: XCircle,      color: "text-red-500" },
    { label: T("practical_results_reviewed"),  value: attempt.reviewed_count,  icon: CheckCircle,  color: "text-amber-500" },
    { label: "Time",                           value: attempt.time_taken ? formatDuration(attempt.time_taken) : "—", icon: Clock, color: "text-indigo-500" },
  ];

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/practical">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="w-4 h-4" /> {T("practical_results_back")}
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{examTitle} — {T("practical_results_title")}</h1>
      </div>

      <Card className="border-2 border-amber-300 dark:border-amber-800">
        <CardContent className="p-8">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="text-center">
              <div className="text-6xl font-bold text-amber-600 dark:text-amber-400">
                {formatScore(attempt.score ?? 0)}
              </div>
              <Badge variant="warning" className="mt-2 text-sm px-3 py-1">
                {T("practical_results_accuracy")}
              </Badge>
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

      <div className="flex gap-3 flex-wrap">
        <Link href="/dashboard">
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
            <LayoutDashboard className="w-4 h-4" /> {T("nav_dashboard")}
          </Button>
        </Link>
        <Link href={`/practical/${attempt.exam.id}`}>
          <Button variant="outline" className="gap-2">
            <RotateCcw className="w-4 h-4" /> {T("practical_results_retake")}
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader><CardTitle>Case Review</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {groups.map((g, gi) => (
              <div key={g.group.id} className="p-5">
                <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-1.5">
                  Question {gi + 1}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-wrap">
                  {t(g.group.stem_en, g.group.stem_fr, language)}
                </p>
                <div className="space-y-3">
                  {g.subs.map(({ sub, isCorrect }, si) => (
                    <div key={sub.id} className="rounded-xl border border-gray-200 dark:border-gray-800 p-3.5">
                      <div className="flex items-start gap-2 mb-2">
                        {isCorrect
                          ? <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                          : <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />}
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          <span className="text-gray-400 mr-1">{subLabel(gi, si, g.subs.length)}.</span>
                          {t(sub.prompt_en, sub.prompt_fr, language)}
                        </p>
                      </div>
                      <div className="ml-6 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg text-sm text-amber-800 dark:text-amber-300">
                        <strong>{T("practical_engine_model_answer_label")}:</strong> {t(sub.model_answer_en, sub.model_answer_fr, language)}
                      </div>
                      <p className="ml-6 mt-1.5 text-xs text-gray-400">
                        {T("practical_results_your_mark")}{" "}
                        <span className={isCorrect ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-red-500 font-semibold"}>
                          {isCorrect ? T("practical_engine_mark_correct") : T("practical_engine_mark_incorrect")}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
