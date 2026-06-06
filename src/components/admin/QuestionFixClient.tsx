"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wrench, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Save, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Answer {
  id: string;
  text_en: string;
  text_fr: string | null;
  is_correct: boolean;
  order: number;
}

interface Question {
  id: string;
  text_en: string;
  text_fr: string | null;
  language: string;
  difficulty: string;
  license_categories: string[];
  category: { id: string; name_en: string } | null;
  answers: Answer[];
  reasons: string[];
  exams: { examId: string; title: string }[];
}

interface Props {
  questions: Question[];
  total: number;
}

const DIFF_CLS: Record<string, string> = {
  EASY:   "bg-emerald-100 text-emerald-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  HARD:   "bg-red-100 text-red-700",
};

function QuestionFixRow({ q }: { q: Question }) {
  const router = useRouter();
  const [expanded,  setExpanded]  = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [fixed,     setFixed]     = useState(false);

  const [textEn,    setTextEn]    = useState(q.text_en ?? "");
  const [textFr,    setTextFr]    = useState(q.text_fr ?? "");
  const [answers,   setAnswers]   = useState<Answer[]>(q.answers);

  function updateAnswer(idx: number, field: keyof Answer, value: string | boolean) {
    setAnswers((prev) => prev.map((a, i) => i === idx ? { ...a, [field]: value } : a));
  }

  function setCorrect(idx: number) {
    setAnswers((prev) => prev.map((a, i) => ({ ...a, is_correct: i === idx })));
  }

  async function handleSave() {
    if (!textEn.trim()) return toast.error("Question text (EN) is required");
    if (answers.length < 2) return toast.error("At least 2 answers required");
    if (!answers.some((a) => a.is_correct)) return toast.error("Mark one answer as correct");

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/questions/${q.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text_en: textEn.trim(),
          text_fr: textFr.trim() || null,
          difficulty: q.difficulty,
          category_id: q.category?.id ?? null,
          license_categories: q.license_categories,
          language: q.language,
          answers: answers.map((a) => ({
            text_en: a.text_en,
            text_fr: a.text_fr || null,
            is_correct: a.is_correct,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFixed(true);
      toast.success("Question fixed and saved");
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={cn(
      "rounded-2xl border overflow-hidden transition-all",
      fixed
        ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-900/10"
        : "border-orange-200 dark:border-orange-800/50 bg-white dark:bg-gray-900"
    )}>

      {/* Row header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
      >
        {/* Status icon */}
        <div className={cn("mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
          fixed ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-orange-100 dark:bg-orange-900/30"
        )}>
          {fixed
            ? <CheckCircle className="w-4 h-4 text-emerald-500" />
            : <AlertTriangle className="w-4 h-4 text-orange-500" />
          }
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded", DIFF_CLS[q.difficulty] ?? DIFF_CLS.MEDIUM)}>
              {q.difficulty}
            </span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded", q.language === "FR" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600")}>
              {q.language}
            </span>
            {q.category && (
              <span className="text-[10px] text-gray-500">{q.category.name_en}</span>
            )}
            {q.exams.length > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                <FileText className="w-3 h-3" />
                Used in {q.exams.length} exam{q.exams.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Current (corrupt) text */}
          <p className="text-sm text-gray-800 dark:text-gray-200 font-medium truncate">
            {q.text_en || <span className="text-gray-400 italic">Empty text</span>}
          </p>

          {/* Reason badges */}
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {q.reasons.map((r) => (
              <span key={r} className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                ⚠ {r}
              </span>
            ))}
          </div>
        </div>

        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />}
      </button>

      {/* Expanded editor */}
      {expanded && (
        <div className="px-4 pb-5 pt-1 space-y-4 border-t border-gray-100 dark:border-gray-800">

          {/* Exams using this question */}
          {q.exams.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs font-semibold text-gray-500">Used in:</span>
              {q.exams.map((e) => (
                <span key={e.examId} className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
                  {e.title}
                </span>
              ))}
            </div>
          )}

          {/* Question text EN */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Question Text (EN) <span className="text-red-500">*</span>
            </label>
            <textarea
              value={textEn}
              onChange={(e) => setTextEn(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Enter the correct question text in English…"
            />
          </div>

          {/* Question text FR */}
          {q.language === "FR" && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Question Text (FR)
              </label>
              <textarea
                value={textFr}
                onChange={(e) => setTextFr(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Entrez le texte de la question en français…"
              />
            </div>
          )}

          {/* Answers */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">
              Answer Options — click the letter to mark as correct
            </label>
            <div className="space-y-2">
              {answers.map((answer, idx) => (
                <div key={answer.id ?? idx} className="flex items-center gap-2">
                  {/* Letter / correct toggle */}
                  <button
                    type="button"
                    onClick={() => setCorrect(idx)}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border-2 transition-all",
                      answer.is_correct
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-emerald-400 hover:text-emerald-500"
                    )}
                    title={answer.is_correct ? "Correct answer" : "Mark as correct"}
                  >
                    {String.fromCharCode(65 + idx)}
                  </button>

                  {/* Answer text EN */}
                  <input
                    value={answer.text_en}
                    onChange={(e) => updateAnswer(idx, "text_en", e.target.value)}
                    className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={`Answer ${String.fromCharCode(65 + idx)} (EN)`}
                  />

                  {/* Answer text FR if needed */}
                  {q.language === "FR" && (
                    <input
                      value={answer.text_fr ?? ""}
                      onChange={(e) => updateAnswer(idx, "text_fr", e.target.value)}
                      className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder={`Answer ${String.fromCharCode(65 + idx)} (FR)`}
                    />
                  )}

                  {answer.is_correct && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">✓ Correct</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Save button */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleSave}
              disabled={saving || fixed}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50"
            >
              {fixed ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving…" : fixed ? "Fixed ✓" : "Save Fix"}
            </button>
            <button
              onClick={() => setExpanded(false)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function QuestionFixClient({ questions, total }: Props) {
  const [filter, setFilter] = useState<"all" | "in_exam" | "no_exam">("all");

  const filtered = questions.filter((q) => {
    if (filter === "in_exam")  return q.exams.length > 0;
    if (filter === "no_exam")  return q.exams.length === 0;
    return true;
  });

  const inExamCount = questions.filter((q) => q.exams.length > 0).length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-sm flex-shrink-0">
          <Wrench className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Question Fix Tool</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {total} question{total !== 1 ? "s" : ""} with data issues detected
          </p>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center">
          <p className="text-2xl font-bold text-orange-500">{total}</p>
          <p className="text-xs text-gray-400 mt-0.5">Total Issues</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center">
          <p className="text-2xl font-bold text-red-500">{inExamCount}</p>
          <p className="text-xs text-gray-400 mt-0.5">Used in Exams</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center">
          <p className="text-2xl font-bold text-gray-400">{total - inExamCount}</p>
          <p className="text-xs text-gray-400 mt-0.5">Not in Any Exam</p>
        </div>
      </div>

      {inExamCount > 0 && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30">
          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">
            <span className="font-semibold">{inExamCount} broken questions are currently live in exams.</span> Students will see corrupt text until these are fixed. Fix those first.
          </p>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2">
        {([
          { key: "all",      label: `All (${total})` },
          { key: "in_exam",  label: `In Exams (${inExamCount})` },
          { key: "no_exam",  label: `Not in Exams (${total - inExamCount})` },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "px-4 py-2 text-xs font-semibold rounded-xl transition-colors",
              filter === key
                ? "bg-indigo-600 text-white"
                : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Question list */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No issues found in this category.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => (
            <QuestionFixRow key={q.id} q={q} />
          ))}
        </div>
      )}
    </div>
  );
}
