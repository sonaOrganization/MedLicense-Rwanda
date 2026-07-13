"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ChevronDown, ChevronRight, Plus, Trash2, Edit, ArrowUp, ArrowDown,
} from "lucide-react";
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

interface Group {
  id: string;
  stem_en: string;
  stem_fr?: string | null;
  order: number;
  subquestions: Subquestion[];
}

interface Props {
  exam: { id: string; title_en: string };
  groups: Group[];
}

/** Derive the sub-question label: single sub in a group -> plain "QN",
 *  multiple subs -> "QN.A" / "QN.B" / "QN.C"... */
function subLabel(groupIndex: number, subIndex: number, totalSubsInGroup: number) {
  const base = `Q${groupIndex + 1}`;
  return totalSubsInGroup > 1 ? `${base}.${String.fromCharCode(65 + subIndex)}` : base;
}

export function PracticalExamEditorClient({ exam, groups }: Props) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);

  const [addingGroup, setAddingGroup] = useState(false);
  const [newStemEn, setNewStemEn] = useState("");
  const [newStemFr, setNewStemFr] = useState("");

  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editStemEn, setEditStemEn] = useState("");
  const [editStemFr, setEditStemFr] = useState("");

  const [subModal, setSubModal] = useState<{ groupId: string; subquestion?: Subquestion } | null>(null);

  function toggleExpanded(groupId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId); else next.add(groupId);
      return next;
    });
  }

  async function addGroup() {
    if (!newStemEn.trim()) return toast.error("Case stem is required");
    setBusy("add-group");
    try {
      const res = await fetch(`/api/admin/practical-exams/${exam.id}/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stem_en: newStemEn.trim(), stem_fr: newStemFr.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Case added");
      setNewStemEn(""); setNewStemFr(""); setAddingGroup(false);
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to add case");
    } finally {
      setBusy(null);
    }
  }

  function startEditGroup(group: Group) {
    setEditingGroupId(group.id);
    setEditStemEn(group.stem_en);
    setEditStemFr(group.stem_fr ?? "");
  }

  async function saveGroupEdit(groupId: string) {
    if (!editStemEn.trim()) return toast.error("Case stem is required");
    setBusy(groupId);
    try {
      const res = await fetch(`/api/admin/practical-groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stem_en: editStemEn.trim(), stem_fr: editStemFr.trim() || null }),
      });
      if (!res.ok) throw new Error();
      toast.success("Case updated");
      setEditingGroupId(null);
      router.refresh();
    } catch {
      toast.error("Failed to update case");
    } finally {
      setBusy(null);
    }
  }

  async function deleteGroup(groupId: string) {
    if (!confirm("Delete this case and all its questions? This cannot be undone.")) return;
    setBusy(groupId);
    try {
      const res = await fetch(`/api/admin/practical-groups/${groupId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Case deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete case");
    } finally {
      setBusy(null);
    }
  }

  async function moveGroup(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= groups.length) return;
    const a = groups[index];
    const b = groups[target];
    setBusy("reorder-groups");
    try {
      await Promise.all([
        fetch(`/api/admin/practical-groups/${a.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: b.order }),
        }),
        fetch(`/api/admin/practical-groups/${b.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: a.order }),
        }),
      ]);
      router.refresh();
    } catch {
      toast.error("Failed to reorder");
    } finally {
      setBusy(null);
    }
  }

  async function moveSubquestion(group: Group, index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= group.subquestions.length) return;
    const a = group.subquestions[index];
    const b = group.subquestions[target];
    setBusy("reorder-subs");
    try {
      await Promise.all([
        fetch(`/api/admin/practical-subquestions/${a.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: b.order }),
        }),
        fetch(`/api/admin/practical-subquestions/${b.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: a.order }),
        }),
      ]);
      router.refresh();
    } catch {
      toast.error("Failed to reorder");
    } finally {
      setBusy(null);
    }
  }

  async function deleteSubquestion(subId: string) {
    if (!confirm("Delete this question? This cannot be undone.")) return;
    setBusy(subId);
    try {
      const res = await fetch(`/api/admin/practical-subquestions/${subId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Question deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete question");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link href="/admin/practical" className="inline-flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 font-medium mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Practical Exams
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{exam.title_en}</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {groups.length} case{groups.length !== 1 ? "s" : ""} ·{" "}
          {groups.reduce((s, g) => s + g.subquestions.length, 0)} question{groups.reduce((s, g) => s + g.subquestions.length, 0) !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="space-y-3">
        {groups.length === 0 && !addingGroup && (
          <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
            <p className="font-medium">No cases yet</p>
            <p className="text-sm mt-1">Add your first case below.</p>
          </div>
        )}

        {groups.map((group, gi) => {
          const isExpanded = expanded.has(group.id);
          const isEditing  = editingGroupId === group.id;
          return (
            <div key={group.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <button onClick={() => toggleExpanded(group.id)} className="mt-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                        Question {gi + 1}
                      </span>
                      <span className="text-xs text-gray-400">
                        {group.subquestions.length} sub-question{group.subquestions.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          value={editStemEn}
                          onChange={(e) => setEditStemEn(e.target.value)}
                          rows={2}
                          placeholder="Case stem (English)"
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
                          <button onClick={() => saveGroupEdit(group.id)} disabled={busy === group.id}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-60">
                            {busy === group.id ? "Saving…" : "Save"}
                          </button>
                          <button onClick={() => setEditingGroupId(null)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{group.stem_en}</p>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => moveGroup(gi, -1)} disabled={gi === 0 || busy === "reorder-groups"}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-30" title="Move up">
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => moveGroup(gi, 1)} disabled={gi === groups.length - 1 || busy === "reorder-groups"}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-30" title="Move down">
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => startEditGroup(group)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20" title="Edit stem">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteGroup(group.id)} disabled={busy === group.id}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50" title="Delete case">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 p-4 space-y-2">
                  {group.subquestions.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-3">No sub-questions yet.</p>
                  )}
                  {group.subquestions.map((sub, si) => (
                    <div key={sub.id} className="flex items-start gap-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mb-1">
                          {subLabel(gi, si, group.subquestions.length)}
                        </p>
                        <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">{sub.prompt_en}</p>
                        <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">
                          <span className="font-medium">Answer:</span> {sub.model_answer_en}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => moveSubquestion(group, si, -1)} disabled={si === 0 || busy === "reorder-subs"}
                          className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-30" title="Move up">
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button onClick={() => moveSubquestion(group, si, 1)} disabled={si === group.subquestions.length - 1 || busy === "reorder-subs"}
                          className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-30" title="Move down">
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button onClick={() => setSubModal({ groupId: group.id, subquestion: sub })}
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
                  <button
                    onClick={() => setSubModal({ groupId: group.id })}
                    className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 px-1 pt-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add sub-question
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {addingGroup ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-amber-300 dark:border-amber-800 p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">New Case Stem</p>
            <textarea
              value={newStemEn}
              onChange={(e) => setNewStemEn(e.target.value)}
              rows={2}
              placeholder="e.g. A 45-year-old patient presents with acute chest pain..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <textarea
              value={newStemFr}
              onChange={(e) => setNewStemFr(e.target.value)}
              rows={2}
              placeholder="Case stem (French, optional)"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <div className="flex gap-2">
              <button onClick={addGroup} disabled={busy === "add-group"}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-60">
                {busy === "add-group" ? "Adding…" : "Add Case"}
              </button>
              <button onClick={() => { setAddingGroup(false); setNewStemEn(""); setNewStemFr(""); }}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingGroup(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-800 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Question Group (Case)
          </button>
        )}
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
