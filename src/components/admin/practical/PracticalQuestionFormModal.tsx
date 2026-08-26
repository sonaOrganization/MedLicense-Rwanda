"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";

interface ExamOption { id: string; title_en: string }
interface Props { open: boolean; onClose: () => void; exams: ExamOption[]; onSaved: () => void }
interface DraftQuestion { promptEn: string; promptFr: string; answerEn: string; answerFr: string }
const emptyQuestion = (): DraftQuestion => ({ promptEn: "", promptFr: "", answerEn: "", answerFr: "" });

export function PracticalQuestionFormModal({ open, onClose, exams, onSaved }: Props) {
  const [examId, setExamId] = useState("");
  const [stemEn, setStemEn] = useState("");
  const [stemFr, setStemFr] = useState("");
  const [questions, setQuestions] = useState<DraftQuestion[]>([emptyQuestion()]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) setExamId((current) => current || exams[0]?.id || ""); }, [open, exams]);

  async function save() {
    if (!examId) return toast.error("Create or select a practical exam first");
    if (!stemEn.trim()) return toast.error("The English case stem is required");
    if (questions.some((question) => !question.promptEn.trim() || !question.answerEn.trim())) return toast.error("Every sub-question needs an English prompt and model answer");
    setSaving(true);
    try {
      const groupRes = await fetch(`/api/admin/practical-exams/${examId}/groups`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stem_en: stemEn, stem_fr: stemFr || null }),
      });
      const group = await groupRes.json();
      if (!groupRes.ok) throw new Error(group.error || "Could not create case");
      for (const draft of questions) {
        const questionRes = await fetch(`/api/admin/practical-groups/${group.id}/subquestions`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt_en: draft.promptEn, prompt_fr: draft.promptFr || null, model_answer_en: draft.answerEn, model_answer_fr: draft.answerFr || null }),
        });
        const question = await questionRes.json();
        if (!questionRes.ok) {
          await fetch(`/api/admin/practical-groups/${group.id}`, { method: "DELETE" });
          throw new Error(question.error || "Could not create the practical case");
        }
      }
      toast.success("Practical case added");
      setStemEn(""); setStemFr(""); setQuestions([emptyQuestion()]);
      onSaved(); onClose();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Failed to add practical question"); }
    finally { setSaving(false); }
  }

  if (!open) return null;
  const field = "w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-amber-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white";
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
    <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800"><div><h2 className="font-bold text-gray-900 dark:text-white">Add practical case</h2><p className="text-xs text-gray-400">Create one clinical case with all of its sub-questions.</p></div><button onClick={onClose} className="p-2 text-gray-400"><X className="h-4 w-4" /></button></div>
      <div className="space-y-5 overflow-y-auto px-6 py-5">
        <label className="block text-xs font-semibold text-gray-500">Practical exam *<select className={`${field} mt-1.5`} value={examId} onChange={(e) => setExamId(e.target.value)}><option value="">Select an exam</option>{exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.title_en}</option>)}</select></label>
        <div className="grid gap-4 sm:grid-cols-2"><TextArea label="Clinical case / stem (English) *" value={stemEn} setValue={setStemEn} cls={field} /><TextArea label="Clinical case / stem (French)" value={stemFr} setValue={setStemFr} cls={field} /></div>
        <div className="space-y-4">
          <div className="flex items-center justify-between"><h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Sub-questions</h3><button onClick={() => setQuestions((current) => [...current, emptyQuestion()])} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:border-amber-800 dark:text-amber-400"><Plus className="h-3.5 w-3.5" /> Add another</button></div>
          {questions.map((question, index) => <div key={index} className="space-y-4 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
            <div className="flex items-center justify-between"><p className="text-xs font-bold text-amber-600">Sub-question {index + 1}</p>{questions.length > 1 && <button onClick={() => setQuestions((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="p-1.5 text-gray-400 hover:text-red-600" title="Remove sub-question"><Trash2 className="h-4 w-4" /></button>}</div>
            <div className="grid gap-4 sm:grid-cols-2"><TextArea label="Question prompt (English) *" value={question.promptEn} setValue={(value) => updateQuestion(index, "promptEn", value)} cls={field} /><TextArea label="Question prompt (French)" value={question.promptFr} setValue={(value) => updateQuestion(index, "promptFr", value)} cls={field} /></div>
            <div className="grid gap-4 sm:grid-cols-2"><TextArea label="Model answer (English) *" value={question.answerEn} setValue={(value) => updateQuestion(index, "answerEn", value)} cls={field} /><TextArea label="Model answer (French)" value={question.answerFr} setValue={(value) => updateQuestion(index, "answerFr", value)} cls={field} /></div>
          </div>)}
        </div>
      </div>
      <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-gray-900"><button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700">Cancel</button><button onClick={save} disabled={saving || exams.length === 0} className="rounded-lg bg-amber-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : `Add case with ${questions.length} sub-question${questions.length === 1 ? "" : "s"}`}</button></div>
    </div>
  </div>;

  function updateQuestion(index: number, key: keyof DraftQuestion, value: string) {
    setQuestions((current) => current.map((question, itemIndex) => itemIndex === index ? { ...question, [key]: value } : question));
  }
}

function TextArea({ label, value, setValue, cls }: { label: string; value: string; setValue: (value: string) => void; cls: string }) {
  return <label className="block text-xs font-semibold text-gray-500">{label}<textarea rows={3} className={`${cls} mt-1.5 resize-y`} value={value} onChange={(e) => setValue(e.target.value)} /></label>;
}
