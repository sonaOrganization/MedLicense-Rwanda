"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Stethoscope, Brain, Eye, CheckCircle2, XCircle, ArrowRight, PartyPopper } from "lucide-react";
import toast from "react-hot-toast";
import { useLanguage, t } from "@/lib/language";
import { useT } from "@/lib/translations";

interface Subquestion {
  id: string;
  promptEn: string;
  promptFr?: string | null;
  modelAnswerEn: string;
  modelAnswerFr?: string | null;
}
interface Group {
  id: string;
  stemEn: string;
  stemFr?: string | null;
  imageUrl?: string | null;
  subquestions: Subquestion[];
}
interface InitialState {
  groupIndex: number;
  subIndex: number;
  answers: Record<string, boolean>;
}
interface PracticalExamData {
  id: string;
  titleEn: string;
  titleFr?: string | null;
  attemptId: string;
  groups: Group[];
  initialState: InitialState | null;
}

type Phase = "prompt" | "thinking" | "revealed" | "group-done";

function subLabel(groupIndex: number, subIndex: number, totalSubsInGroup: number) {
  const base = `Q${groupIndex + 1}`;
  return totalSubsInGroup > 1 ? `${base}.${String.fromCharCode(65 + subIndex)}` : base;
}

export function PracticalEngine({ exam }: { exam: PracticalExamData }) {
  const router = useRouter();
  const { language } = useLanguage();
  const T = useT(language);

  const [groupIndex, setGroupIndex] = useState(exam.initialState?.groupIndex ?? 0);
  const [subIndex,   setSubIndex]   = useState(exam.initialState?.subIndex ?? 0);
  const [phase,      setPhase]      = useState<Phase>("prompt");
  const [answers,    setAnswers]    = useState<Record<string, boolean>>(exam.initialState?.answers ?? {});
  const [submitting, setSubmitting] = useState(false);
  const answersRef = useRef(answers);
  useEffect(() => { answersRef.current = answers; }, [answers]);

  const group = exam.groups[groupIndex];
  const sub   = group?.subquestions[subIndex];

  const totalSubquestions = exam.groups.reduce((s, g) => s + g.subquestions.length, 0);
  const reviewedCount = Object.keys(answers).length;
  const progressPct = totalSubquestions > 0 ? Math.round((reviewedCount / totalSubquestions) * 100) : 0;

  const isLastSubInGroup = subIndex === (group?.subquestions.length ?? 1) - 1;
  const isLastGroup = groupIndex === exam.groups.length - 1;

  const save = useCallback(async (overrides?: Partial<{ groupIndex: number; subIndex: number; answers: Record<string, boolean> }>) => {
    await fetch(`/api/practical/${exam.attemptId}/save`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        groupIndex: overrides?.groupIndex ?? groupIndex,
        subIndex: overrides?.subIndex ?? subIndex,
        answers: overrides?.answers ?? answersRef.current,
      }),
    }).catch(() => {});
  }, [exam.attemptId, groupIndex, subIndex]);

  // Auto-save every 30s
  useEffect(() => {
    const id = setInterval(() => save(), 30000);
    return () => clearInterval(id);
  }, [save]);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/practical/${exam.attemptId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: answersRef.current }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/practical/results/${exam.attemptId}`);
    } catch {
      toast.error("Failed to submit. Please try again.");
      setSubmitting(false);
    }
  }, [exam.attemptId, router, submitting]);

  function mark(isCorrect: boolean) {
    if (!sub) return;
    const nextAnswers = { ...answers, [sub.id]: isCorrect };
    setAnswers(nextAnswers);

    if (!isLastSubInGroup) {
      const nextSub = subIndex + 1;
      setSubIndex(nextSub);
      setPhase("prompt");
      save({ subIndex: nextSub, answers: nextAnswers });
    } else {
      setPhase("group-done");
      save({ answers: nextAnswers });
    }
  }

  function nextQuestion() {
    if (isLastGroup) {
      handleSubmit();
      return;
    }
    const nextGroup = groupIndex + 1;
    setGroupIndex(nextGroup);
    setSubIndex(0);
    setPhase("prompt");
    save({ groupIndex: nextGroup, subIndex: 0 });
  }

  if (!group || !sub) return null;

  return (
    <div className="fixed inset-0 bg-amber-50/40 dark:bg-[#120f0a] flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="flex-shrink-0 bg-white dark:bg-[#1a140c] border-b border-amber-200/60 dark:border-amber-900/30 shadow-sm">
        <div className="flex items-center justify-between px-5 sm:px-7 h-14">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center flex-shrink-0">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 dark:text-white text-sm truncate max-w-[160px] sm:max-w-xs md:max-w-sm">
                {t(exam.titleEn, exam.titleFr, language)}
              </p>
              <p className="hidden sm:block text-[11px] text-gray-400 leading-none mt-0.5">
                {T("practical_engine_case_progress")
                  .replace("{n}", String(groupIndex + 1))
                  .replace("{total}", String(exam.groups.length))}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 px-5 sm:px-7 pb-2.5">
          <div className="flex-1 h-1.5 bg-amber-100 dark:bg-amber-950/40 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="text-[11px] font-semibold text-gray-400 w-7 text-right tabular-nums">{progressPct}%</span>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8 flex flex-col gap-4">

          {/* Case stem card */}
          <div className="bg-white dark:bg-[#1a140c] rounded-2xl border border-amber-200/60 dark:border-amber-900/30 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-5 py-2.5 border-b border-amber-100 dark:border-amber-900/30 bg-amber-50/80 dark:bg-amber-900/10">
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest">
                Question {groupIndex + 1}
              </span>
            </div>
            <div className="px-4 sm:px-6 py-4">
              {group.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={group.imageUrl} alt="Clinical image" className="rounded-xl mb-4 max-h-48 object-contain border border-amber-100 dark:border-amber-900/30" />
              )}
              <p className="text-[15px] text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                {t(group.stemEn, group.stemFr, language)}
              </p>
            </div>
          </div>

          {/* Sub-question card */}
          <div className="bg-white dark:bg-[#1a140c] rounded-2xl border border-amber-200/60 dark:border-amber-900/30 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-amber-100 dark:border-amber-900/30">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                {subLabel(groupIndex, subIndex, group.subquestions.length)}
              </span>
              <p className="text-[15px] sm:text-[16px] font-medium text-gray-900 dark:text-white leading-relaxed mt-1.5">
                {t(sub.promptEn, sub.promptFr, language)}
              </p>
            </div>

            <div className="px-4 sm:px-6 py-5">
              {phase === "prompt" && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setPhase("thinking")}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold transition-colors shadow-sm"
                  >
                    <Brain className="w-4 h-4" /> {T("practical_engine_start_thinking")}
                  </button>
                  <button
                    onClick={() => setPhase("revealed")}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border-2 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/10 text-sm font-bold transition-colors"
                  >
                    <Eye className="w-4 h-4" /> {T("practical_engine_review_answer")}
                  </button>
                </div>
              )}

              {phase === "thinking" && (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center animate-pulse">
                    <Brain className="w-7 h-7 text-amber-500" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{T("practical_engine_thinking_hint")}</p>
                  <button
                    onClick={() => setPhase("revealed")}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold transition-colors shadow-sm"
                  >
                    <Eye className="w-4 h-4" /> {T("practical_engine_review_answer")}
                  </button>
                </div>
              )}

              {phase === "revealed" && (
                <div className="space-y-4">
                  <div className="rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/10 p-4">
                    <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1.5">
                      {T("practical_engine_model_answer_label")}
                    </p>
                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                      {t(sub.modelAnswerEn, sub.modelAnswerFr, language)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => mark(true)}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" /> {T("practical_engine_mark_correct")}
                    </button>
                    <button
                      onClick={() => mark(false)}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors shadow-sm"
                    >
                      <XCircle className="w-4 h-4" /> {T("practical_engine_mark_incorrect")}
                    </button>
                  </div>
                </div>
              )}

              {phase === "group-done" && (
                <div className="flex flex-col items-center gap-4 py-2 text-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <PartyPopper className="w-7 h-7 text-emerald-500" />
                  </div>
                  <button
                    onClick={nextQuestion}
                    disabled={submitting}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold transition-colors shadow-sm disabled:opacity-60"
                  >
                    {isLastGroup
                      ? (submitting ? T("practical_engine_submitting") : T("practical_engine_finish"))
                      : <>{T("practical_engine_next_question")} <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Progress footer text — non-clickable, no jump navigator by design */}
          <p className="text-center text-xs text-gray-400">
            {T("practical_engine_case_progress")
              .replace("{n}", String(groupIndex + 1))
              .replace("{total}", String(exam.groups.length))}
            {group.subquestions.length > 1 && (
              <> · {subLabel(groupIndex, subIndex, group.subquestions.length)}</>
            )}
          </p>
        </div>
      </main>
    </div>
  );
}
