"use client";

import { useRef, useState } from "react";
import { Download, FileText, Upload, X } from "lucide-react";
import toast from "react-hot-toast";

interface ExamOption { id: string; title_en: string }
interface Props { open: boolean; onClose: () => void; exams: ExamOption[]; onImported: () => void }

const TEMPLATE = `case_key,stem_en,stem_fr,prompt_en,prompt_fr,model_answer_en,model_answer_fr
case-001,"A 45-year-old patient presents with chest pain.","Un patient de 45 ans présente une douleur thoracique.","What is your first assessment?","Quelle est votre première évaluation ?","Assess airway, breathing, circulation and obtain an ECG.","Évaluer les voies respiratoires, la respiration, la circulation et réaliser un ECG."
case-001,,,"What dangerous diagnosis must be excluded?","Quel diagnostic grave faut-il exclure ?","Acute coronary syndrome.","Syndrome coronarien aigu."`;

export function PracticalCSVUploadModal({ open, onClose, exams, onImported }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [examId, setExamId] = useState("");
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);

  function readFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".csv")) return toast.error("Please select a CSV file");
    const reader = new FileReader();
    reader.onload = () => { setCsv(String(reader.result ?? "")); setFileName(file.name); };
    reader.readAsText(file);
  }

  function downloadTemplate() {
    const url = URL.createObjectURL(new Blob([TEMPLATE], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "practical_questions_template.csv"; link.click(); URL.revokeObjectURL(url);
  }

  async function upload() {
    if (!examId) return toast.error("Select the practical exam for these questions");
    if (!csv.trim()) return toast.error("Select a CSV file first");
    setUploading(true);
    try {
      const res = await fetch("/api/admin/practical-questions/csv", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ examId, csv }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      if (data.failed?.length) toast.error(`${data.imported} imported; ${data.failed.length} row(s) failed`);
      else toast.success(`${data.imported} practical question${data.imported === 1 ? "" : "s"} imported`);
      onImported();
      if (!data.failed?.length) { setCsv(""); setFileName(""); onClose(); }
    } catch (error) { toast.error(error instanceof Error ? error.message : "Import failed"); }
    finally { setUploading(false); }
  }

  if (!open) return null;
  const rows = Math.max(0, csv.split(/\r?\n/).filter(Boolean).length - 1);
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
    <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800"><div><h2 className="font-bold text-gray-900 dark:text-white">Upload practical questions</h2><p className="text-xs text-gray-400">Import cases and sub-questions from CSV.</p></div><button onClick={onClose} className="p-2 text-gray-400"><X className="h-4 w-4" /></button></div>
      <div className="space-y-5 px-6 py-5">
        <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30"><div className="flex gap-3"><FileText className="h-5 w-5 text-blue-600" /><div><p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Use the prepared CSV format</p><p className="text-xs text-blue-600 dark:text-blue-400">Repeat case_key for multiple questions under one case.</p></div></div><button onClick={downloadTemplate} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white"><Download className="h-3.5 w-3.5" /> Template</button></div>
        <label className="block text-xs font-semibold text-gray-500">Destination practical exam *<select value={examId} onChange={(e) => setExamId(e.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"><option value="">Select an exam</option>{exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.title_en}</option>)}</select></label>
        <button onClick={() => inputRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) readFile(file); }} className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 p-8 text-gray-500 transition hover:border-amber-500 dark:border-gray-700"><input ref={inputRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => { const file = e.target.files?.[0]; if (file) readFile(file); }} /><Upload className="h-8 w-8 text-gray-300" /><span className="text-sm font-semibold">{fileName || "Choose or drop a CSV file"}</span>{fileName && <span className="text-xs text-gray-400">{rows} data row{rows === 1 ? "" : "s"}</span>}</button>
        <p className="text-xs leading-5 text-gray-400"><strong>Required columns:</strong> case_key, stem_en, prompt_en, model_answer_en. For additional questions in the same case, repeat case_key and leave the stem blank. French columns are optional.</p>
      </div>
      <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-gray-900"><button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700">Cancel</button><button onClick={upload} disabled={uploading || !csv || !examId} className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"><Upload className="h-4 w-4" />{uploading ? "Importing…" : `Import ${rows || ""} question${rows === 1 ? "" : "s"}`}</button></div>
    </div>
  </div>;
}
