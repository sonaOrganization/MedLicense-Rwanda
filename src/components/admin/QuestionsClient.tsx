"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Upload, Edit, Trash2, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { QuestionFormModal } from "./QuestionFormModal";
import { CSVUploadModal } from "./CSVUploadModal";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Answer   { id?: string; text_en: string; is_correct: boolean; }
interface Question {
  id: string; text_en: string; explanation_en?: string | null;
  difficulty: string; is_approved: boolean; category_id: string;
  category: { id: string; name_en: string };
  answers: Answer[];
}
interface Category { id: string; name_en: string; }

interface Props {
  questions: Question[];
  categories: Category[];
  currentCategory: string;
  currentApproved: string;
}

const DIFF: Record<string, string> = {
  EASY:   "bg-emerald-100 text-emerald-700 border-emerald-200",
  MEDIUM: "bg-amber-100 text-amber-700 border-amber-200",
  HARD:   "bg-red-100 text-red-700 border-red-200",
};

export function QuestionsClient({ questions, categories, currentCategory, currentApproved }: Props) {
  const router = useRouter();
  const [addOpen,    setAddOpen]    = useState(false);
  const [csvOpen,    setCsvOpen]    = useState(false);
  const [editQ,      setEditQ]      = useState<Question | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this question? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/questions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Question deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete question");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Question Bank</h1>
          <p className="text-sm text-gray-400 mt-0.5">{questions.length} question{questions.length !== 1 ? "s" : ""} shown</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCsvOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Upload className="w-4 h-4" /> Import CSV
          </button>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-blue-700 hover:bg-blue-800 text-white transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Question
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <form className="flex flex-wrap gap-3">
        <select
          name="category"
          defaultValue={currentCategory}
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name_en}</option>)}
        </select>
        <select
          name="approved"
          defaultValue={currentApproved}
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="">All Status</option>
          <option value="true">Approved</option>
          <option value="false">Pending</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Filter
        </button>
      </form>

      {/* ── Question list ── */}
      <div className="space-y-3">
        {questions.length === 0 && (
          <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
            <p className="font-medium">No questions found</p>
            <p className="text-sm mt-1">Add your first question or import a CSV file.</p>
          </div>
        )}
        {questions.map((q) => (
          <div
            key={q.id}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
          >
            <div className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 px-2 py-0.5 rounded-full">
                      {q.category.name_en}
                    </span>
                    <span className={cn("text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border", DIFF[q.difficulty] ?? DIFF.MEDIUM)}>
                      {q.difficulty}
                    </span>
                    {q.is_approved
                      ? <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400"><CheckCircle className="w-3 h-3" />Approved</span>
                      : <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400"><Clock className="w-3 h-3" />Pending</span>
                    }
                  </div>

                  {/* Question text */}
                  <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug line-clamp-2">{q.text_en}</p>

                  {/* Answers preview */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {q.answers.map((a, i) => (
                      <span
                        key={a.id ?? i}
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-md border",
                          a.is_correct
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800/40 dark:text-emerald-400 font-semibold"
                            : "bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
                        )}
                      >
                        {String.fromCharCode(65 + i)}. {a.text_en.length > 40 ? a.text_en.slice(0, 40) + "…" : a.text_en}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => setEditQ(q)}
                    className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    title="Edit question"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    disabled={deletingId === q.id}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                    title="Delete question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Modals ── */}
      <QuestionFormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        categories={categories}
      />
      <QuestionFormModal
        open={!!editQ}
        onClose={() => setEditQ(null)}
        categories={categories}
        question={editQ ?? undefined}
      />
      <CSVUploadModal
        open={csvOpen}
        onClose={() => setCsvOpen(false)}
      />
    </>
  );
}
