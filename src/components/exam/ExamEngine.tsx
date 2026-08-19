"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Flag, ChevronLeft, ChevronRight, Clock, AlertTriangle, CheckCircle, BookOpen } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { useLanguage, t } from "@/lib/language";
import { useT } from "@/lib/translations";

interface Answer   { id: string; textEn: string; textFr?: string | null; }
interface Question { id: string; textEn: string; textFr?: string | null; imageUrl?: string | null; difficulty: string; answers: Answer[]; }
interface ExamData {
  id: string; titleEn: string; titleFr?: string | null; durationMinutes: number; passingScore: number;
  negativeMarking: boolean; attemptId: string; questions: Question[];
  initialState?: { answers?: Record<string, string | null>; flagged?: Record<string, boolean>; currentIndex?: number; timeLeft?: number } | null;
}

const DIFF_STYLE = {
  EASY:   "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  MEDIUM: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  HARD:   "bg-red-500/20 text-red-400 border border-red-500/30",
} as const;

export function ExamEngine({ exam }: { exam: ExamData }) {
  const router = useRouter();
  const { language } = useLanguage();
  const T = useT(language);
  const [currentIndex, setCurrentIndex] = useState(exam.initialState?.currentIndex ?? 0);
  const [answers,      setAnswers]      = useState<Record<string, string | null>>(exam.initialState?.answers ?? {});
  const [flagged,      setFlagged]      = useState<Record<string, boolean>>(exam.initialState?.flagged ?? {});
  const [timeLeft,     setTimeLeft]     = useState(exam.initialState?.timeLeft ?? exam.durationMinutes * 60);
  const [showSubmitModal,  setShowSubmitModal]  = useState(false);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const q            = exam.questions[currentIndex];
  const totalAnswered = Object.values(answers).filter(Boolean).length;
  const totalFlagged  = Object.values(flagged).filter(Boolean).length;
  const progressPct   = Math.round((totalAnswered / exam.questions.length) * 100);

  // Auto-save every 30 s
  useEffect(() => {
    const save = async () => {
      await fetch(`/api/exams/${exam.attemptId}/save`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, flagged, currentIndex, timeLeft }),
      }).catch(() => {});
    };
    const id = setInterval(save, 30000);
    return () => clearInterval(id);
  }, [answers, flagged, currentIndex, timeLeft, exam.attemptId]);

  // Timer countdown
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current!); setShowTimeoutModal(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, []);

  const handleSubmit = useCallback(async (timedOut = false) => {
    if (submitting || submitted) return;
    setSubmitting(true);
    clearInterval(timerRef.current!);
    try {
      const res = await fetch(`/api/exams/${exam.attemptId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, timedOut }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSubmitted(true);
      router.push(`/results/${exam.attemptId}`);
    } catch {
      toast.error("Failed to submit. Please try again.");
      setSubmitting(false);
    }
  }, [submitting, submitted, exam.attemptId, answers, router]);

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  const isUrgent  = timeLeft <= 300;
  const isWarning = timeLeft > 300 && timeLeft <= 600;

  // Split answers into two columns: left [A,B] and right [C,D]
  const half         = Math.ceil(q.answers.length / 2);
  const leftAnswers  = q.answers.slice(0, half);
  const rightAnswers = q.answers.slice(half);

  // ── Answer card ──────────────────────────────────────────────────────────
  function AnswerCard({ answer, letterIndex }: { answer: Answer; letterIndex: number }) {
    const selected = answers[q.id] === answer.id;
    const letter   = String.fromCharCode(65 + letterIndex);
    return (
      <button
        onClick={() => setAnswers((a) => ({ ...a, [q.id]: answer.id }))}
        className={cn(
          "w-full text-left rounded-2xl border-2 transition-all duration-150 group flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-5",
          selected
            ? "border-blue-500 bg-blue-600/20 dark:bg-blue-600/20 shadow-lg shadow-blue-900/20"
            : "border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-blue-400/60 dark:hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-white/10"
        )}
      >
        {/* Letter circle */}
        <span className={cn(
          "flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all",
          selected
            ? "border-blue-500 bg-blue-500 text-white"
            : "border-slate-300 dark:border-white/25 text-slate-500 dark:text-gray-400 group-hover:border-blue-400 dark:group-hover:border-blue-500 group-hover:text-blue-600 dark:group-hover:text-blue-400"
        )}>
          {letter}
        </span>

        {/* Answer text */}
        <span className={cn(
          "flex-1 text-sm sm:text-[14.5px] leading-snug font-medium",
          selected ? "text-blue-900 dark:text-blue-100" : "text-gray-700 dark:text-gray-200"
        )}>
          {t(answer.textEn, answer.textFr, language)}
        </span>

        {/* Check icon when selected */}
        {selected && (
          <CheckCircle className="flex-shrink-0 w-5 h-5 text-blue-500 dark:text-blue-400" />
        )}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-[#090d18] flex flex-col overflow-hidden">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 bg-white dark:bg-[#0d1120] border-b border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex items-center justify-between px-5 sm:px-7 h-14">

          {/* Left: logo + exam title */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 dark:text-white text-sm truncate max-w-[140px] sm:max-w-xs md:max-w-sm">{t(exam.titleEn, exam.titleFr, language)}</p>
              <p className="hidden sm:block text-[11px] text-gray-400 leading-none mt-0.5">
                {totalAnswered}/{exam.questions.length} {T("exam_answered")} · {T("exam_passing")}: {exam.passingScore}%
              </p>
            </div>
          </div>

          {/* Right: timer + submit */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={cn(
              "flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg font-mono font-bold text-sm transition-all",
              isUrgent  ? "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 animate-pulse" :
              isWarning ? "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400" :
                          "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-gray-200"
            )}>
              <Clock className="w-3.5 h-3.5" />
              {formatTime(timeLeft)}
            </div>
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-3 sm:px-4 py-1.5 text-sm font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
            >
              <span className="hidden sm:inline">{T("exam_submit")}</span>
              <span className="sm:hidden">Submit</span>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3 px-5 sm:px-7 pb-2.5">
          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-[11px] font-semibold text-gray-400 w-7 text-right tabular-nums">{progressPct}%</span>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Main panel ── */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-3 sm:px-6 py-3 sm:py-6 pb-6 flex flex-col gap-3 sm:gap-4">

            {/* Question card */}
            <div className="bg-white dark:bg-[#0d1120] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">

              {/* Card header */}
              <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-100 dark:border-white/10 bg-slate-50/80 dark:bg-white/5">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {T("exam_question")} {currentIndex + 1}
                    <span className="text-gray-300 dark:text-gray-600 mx-1">/</span>
                    {exam.questions.length}
                  </span>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full",
                    DIFF_STYLE[q.difficulty as keyof typeof DIFF_STYLE] ?? DIFF_STYLE.MEDIUM
                  )}>
                    {q.difficulty}
                  </span>
                </div>
                <button
                  onClick={() => setFlagged((f) => ({ ...f, [q.id]: !f[q.id] }))}
                  className={cn(
                    "flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors",
                    flagged[q.id]
                      ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400"
                      : "text-gray-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-gray-600 dark:hover:text-gray-200"
                  )}
                >
                  <Flag className="w-3.5 h-3.5" />
                  {flagged[q.id] ? T("exam_flagged") : T("exam_flag")}
                </button>
              </div>

              {/* Question text */}
              <div className="px-4 sm:px-7 py-4 sm:py-6">
                {q.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={q.imageUrl} alt="Clinical image" className="rounded-xl mb-4 max-h-48 object-contain border border-slate-200 dark:border-white/10" />
                )}
                <p className="text-[15px] sm:text-[16px] font-medium text-gray-900 dark:text-white leading-relaxed">
                  {t(q.textEn, q.textFr, language)}
                </p>
              </div>
            </div>

            {/* ── Answers ── */}
            {/* Mobile: flat single list */}
            <div className="flex flex-col gap-2 sm:hidden">
              {q.answers.map((answer, i) => (
                <AnswerCard key={answer.id} answer={answer} letterIndex={i} />
              ))}
            </div>

            {/* Desktop: 2-column grid */}
            <div className="hidden sm:grid sm:grid-cols-2 sm:gap-3">
              <div className="flex flex-col gap-3">
                {leftAnswers.map((answer, i) => (
                  <AnswerCard key={answer.id} answer={answer} letterIndex={i} />
                ))}
              </div>
              <div className="flex flex-col gap-3">
                {rightAnswers.map((answer, i) => (
                  <AnswerCard key={answer.id} answer={answer} letterIndex={half + i} />
                ))}
              </div>
            </div>

          </div>
        </main>

        {/* ── Right sidebar: question navigator (xl+) ── */}
        <aside className="hidden xl:flex flex-col w-60 border-l border-slate-200 dark:border-white/10 bg-white dark:bg-[#0d1120] overflow-y-auto flex-shrink-0">
          <div className="p-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-4">{T("exam_navigator")}</p>

            <div className="grid grid-cols-5 gap-1.5 mb-5">
              {exam.questions.map((question, i) => {
                const answered  = !!answers[question.id];
                const isFlagged = !!flagged[question.id];
                const isCurrent = i === currentIndex;
                return (
                  <button
                    key={question.id}
                    onClick={() => setCurrentIndex(i)}
                    className={cn(
                      "aspect-square rounded-lg text-[11px] font-bold transition-all",
                      isCurrent  ? "bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-1 dark:ring-offset-[#0d1120] shadow-sm" :
                      isFlagged  ? "bg-amber-400 text-amber-900" :
                      answered   ? "bg-emerald-500 text-white" :
                                   "bg-slate-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-white/20"
                    )}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="space-y-2 text-xs text-gray-400 mb-5">
              {[
                { color: "bg-emerald-500",                label: T("exam_answered")  },
                { color: "bg-amber-400",                  label: T("exam_flagged")   },
                { color: "bg-blue-600",                   label: T("exam_current") },
                { color: "bg-slate-200 dark:bg-white/10", label: T("exam_unanswered") },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className={cn("w-2.5 h-2.5 rounded flex-shrink-0", color)} />
                  {label}
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 p-3.5 space-y-2 text-sm">
              {[
                { label: T("exam_answered"),  value: totalAnswered,                         color: "text-emerald-600 dark:text-emerald-400" },
                { label: T("exam_remaining"), value: exam.questions.length - totalAnswered, color: "text-gray-700 dark:text-gray-300"       },
                { label: T("exam_flagged"),   value: totalFlagged,                          color: "text-amber-500"                         },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-400">{label}</span>
                  <span className={cn("font-bold", color)}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* ── Bottom navigation ───────────────────────────────────────────── */}
      <footer className="flex-shrink-0 bg-white dark:bg-[#0d1120] border-t border-slate-200 dark:border-white/10 px-3 sm:px-7 py-3 pb-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto gap-3">

          {/* Previous */}
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="flex items-center gap-1.5 px-4 py-3 text-sm font-semibold rounded-xl border border-slate-200 dark:border-white/15 text-gray-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-white/10 disabled:opacity-35 disabled:cursor-not-allowed transition-colors min-w-[90px] justify-center"
          >
            <ChevronLeft className="w-4 h-4 flex-shrink-0" />
            <span>{T("exam_previous")}</span>
          </button>

          {/* Counter */}
          <span className="text-xs text-gray-400 font-bold tabular-nums whitespace-nowrap">
            {currentIndex + 1} / {exam.questions.length}
          </span>

          {/* Next / Finish */}
          {currentIndex < exam.questions.length - 1 ? (
            <button
              onClick={() => setCurrentIndex((i) => i + 1)}
              className="flex items-center gap-1.5 px-4 py-3 text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white transition-colors shadow-sm min-w-[90px] justify-center"
            >
              <span>{T("exam_next")}</span>
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
            </button>
          ) : (
            <button
              onClick={() => setShowSubmitModal(true)}
              className="flex items-center gap-1.5 px-4 py-3 text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm min-w-[90px] justify-center"
            >
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{T("exam_finish")}</span>
            </button>
          )}
        </div>
      </footer>

      {/* ── Submit confirmation modal ── */}
      <Modal open={showSubmitModal} onClose={() => setShowSubmitModal(false)} title={T("exam_submit") + "?"}>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: T("exam_answered"),   value: totalAnswered,                         color: "text-emerald-600 dark:text-emerald-400" },
              { label: T("exam_unanswered"), value: exam.questions.length - totalAnswered, color: "text-red-500"                           },
              { label: T("exam_flagged"),    value: totalFlagged,                          color: "text-amber-500"                         },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                <div className={cn("text-2xl font-bold", color)}>{value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
          {exam.questions.length - totalAnswered > 0 && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/30">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-400">
                {exam.questions.length - totalAnswered} {T("exam_unanswered_warning")}
              </p>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => setShowSubmitModal(false)}
              className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200 dark:border-white/15 text-gray-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
            >
              {T("exam_continue")}
            </button>
            <button
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="flex-1 px-4 py-2.5 text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-60"
            >
              {submitting ? T("exam_submitting") : T("exam_submit")}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Time-out modal ── */}
      <Modal open={showTimeoutModal} onClose={() => {}} title="Time&apos;s Up">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-sm">{T("exam_timeout_msg")}</p>
          <button
            onClick={() => handleSubmit(true)}
            disabled={submitting}
            className="w-full px-4 py-2.5 text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-60"
          >
            {submitting ? T("exam_submitting") : T("exam_submit_my")}
          </button>
        </div>
      </Modal>
    </div>
  );
}
