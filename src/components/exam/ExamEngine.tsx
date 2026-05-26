"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Flag, ChevronLeft, ChevronRight, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Answer { id: string; textEn: string; textFr?: string | null; }
interface Question { id: string; textEn: string; textFr?: string | null; imageUrl?: string | null; difficulty: string; answers: Answer[]; }
interface ExamData {
  id: string; title: string; durationMinutes: number; passingScore: number;
  negativeMarking: boolean; attemptId: string; questions: Question[];
}

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
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setShowTimeoutModal(true);
          return 0;
        }
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
    } catch (err) {
      toast.error("Failed to submit exam. Please try again.");
      setSubmitting(false);
    }
  }, [submitting, submitted, exam.attemptId, answers, router]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const timerColor = timeLeft <= 300 ? "text-red-500" : timeLeft <= 600 ? "text-yellow-500" : "text-gray-700 dark:text-gray-300";

  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-gray-950 flex flex-col exam-mode">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1 max-w-xs">{exam.title}</span>
          <span className="text-xs text-gray-400 hidden sm:block">{totalAnswered}/{exam.questions.length} answered</span>
        </div>
        <div className="flex items-center gap-4">
          <div className={cn("flex items-center gap-1.5 font-mono text-lg font-bold", timerColor)}>
            <Clock className="w-5 h-5" />
            {formatTime(timeLeft)}
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowSubmitModal(true)}>
            Submit Exam
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 sm:px-6 py-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <Progress value={totalAnswered} max={exam.questions.length} barClassName="bg-indigo-500" />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Question panel */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-3xl mx-auto">
            {/* Question header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Question {currentIndex + 1} of {exam.questions.length}
                </span>
                <span className={cn(
                  "ml-3 text-xs font-medium px-2 py-0.5 rounded-full",
                  currentQuestion.difficulty === "EASY" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : currentQuestion.difficulty === "HARD" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                )}>
                  {currentQuestion.difficulty}
                </span>
              </div>
              <button
                onClick={() => setFlagged((f) => ({ ...f, [currentQuestion.id]: !f[currentQuestion.id] }))}
                className={cn(
                  "flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors",
                  flagged[currentQuestion.id]
                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <Flag className="w-4 h-4" />
                {flagged[currentQuestion.id] ? "Flagged" : "Flag"}
              </button>
            </div>

            {/* Question image */}
            {currentQuestion.imageUrl && (
              <img src={currentQuestion.imageUrl} alt="Question" className="rounded-lg mb-6 max-h-64 object-contain" />
            )}

            {/* Question text */}
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-6 leading-relaxed">
              {currentQuestion.textEn}
            </p>

            {/* Answers */}
            <div className="space-y-3">
              {currentQuestion.answers.map((answer, i) => {
                const selected = answers[currentQuestion.id] === answer.id;
                return (
                  <button
                    key={answer.id}
                    onClick={() => setAnswers((a) => ({ ...a, [currentQuestion.id]: answer.id }))}
                    className={cn(
                      "w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-150",
                      selected
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-900 dark:text-indigo-100"
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className={cn(
                        "flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-bold",
                        selected ? "border-indigo-500 bg-indigo-500 text-white" : "border-gray-300 dark:border-gray-600 text-gray-400"
                      )}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="leading-relaxed">{answer.textEn}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Question grid sidebar */}
        <div className="hidden xl:flex flex-col w-64 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Question Navigator</h3>
          <div className="grid grid-cols-5 gap-1.5 mb-6">
            {exam.questions.map((q, i) => {
              const answered = !!answers[q.id];
              const isFlagged = !!flagged[q.id];
              const isCurrent = i === currentIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(i)}
                  className={cn(
                    "w-full aspect-square rounded-lg text-xs font-medium transition-colors",
                    isCurrent ? "bg-indigo-600 text-white" :
                    isFlagged ? "bg-yellow-400 text-yellow-900" :
                    answered ? "bg-green-500 text-white" :
                    "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  )}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-green-500 inline-block" />Answered</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-yellow-400 inline-block" />Flagged</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-indigo-600 inline-block" />Current</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-gray-200 dark:bg-gray-700 inline-block" />Not answered</div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-1 text-sm">
            <div className="flex justify-between text-gray-500 dark:text-gray-400"><span>Answered</span><span className="font-medium text-gray-900 dark:text-white">{totalAnswered}</span></div>
            <div className="flex justify-between text-gray-500 dark:text-gray-400"><span>Unanswered</span><span className="font-medium text-gray-900 dark:text-white">{exam.questions.length - totalAnswered}</span></div>
            <div className="flex justify-between text-gray-500 dark:text-gray-400"><span>Flagged</span><span className="font-medium text-yellow-500">{totalFlagged}</span></div>
          </div>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex-shrink-0">
        <Button
          variant="outline"
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </Button>

        <span className="text-sm text-gray-500 dark:text-gray-400">
          {currentIndex + 1} / {exam.questions.length}
        </span>

        {currentIndex < exam.questions.length - 1 ? (
          <Button onClick={() => setCurrentIndex((i) => i + 1)} className="gap-2">
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={() => setShowSubmitModal(true)} className="gap-2 bg-green-600 hover:bg-green-700">
            <CheckCircle className="w-4 h-4" /> Finish
          </Button>
        )}
      </div>

      {/* Submit confirmation modal */}
      <Modal open={showSubmitModal} onClose={() => setShowSubmitModal(false)} title="Submit Exam?">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: "Answered", value: totalAnswered, color: "text-green-600" },
              { label: "Unanswered", value: exam.questions.length - totalAnswered, color: "text-red-500" },
              { label: "Flagged", value: totalFlagged, color: "text-yellow-500" },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-xs text-gray-400">{label}</div>
              </div>
            ))}
          </div>
          {exam.questions.length - totalAnswered > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p className="text-sm">You have {exam.questions.length - totalAnswered} unanswered questions.</p>
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowSubmitModal(false)}>Cancel</Button>
            <Button className="flex-1 bg-green-600 hover:bg-green-700" loading={submitting} onClick={() => handleSubmit(false)}>
              Submit Exam
            </Button>
          </div>
        </div>
      </Modal>

      {/* Timeout modal */}
      <Modal open={showTimeoutModal} onClose={() => {}} title="Time's Up!">
        <div className="text-center space-y-4">
          <Clock className="w-12 h-12 text-red-500 mx-auto" />
          <p className="text-gray-600 dark:text-gray-300">Your time has expired. The exam will be submitted automatically.</p>
          <Button loading={submitting} className="w-full" onClick={() => handleSubmit(true)}>
            Submit Now
          </Button>
        </div>
      </Modal>
    </div>
  );
}
