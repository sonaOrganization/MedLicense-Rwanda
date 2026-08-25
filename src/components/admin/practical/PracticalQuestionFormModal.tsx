"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";

interface ExamOption { id: string; title_en: string }
interface Props { open: boolean; onClose: () => void; exams: ExamOption[]; onSaved: () => void }

export function PracticalQuestionFormModal({ open, onClose, exams, onSaved }: Props) {
  const [examId, setExamId] = useState("");
  const [stemEn, setStemEn] = useState("");
  const [stemFr, setStemFr] = useState("");
  const [promptEn, setPromptEn] = useState("");
  const [promptFr, setPromptFr] = useState("");
  const [answerEn, setAnswerEn] = useState("");
  const [answerFr, setAnswerFr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) setExamId((current) => current || exams[0]?.id || ""); }, [open, exams]);

  async function save() {
    if (!examId) return toast.error("Create or select a practical exam first");
    if (!stemEn.trim() || !promptEn.trim() || !answerEn.trim()) return toast.error("Exam, case stem, prompt, and model answer are required");
    setSaving(true);
    try {
      const groupRes = await fetch(`/api/admin/practical-exams/${examId}/groups`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stem_en: stemEn, stem_fr: stemFr || null }),
      });
      const group = await groupRes.json();
      if (!groupRes.ok) throw new Error(group.error || "Could not create case");
      const questionRes = await fetch(`/api/admin/practical-groups/${group.id}/subquestions`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt_en: promptEn, prompt_fr: promptFr || null, model_answer_en: answerEn, model_answer_fr: answerFr || null }),
      });
      const question = await questionRes.json();
      if (!questionRes.ok) {
        await fetch(`/api/admin/practical-groups/${group.id}`, { method: "DELETE" });
        throw new Error(question.error || "Could not create the practical question");
      }
      toast.success("Practical question added");
      setStemEn(""); setStemFr(""); setPromptEn(""); setPromptFr(""); setAnswerEn(""); setAnswerFr("");
      onSaved(); onClose();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Failed to add practical question"); }
    finally { setSaving(false); }
  }

  if (!open) return null;
  const field = "w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-amber-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white";
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
    <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800"><div><h2 className="font-bold text-gray-900 dark:text-white">Add practical question</h2><p className="text-xs text-gray-400">Create a clinical case and its first sub-question.</p></div><button onClick={onClose} className="p-2 text-gray-400"><X className="h-4 w-4" /></button></div>
      <div className="space-y-5 overflow-y-auto px-6 py-5">
        <label className="block text-xs font-semibold text-gray-500">Practical exam *<select className={`${field} mt-1.5`} value={examId} onChange={(e) => setExamId(e.target.value)}><option value="">Select an exam</option>{exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.title_en}</option>)}</select></label>
        <div className="grid gap-4 sm:grid-cols-2"><TextArea label="Clinical case / stem (English) *" value={stemEn} setValue={setStemEn} cls={field} /><TextArea label="Clinical case / stem (French)" value={stemFr} setValue={setStemFr} cls={field} /></div>
        <div className="grid gap-4 sm:grid-cols-2"><TextArea label="Question prompt (English) *" value={promptEn} setValue={setPromptEn} cls={field} /><TextArea label="Question prompt (French)" value={promptFr} setValue={setPromptFr} cls={field} /></div>
        <div className="grid gap-4 sm:grid-cols-2"><TextArea label="Model answer (English) *" value={answerEn} setValue={setAnswerEn} cls={field} /><TextArea label="Model answer (French)" value={answerFr} setValue={setAnswerFr} cls={field} /></div>
      </div>
      <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-gray-900"><button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700">Cancel</button><button onClick={save} disabled={saving || exams.length === 0} className="rounded-lg bg-amber-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Add question"}</button></div>
    </div>
  </div>;
}

function TextArea({ label, value, setValue, cls }: { label: string; value: string; setValue: (value: string) => void; cls: string }) {
  return <label className="block text-xs font-semibold text-gray-500">{label}<textarea rows={3} className={`${cls} mt-1.5 resize-y`} value={value} onChange={(e) => setValue(e.target.value)} /></label>;
}
