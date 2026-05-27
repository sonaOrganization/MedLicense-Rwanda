"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Trash2, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface Category { id: string; name_en: string; }
interface AnswerField { text_en: string; is_correct: boolean; }

interface QuestionFormModalProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  /** Pass existing question to edit, omit for create */
  question?: {
    id: string;
    text_en: string;
    explanation_en?: string | null;
    difficulty: string;
    category_id: string;
    answers: { id?: string; text_en: string; is_correct: boolean }[];
  };
}

const EMPTY_ANSWERS: AnswerField[] = [
  { text_en: "", is_correct: true  },
  { text_en: "", is_correct: false },
  { text_en: "", is_correct: false },
  { text_en: "", is_correct: false },
];

export function QuestionFormModal({ open, onClose, categories, question }: QuestionFormModalProps) {
  const router = useRouter();
  const isEdit = !!question;

  const [textEn,       setTextEn]       = useState("");
  const [explanationEn, setExplanationEn] = useState("");
  const [difficulty,   setDifficulty]   = useState("MEDIUM");
  const [categoryId,   setCategoryId]   = useState("");
  const [answers,      setAnswers]      = useState<AnswerField[]>(EMPTY_ANSWERS);
  const [saving,       setSaving]       = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (question) {
      setTextEn(question.text_en);
      setExplanationEn(question.explanation_en ?? "");
      setDifficulty(question.difficulty);
      setCategoryId(question.category_id);
      setAnswers(question.answers.map((a) => ({ text_en: a.text_en, is_correct: a.is_correct })));
    } else {
      setTextEn("");
      setExplanationEn("");
      setDifficulty("MEDIUM");
      setCategoryId(categories[0]?.id ?? "");
      setAnswers(EMPTY_ANSWERS.map((a) => ({ ...a })));
    }
  }, [question, categories, open]);

  function setCorrect(idx: number) {
    setAnswers((prev) => prev.map((a, i) => ({ ...a, is_correct: i === idx })));
  }

  function updateAnswer(idx: number, text: string) {
    setAnswers((prev) => prev.map((a, i) => i === idx ? { ...a, text_en: text } : a));
  }

  function addAnswer() {
    if (answers.length >= 6) return;
    setAnswers((prev) => [...prev, { text_en: "", is_correct: false }]);
  }

  function removeAnswer(idx: number) {
    if (answers.length <= 2) return;
    const next = answers.filter((_, i) => i !== idx);
    // ensure one correct
    if (!next.some((a) => a.is_correct)) next[0].is_correct = true;
    setAnswers(next);
  }

  async function handleSave() {
    if (!textEn.trim()) return toast.error("Question text is required");
    if (!categoryId)    return toast.error("Select a category");
    if (!answers.some((a) => a.is_correct)) return toast.error("Mark one answer as correct");
    if (answers.some((a) => !a.text_en.trim())) return toast.error("All answer fields must be filled in");

    setSaving(true);
    try {
      const url    = isEdit ? `/api/admin/questions/${question!.id}` : "/api/admin/questions";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text_en: textEn.trim(), explanation_en: explanationEn.trim() || null, difficulty, category_id: categoryId, answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(isEdit ? "Question updated" : "Question created");
      router.refresh();
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <h2 className="font-bold text-gray-900 dark:text-white">{isEdit ? "Edit Question" : "Add New Question"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Category + Difficulty */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Category *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name_en}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Difficulty *</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
          </div>

          {/* Question text */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Question Text *</label>
            <textarea
              value={textEn}
              onChange={(e) => setTextEn(e.target.value)}
              rows={3}
              placeholder="A 45-year-old patient presents with..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Answers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Answer Options * <span className="font-normal text-gray-400">(click circle to mark correct)</span></label>
              {answers.length < 6 && (
                <button onClick={addAnswer} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                  <Plus className="w-3.5 h-3.5" /> Add option
                </button>
              )}
            </div>
            <div className="space-y-2">
              {answers.map((ans, i) => (
                <div key={i} className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border-2 transition-colors",
                  ans.is_correct
                    ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10"
                    : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                )}>
                  <button
                    type="button"
                    onClick={() => setCorrect(i)}
                    title="Mark as correct answer"
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors",
                      ans.is_correct
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-gray-300 dark:border-gray-600 text-gray-400 hover:border-emerald-400"
                    )}
                  >
                    {ans.is_correct ? <CheckCircle className="w-3.5 h-3.5" /> : <span className="text-xs font-bold">{String.fromCharCode(65 + i)}</span>}
                  </button>
                  <input
                    value={ans.text_en}
                    onChange={(e) => updateAnswer(i, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                  />
                  {answers.length > 2 && (
                    <button onClick={() => removeAnswer(i)} className="text-gray-300 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Explanation <span className="font-normal">(shown after submission)</span></label>
            <textarea
              value={explanationEn}
              onChange={(e) => setExplanationEn(e.target.value)}
              rows={2}
              placeholder="Explain why the correct answer is right..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex-shrink-0 bg-gray-50 dark:bg-gray-900">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-sm font-semibold rounded-lg bg-blue-700 hover:bg-blue-800 text-white transition-colors disabled:opacity-60"
          >
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Question"}
          </button>
        </div>
      </div>
    </div>
  );
}
