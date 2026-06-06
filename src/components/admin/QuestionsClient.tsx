"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Upload, Edit, Trash2, CheckCircle, Clock, Wand2, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { QuestionFormModal } from "./QuestionFormModal";
import { CSVUploadModal } from "./CSVUploadModal";
import { getLicenseCategoryLabel } from "@/lib/license-categories";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Answer   { id?: string; text_en: string; text_fr?: string | null; is_correct: boolean; }
interface Question {
  id: string; text_en: string; text_fr?: string | null;
  explanation_en?: string | null; explanation_fr?: string | null;
  difficulty: string; is_approved: boolean; category_id: string;
  license_categories?: string[] | null;
  language?: string | null;
  category: { id: string; name_en: string };
  answers: Answer[];
}
interface Category { id: string; name_en: string; }

interface Props {
  questions: Question[];
  categories: Category[];
  currentCategory: string;
  currentApproved: string;
  currentIncomplete: string;
  totalCount: number;
  enCount: number;
  frCount: number;
}

const DIFF: Record<string, string> = {
  EASY:   "bg-emerald-100 text-emerald-700 border-emerald-200",
  MEDIUM: "bg-amber-100 text-amber-700 border-amber-200",
  HARD:   "bg-red-100 text-red-700 border-red-200",
};

export function QuestionsClient({ questions, categories, currentCategory, currentApproved, currentIncomplete, totalCount, enCount, frCount }: Props) {
  const router = useRouter();
  const [addOpen,    setAddOpen]    = useState(false);
  const [csvOpen,    setCsvOpen]    = useState(false);
  const [editQ,      setEditQ]      = useState<Question | null>(null);
  const [deletingId,  setDeletingId]  = useState<string | null>(null);
  const [fixingLang,     setFixingLang]     = useState(false);
  const [fixingLic,      setFixingLic]      = useState(false);
  const [fixingDiffLang, setFixingDiffLang] = useState(false);

  async function handleFixLanguage() {
    if (!confirm("Auto-assign language tags to all untagged questions?\n• Has French text → FR\n• No French text → EN\n\nAlready tagged questions are not affected.")) return;
    setFixingLang(true);
    try {
      const res = await fetch("/api/admin/questions/fix-language", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Done — ${data.enFixed} set to EN, ${data.frFixed} set to FR`);
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setFixingLang(false);
    }
  }

  async function handleFixLicense() {
    if (!confirm("Set license category to 'Medical Doctor' for all questions that have no license assigned?\n\nThis cannot be undone.")) return;
    setFixingLic(true);
    try {
      const res = await fetch("/api/admin/questions/fix-license", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Done — ${data.fixed} question${data.fixed !== 1 ? "s" : ""} updated to Medical Doctor`);
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setFixingLic(false);
    }
  }

  async function handleSetAllMedicalDoctor() {
    if (!confirm("Set ALL 1,508 questions to Medical Doctor license?\n\nThis will overwrite any existing license tags. This cannot be undone.")) return;
    setFixingLic(true);
    try {
      const res = await fetch("/api/admin/questions/fix-license?all=true", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Done — all ${data.fixed} questions set to Medical Doctor`);
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setFixingLic(false);
    }
  }

  async function handleFixDifficultyLanguage() {
    if (!confirm("Set language = FR for all questions where difficulty is Facile, Moyen, or Difficile?\n\nThis cannot be undone.")) return;
    setFixingDiffLang(true);
    try {
      const res = await fetch("/api/admin/questions/fix-language-difficulty", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Done — ${data.fixed} question${data.fixed !== 1 ? "s" : ""} tagged as French`);
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setFixingDiffLang(false);
    }
  }

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
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/admin/questions/fix-data"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
          >
            <Wrench className="w-4 h-4" />
            Fix Questions
          </Link>
          <button
            onClick={handleFixDifficultyLanguage}
            disabled={fixingDiffLang}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors disabled:opacity-60"
            title="Tag questions as FR where difficulty is Facile/Moyen/Difficile"
          >
            <Wand2 className="w-4 h-4" />
            {fixingDiffLang ? "Fixing…" : "🇫🇷 Fix FR by Difficulty"}
          </button>
          <button
            onClick={handleSetAllMedicalDoctor}
            disabled={fixingLic}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-60"
            title="Set ALL questions to Medical Doctor license"
          >
            <Wand2 className="w-4 h-4" />
            {fixingLic ? "Updating…" : "Set All → Medical Doctor"}
          </button>
          <button
            onClick={handleFixLicense}
            disabled={fixingLic}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors disabled:opacity-60"
            title="Set Medical Doctor license on questions with no license assigned"
          >
            <Wand2 className="w-4 h-4" />
            {fixingLic ? "Fixing…" : "Fix Missing License"}
          </button>
          <button
            onClick={handleFixLanguage}
            disabled={fixingLang}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors disabled:opacity-60"
            title="Auto-assign EN/FR language tags to untagged questions"
          >
            <Wand2 className="w-4 h-4" />
            {fixingLang ? "Fixing…" : "Fix Language Tags"}
          </button>
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

      {/* ── Language stats ── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total Questions</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalCount.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">in question bank</p>
        </div>
        <div className="rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-900/10 px-5 py-4">
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-1 flex items-center gap-1.5">
            🇬🇧 English
          </p>
          <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{enCount.toLocaleString()}</p>
          <p className="text-xs text-blue-400 mt-1">
            {totalCount > 0 ? Math.round((enCount / totalCount) * 100) : 0}% of total
          </p>
        </div>
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50 dark:bg-indigo-900/10 px-5 py-4">
          <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-1 flex items-center gap-1.5">
            🇫🇷 French
          </p>
          <p className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">{frCount.toLocaleString()}</p>
          <p className="text-xs text-indigo-400 mt-1">
            {totalCount > 0 ? Math.round((frCount / totalCount) * 100) : 0}% of total
          </p>
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
        <select
          name="incomplete"
          defaultValue={currentIncomplete}
          className="px-3 py-2 text-sm rounded-lg border border-orange-300 dark:border-orange-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="">All Questions</option>
          <option value="true">⚠ Incomplete Data Only</option>
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
                    {q.text_fr
                      ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40">🇫🇷 FR</span>
                      : <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700">EN only</span>
                    }
                    {/* Incomplete data warning */}
                    {(() => {
                      const issues: string[] = [];
                      if (!q.license_categories || q.license_categories.length === 0) issues.push("No license");
                      if (!q.language) issues.push("No language");
                      if (q.language === "FR" && !q.text_fr) issues.push("Missing FR text");
                      if (!q.answers || q.answers.length === 0) issues.push("No answers");
                      else if (!q.answers.some((a) => a.is_correct)) issues.push("No correct answer");
                      return issues.length > 0 ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/40" title={issues.join(" · ")}>
                          ⚠ {issues.join(" · ")}
                        </span>
                      ) : null;
                    })()}
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

                  {/* License categories */}
                  {q.license_categories && q.license_categories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {q.license_categories.map((lc) => (
                        <span key={lc} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
                          {getLicenseCategoryLabel(lc)}
                        </span>
                      ))}
                    </div>
                  )}
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
