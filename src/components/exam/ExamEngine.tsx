"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Flag, ChevronLeft, ChevronRight, Clock, AlertTriangle, CheckCircle, BookOpen } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Answer  { id: string; textEn: string; textFr?: string | null; }
interface Question { id: string; textEn: string; textFr?: string | null; imageUrl?: string | null; difficulty: string; answers: Answer[]; }
interface ExamData {
  id: string; title: string; durationMinutes: number; passingScore: number;
  negativeMarking: boolean; attemptId: string; questions: Question[];
}

const DIFF_STYLE = {
  EASY: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  MEDIUM: "bg-amber-100 text-amber-700 border border-amber-200",
  HARD: "bg-red-100 text-red-700 border border-red-200",
} as const;

export function ExamEngine({ exam }: { exam: ExamData }) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(exam.durationMinutes * 60);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentQuestion = exam.questions[currentIndex];
  const totalAnswered = Object.values(answers).filter(Boolean).length;
  const totalFlagged = Object.values(flagged).filter(Boolean).length;
  const progressPct = Math.round((totalAnswered / exam.questions.length) * 100);

  // Save progress periodically
  useEffect(() => {
    const save = async () => {
      await fetch(`/api/exams/${exam.attemptId}/save`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, flagged, currentIndex, timeLeft }),
      }).catch(() => {});
    };
    const interval = setInterval(save, 30000);
    return () => clearInterval(interval);
  }, [answers, flagged, currentIndex, timeLeft, exam.attemptId]);

  // Timer
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

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const isUrgent = timeLeft <= 300;
  const isWarning = timeLeft > 300 && timeLeft <= 600;

  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-gray-950 flex flex-col">

      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center justify-between px-4 sm:px-6 h-14">

          {/* Left — exam title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white text-sm truncate max-w-[240px] sm:max-w-xs">{exam.title}</p>
              <p className="text-[11px] text-gray-400 hidden sm:block">
                {totalAnswered} of {exam.questions.length} answered · Passing: {exam.passingScore}%
              </p>
            </div>
          </div>

          {/* Right — timer + submit */}
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-bold text-sm transition-colors",
              isUrgent  ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 animate-pulse" :
              isWarning ? "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400" :
                          "bg-slate-100 text-slate-700 dark:bg-gray-800 dark:text-gray-300"
            )}>
              <Clock className="w-3.5 h-3.5" />
              {formatTime(timeLeft)}
            </div>
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-blue-700 hover:bg-blue-800 text-white transition-colors shadow-sm"
            >
              Submit Exam
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-4 sm:px-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-[11px] font-medium text-gray-400 w-8 text-right">{progressPct}%</span>
          </div>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Question + answers */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8">

            {/* Question card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm overflow-hidden mb-5">

              {/* Card header */}
              <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 dark:border-gray-800 bg-slate-50 dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Question {currentIndex + 1} <span className="text-gray-300 dark:text-gray-600">/</span> {exam.questions.length}
                  </span>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full",
                    DIFF_STYLE[currentQuestion.difficulty as keyof typeof DIFF_STYLE] ?? DIFF_STYLE.MEDIUM
                  )}>
                    {currentQuestion.difficulty}
                  </span>
                </div>
                <button
                  onClick={() => setFlagged((f) => ({ ...f, [currentQuestion.id]: !f[currentQuestion.id] }))}
                  className={cn(
                    "flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors",
                    flagged[currentQuestion.id]
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      : "text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300"
                  )}
                >
                  <Flag className="w-3.5 h-3.5" />
                  {flagged[currentQuestion.id] ? "Flagged" : "Flag"}
                </button>
              </div>

              {/* Question body */}
              <div className="px-6 py-6">
                {currentQuestion.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentQuestion.imageUrl} alt="Clinical image" className="rounded-xl mb-5 max-h-60 object-contain border border-slate-200 dark:border-gray-700" />
                )}
                <p className="text-[16px] font-medium text-gray-900 dark:text-white leading-relaxed">
                  {currentQuestion.textEn}
                </p>
              </div>
            </div>

            {/* Answer options */}
            <div className="space-y-2.5">
              {currentQuestion.answers.map((answer, i) => {
                const selected = answers[currentQuestion.id] === answer.id;
                const letter = String.fromCharCode(65 + i);
                return (
                  <button
                    key={answer.id}
                    onClick={() => setAnswers((a) => ({ ...a, [currentQuestion.id]: answer.id }))}
                    className={cn(
                      "w-full text-left rounded-xl border-2 transition-all duration-150 group",
                      selected
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-sm shadow-blue-100 dark:shadow-none"
                        : "border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm"
                    )}
                  >
                    <div className="flex items-center gap-4 px-5 py-3.5">
                      <span className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all",
                        selected
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-300 dark:border-gray-600 text-slate-500 dark:text-gray-400 group-hover:border-blue-400 dark:group-hover:border-blue-500"
                      )}>
                        {letter}
                      </span>
                      <span className={cn(
                        "text-[14.5px] leading-snug font-medium",
                        selected ? "text-blue-900 dark:text-blue-100" : "text-gray-700 dark:text-gray-300"
                      )}>
                        {answer.textEn}
                      </span>
                      {selected && (
                        <span className="ml-auto flex-shrink-0">
                          <CheckCircle className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </main>

        {/* ── Right sidebar — question navigator ── */}
        <aside className="hidden xl:flex flex-col w-64 border-l border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-y-auto flex-shrink-0">
          <div className="p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Navigator</p>

            <div className="grid grid-cols-5 gap-1.5 mb-5">
              {exam.questions.map((q, i) => {
                const answered  = !!answers[q.id];
                const isFlagged = !!flagged[q.id];
                const isCurrent = i === currentIndex;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(i)}
                    className={cn(
                      "aspect-square rounded-lg text-xs font-bold transition-all",
                      isCurrent  ? "bg-blue-700 text-white shadow-sm shadow-blue-200 dark:shadow-none ring-2 ring-blue-700 ring-offset-1 dark:ring-offset-gray-900" :
                      isFlagged  ? "bg-amber-400 text-amber-900" :
                      answered   ? "bg-emerald-500 text-white" :
                                   "bg-slate-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-700"
                    )}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400 mb-5">
              {[
                { color: "bg-emerald-500", label: "Answered" },
                { color: "bg-amber-400",   label: "Flagged" },
                { color: "bg-blue-700",    label: "Current" },
                { color: "bg-slate-200 dark:bg-gray-700", label: "Not answered" },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className={cn("w-3 h-3 rounded flex-shrink-0", color)} />
                  {label}
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="rounded-xl bg-slate-50 dark:bg-gray-800/60 p-3.5 space-y-2 text-sm">
              {[
                { label: "Answered",    value: totalAnswered,                              color: "text-emerald-600 dark:text-emerald-400" },
                { label: "Unanswered",  value: exam.questions.length - totalAnswered,      color: "text-gray-700 dark:text-gray-300" },
                { label: "Flagged",     value: totalFlagged,                               color: "text-amber-500" },
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

      {/* ── Bottom nav ──────────────────────────────────────────────────── */}
      <footer className="flex-shrink-0 bg-white dark:bg-gray-900 border-t border-slate-200 dark:border-gray-800 px-4 sm:px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <div className="flex items-center gap-1.5">
            {exam.questions.slice(Math.max(0, currentIndex - 2), Math.min(exam.questions.length, currentIndex + 3)).map((q, _, arr) => {
              const absIdx = exam.questions.indexOf(q);
              const isCurrent = absIdx === currentIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(absIdx)}
                  className={cn(
                    "w-7 h-7 rounded-full text-xs font-bold transition-colors",
                    isCurrent
                      ? "bg-blue-700 text-white"
                      : answers[q.id]
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800"
                  )}
                >
                  {absIdx + 1}
                </button>
              );
            })}
          </div>

          {currentIndex < exam.questions.length - 1 ? (
            <button
              onClick={() => setCurrentIndex((i) => i + 1)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-blue-700 hover:bg-blue-800 text-white transition-colors shadow-sm"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setShowSubmitModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
            >
              <CheckCircle className="w-4 h-4" /> Finish
            </button>
          )}
        </div>
      </footer>

      {/* ── Submit modal ── */}
      <Modal open={showSubmitModal} onClose={() => setShowSubmitModal(false)} title="Submit Exam?">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: "Answered",   value: totalAnswered,                         color: "text-emerald-600" },
              { label: "Unanswered", value: exam.questions.length - totalAnswered, color: "text-red-500"     },
              { label: "Flagged",    value: totalFlagged,                          color: "text-amber-500"   },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-3 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-100 dark:border-gray-700">
                <div className={cn("text-2xl font-bold", color)}>{value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
          {exam.questions.length - totalAnswered > 0 && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-400">
                {exam.questions.length - totalAnswered} question{exam.questions.length - totalAnswered > 1 ? "s" : ""} left unanswered.
              </p>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => setShowSubmitModal(false)}
              className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
            >
              Continue Exam
            </button>
            <button
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit Exam"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Timeout modal ── */}
      <Modal open={showTimeoutModal} onClose={() => {}} title="Time's Up">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Your allotted time has expired. Your answers will be submitted now.</p>
          <button
            onClick={() => handleSubmit(true)}
            disabled={submitting}
            className="w-full px-4 py-2.5 text-sm font-semibold rounded-xl bg-blue-700 hover:bg-blue-800 text-white transition-colors disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit My Exam"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
