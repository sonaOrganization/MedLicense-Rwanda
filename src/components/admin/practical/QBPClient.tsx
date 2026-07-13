"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X, Edit, Trash2, ExternalLink, Stethoscope } from "lucide-react";
import toast from "react-hot-toast";
import { PracticalSubquestionFormModal } from "./PracticalSubquestionFormModal";

interface Subquestion {
  id: string;
  prompt_en: string;
  prompt_fr?: string | null;
  model_answer_en: string;
  model_answer_fr?: string | null;
  order: number;
}

interface CaseItem {
  id: string;
  stem_en: string;
  stem_fr?: string | null;
  order: number;
  exam: { id: string; title_en: string } | null;
  subquestions: Subquestion[];
}

function subLabel(subIndex: number, totalSubsInGroup: number) {
  const base = "Question";
  return totalSubsInGroup > 1 ? `${base} ${String.fromCharCode(65 + subIndex)}` : base;
}

export function QBPClient({ cases }: { cases: CaseItem[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  const [editStemEn, setEditStemEn] = useState("");
  const [editStemFr, setEditStemFr] = useState("");

  const [subModal, setSubModal] = useState<{ groupId: string; subquestion?: Subquestion } | null>(null);

  const totalSubquestions = cases.reduce((s, c) => s + c.subquestions.length, 0);
  const examCount = new Set(cases.map((c) => c.exam?.id).filter(Boolean)).size;

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return cases;
    return cases.filter((c) =>
      c.stem_en.toLowerCase().includes(s) ||
      (c.stem_fr ?? "").toLowerCase().includes(s) ||
      (c.exam?.title_en ?? "").toLowerCase().includes(s) ||
      c.subquestions.some((sq) => sq.prompt_en.toLowerCase().includes(s) || sq.model_answer_en.toLowerCase().includes(s))
    );
  }, [cases, search]);

  function startEditCase(c: CaseItem) {
    setEditingCaseId(c.id);
    setEditStemEn(c.stem_en);
    setEditStemFr(c.stem_fr ?? "");
  }

  async function saveCaseEdit(caseId: string) {
    if (!editStemEn.trim()) return toast.error("Case stem is required");
    setBusy(caseId);
    try {
      const res = await fetch(`/api/admin/practical-groups/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stem_en: editStemEn.trim(), stem_fr: editStemFr.trim() || null }),
      });
      if (!res.ok) throw new Error();
      toast.success("Case updated");
      setEditingCaseId(null);
      router.refresh();
    } catch {
      toast.error("Failed to update case");
    } finally {
      setBusy(null);
    }
  }

  async function deleteCase(caseId: string) {
    if (!confirm("Delete this case and all its sub-questions? This cannot be undone.")) return;
    setBusy(caseId);
    try {
      const res = await fetch(`/api/admin/practical-groups/${caseId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Case deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete case");
    } finally {
      setBusy(null);
    }
  }

  async function deleteSubquestion(subId: string) {
    if (!confirm("Delete this sub-question? This cannot be undone.")) return;
    setBusy(subId);
    try {
      const res = await fetch(`/api/admin/practical-subquestions/${subId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Sub-question deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete sub-question");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">QBP — Question Bank Practical</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {cases.length} case{cases.length !== 1 ? "s" : ""} · {totalSubquestions} sub-question{totalSubquestions !== 1 ? "s" : ""} · across {examCount} exam{examCount !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by case stem, sub-question, or exam title..."
          className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Case list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
            <Stethoscope className="w-10 h-10 mx-auto mb-3 opacity-30" />
            {search.trim() ? (
              <>
                <p className="font-medium">No cases match &ldquo;{search}&rdquo;</p>
                <button onClick={() => setSearch("")} className="text-sm mt-2 text-amber-500 hover:underline">Clear search</button>
              </>
            ) : (
              <p className="font-medium">No practical cases yet</p>
            )}
          </div>
        )}

        {filtered.map((c) => {
          const isEditing = editingCaseId === c.id;
          return (
            <div key={c.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      {c.exam && (
                        <Link
                          href={`/admin/practical/${c.exam.id}/edit`}
                          className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                        >
                          {c.exam.title_en} <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                      <span className="text-xs text-gray-400">
                        {c.subquestions.length} sub-question{c.subquestions.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          value={editStemEn}
                          onChange={(e) => setEditStemEn(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <textarea
                          value={editStemFr}
                          onChange={(e) => setEditStemFr(e.target.value)}
                          rows={2}
                          placeholder="Case stem (French, optional)"
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => saveCaseEdit(c.id)} disabled={busy === c.id}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-60">
                            {busy === c.id ? "Saving…" : "Save"}
                          </button>
                          <button onClick={() => setEditingCaseId(null)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{c.stem_en}</p>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => startEditCase(c)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20" title="Edit stem">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteCase(c.id)} disabled={busy === c.id}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50" title="Delete case">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {c.subquestions.length > 0 && (
                <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 p-4 space-y-2">
                  {c.subquestions.map((sub, si) => (
                    <div key={sub.id} className="flex items-start gap-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mb-1">
                          {subLabel(si, c.subquestions.length)}
                        </p>
                        <p className="text-xs text-gray-700 dark:text-gray-300">{sub.prompt_en}</p>
                        <p className="text-[11px] text-gray-400 mt-1">
                          <span className="font-medium">Answer:</span> {sub.model_answer_en}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => setSubModal({ groupId: c.id, subquestion: sub })}
                          className="p-1 rounded text-gray-400 hover:text-amber-600" title="Edit">
                          <Edit className="w-3 h-3" />
                        </button>
                        <button onClick={() => deleteSubquestion(sub.id)} disabled={busy === sub.id}
                          className="p-1 rounded text-gray-400 hover:text-red-600 disabled:opacity-50" title="Delete">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {subModal && (
        <PracticalSubquestionFormModal
          open={!!subModal}
          onClose={() => setSubModal(null)}
          groupId={subModal.groupId}
          subquestion={subModal.subquestion}
          onSaved={() => router.refresh()}
        />
      )}
    </div>
  );
}
