"use client";
import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { X, Upload, FileText, CheckCircle, AlertCircle, Download, Eye, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const TEMPLATE = `category_slug,difficulty,question,answer_a,answer_b,answer_c,answer_d,correct_letter,license_categories,explanation,target_language
md-internal-medicine,MEDIUM,"A 30-year-old presents with fever and cough. The most likely diagnosis is:","Community-acquired pneumonia","Pulmonary embolism","Lung cancer","Asthma",A,medical_doctor,"Pneumonia is caused by S. pneumoniae in most cases.",EN
dentist-oral-anatomy-physiology,EASY,"Which nerve supplies the mandibular teeth?","Inferior alveolar nerve","Lingual nerve","Buccal nerve","Mental nerve",A,dentist,"The inferior alveolar nerve (branch of V3) supplies the lower teeth.",EN`;

interface CSVUploadModalProps { open: boolean; onClose: () => void; }

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === "," && !inQuotes) { result.push(current.trim()); current = ""; continue; }
    current += ch;
  }
  result.push(current.trim());
  return result;
}

interface PreviewRow {
  rowNum: number;
  raw: string;
  category: string;
  question: string;
  difficulty: string;
  lang: string;
  answers: string[];
  correct: string;
  license: string;
  errors: string[];
  warnings: string[];
}

function validateRows(csvText: string): PreviewRow[] {
  const lines = csvText.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const header = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, "_"));
  const get = (row: string[], key: string) => row[header.indexOf(key)] ?? "";

  const rows: PreviewRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const row   = parseCSVLine(lines[i]);
    const errors: string[] = [];
    const warnings: string[] = [];

    const category = get(row, "category_slug");
    const question = get(row, "question") || get(row, "text_en");
    const ansA     = get(row, "answer_a");
    const ansB     = get(row, "answer_b");
    const ansC     = get(row, "answer_c");
    const ansD     = get(row, "answer_d");
    const ansE     = get(row, "answer_e");
    const correct  = get(row, "correct_letter").toUpperCase();
    const diff     = get(row, "difficulty").toUpperCase() || "MEDIUM";
    const lang     = get(row, "target_language").toUpperCase() || "EN";
    const license  = get(row, "license_categories");

    if (!question)  errors.push("Missing question text");
    if (!category)  errors.push("Missing category_slug");
    if (!ansA)      errors.push("Missing answer_a");
    if (!ansB)      errors.push("Missing answer_b");
    if (!correct)   errors.push("Missing correct_letter");

    if (correct && !["A","B","C","D","E"].includes(correct))
      errors.push(`Invalid correct_letter "${correct}" — must be A–E`);

    const filled = [ansA, ansB, ansC, ansD, ansE].filter(Boolean);
    const letterMap: Record<string, string> = { A: ansA, B: ansB, C: ansC, D: ansD, E: ansE };
    if (correct && ["A","B","C","D","E"].includes(correct) && !letterMap[correct])
      errors.push(`correct_letter "${correct}" has no answer text`);

    if (!["EASY","MEDIUM","HARD"].includes(diff))
      warnings.push(`Difficulty "${diff}" → defaults to MEDIUM`);
    if (!["EN","FR"].includes(lang))
      warnings.push(`Language "${lang}" → defaults to EN`);
    if (!license)
      warnings.push("No license category — question will apply to all");

    rows.push({
      rowNum: i + 1,
      raw: lines[i],
      category,
      question,
      difficulty: ["EASY","MEDIUM","HARD"].includes(diff) ? diff : "MEDIUM",
      lang: ["EN","FR"].includes(lang) ? lang : "EN",
      answers: filled,
      correct,
      license,
      errors,
      warnings,
    });
  }
  return rows;
}

const DIFF_CLS: Record<string, string> = {
  EASY:   "bg-emerald-100 text-emerald-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  HARD:   "bg-red-100 text-red-700",
};

export function CSVUploadModal({ open, onClose }: CSVUploadModalProps) {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [csvText,   setCsvText]   = useState("");
  const [fileName,  setFileName]  = useState("");
  const [step,      setStep]      = useState<"upload" | "preview" | "done">("upload");
  const [uploading, setUploading] = useState(false);
  const [result,    setResult]    = useState<{ imported: number; failed: { row: number; reason: string }[] } | null>(null);

  const previewRows = useMemo(() => step === "preview" || step === "done" ? validateRows(csvText) : [], [csvText, step]);
  const errorCount   = previewRows.filter((r) => r.errors.length > 0).length;
  const validCount   = previewRows.filter((r) => r.errors.length === 0).length;

  function handleFile(file: File) {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => { setCsvText(e.target?.result as string ?? ""); setStep("upload"); setResult(null); };
    reader.readAsText(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith(".csv")) handleFile(file);
    else toast.error("Please drop a .csv file");
  }

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "questions_template.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport() {
    if (validCount === 0) return toast.error("No valid rows to import");
    setUploading(true);
    try {
      const res  = await fetch("/api/admin/questions/csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: csvText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      setStep("done");
      if (data.imported > 0) {
        toast.success(`${data.imported} question${data.imported > 1 ? "s" : ""} imported`);
        router.refresh();
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setUploading(false);
    }
  }

  function handleClose() {
    setCsvText(""); setFileName(""); setStep("upload"); setResult(null);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-5xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-gray-900 dark:text-white">Import Questions via CSV</h2>
            {/* Step indicator */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium">
              {(["upload","preview","done"] as const).map((s, i) => (
                <span key={s} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="w-3 h-3 text-gray-400" />}
                  <span className={cn("px-2 py-0.5 rounded-full", step === s
                    ? "bg-indigo-600 text-white"
                    : "text-gray-400"
                  )}>
                    {s === "upload" ? "1. Upload" : s === "preview" ? "2. Preview" : "3. Done"}
                  </span>
                </span>
              ))}
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* ── Step 1: Upload ── */}
          {step === "upload" && (
            <div className="px-6 py-5 space-y-5">
              {/* Template download */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Download the template first</p>
                    <p className="text-xs text-blue-500">Fill it in, then upload below</p>
                  </div>
                </div>
                <button onClick={downloadTemplate} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition-colors">
                  <Download className="w-3.5 h-3.5" /> Template
                </button>
              </div>

              {/* Column guide */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">CSV Columns</p>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {[
                    { col: "category_slug",      req: true,  desc: "e.g. md-internal-medicine" },
                    { col: "question",           req: true,  desc: "Full question text" },
                    { col: "answer_a / answer_b",req: true,  desc: "Required answer options" },
                    { col: "answer_c / d / e",   req: false, desc: "Optional additional choices" },
                    { col: "correct_letter",     req: true,  desc: "A, B, C, D, or E" },
                    { col: "difficulty",         req: false, desc: "EASY, MEDIUM, or HARD (default: MEDIUM)" },
                    { col: "target_language",    req: false, desc: "EN or FR (default: EN)" },
                    { col: "license_categories", req: false, desc: "e.g. medical_doctor (comma-separated for multiple)" },
                    { col: "explanation",        req: false, desc: "Shown after exam submission" },
                  ].map(({ col, req, desc }) => (
                    <div key={col} className="flex items-center gap-3 px-4 py-2">
                      <code className="text-xs font-mono bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded w-40 flex-shrink-0">{col}</code>
                      <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded w-16 text-center flex-shrink-0", req ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-400")}>
                        {req ? "Required" : "Optional"}
                      </span>
                      <span className="text-xs text-gray-500">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors"
              >
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                <Upload className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                {fileName ? (
                  <div className="text-center">
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{fileName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{csvText.split("\n").filter(Boolean).length - 1} data rows detected</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500">Drag & drop your CSV here</p>
                    <p className="text-xs text-gray-400">or click to browse</p>
                  </div>
                )}
              </div>

              {/* Paste fallback */}
              {!fileName && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Or paste CSV content directly</label>
                  <textarea
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    rows={4}
                    placeholder="category_slug,difficulty,question,..."
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Preview table ── */}
          {(step === "preview" || step === "done") && (
            <div className="px-6 py-5 space-y-4">
              {/* Summary bar */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{validCount} valid</span>
                </div>
                {errorCount > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-semibold text-red-700 dark:text-red-400">{errorCount} with errors (will be skipped)</span>
                  </div>
                )}
                <span className="text-xs text-gray-400">{previewRows.length} rows total from <span className="font-medium text-gray-600 dark:text-gray-300">{fileName}</span></span>
                <button onClick={() => { setStep("upload"); setResult(null); }} className="ml-auto text-xs text-blue-500 hover:underline">
                  ← Change file
                </button>
              </div>

              {/* Import result (step done) */}
              {result && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                      {result.imported} question{result.imported !== 1 ? "s" : ""} imported successfully
                    </p>
                  </div>
                  {result.failed.length > 0 && (
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30 space-y-1">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <p className="text-sm font-medium text-red-700 dark:text-red-400">{result.failed.length} row{result.failed.length > 1 ? "s" : ""} rejected by server</p>
                      </div>
                      {result.failed.map(({ row, reason }) => (
                        <p key={row} className="text-xs text-red-600 dark:text-red-400 pl-6">Row {row}: {reason}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Preview table */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="overflow-x-auto max-h-[50vh]">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0">
                      <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        {["#","Status","Question","Category","Diff","Lang","Answers","Correct","Issues"].map((h) => (
                          <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {previewRows.map((r) => {
                        const hasError   = r.errors.length > 0;
                        const hasWarning = !hasError && r.warnings.length > 0;
                        return (
                          <tr key={r.rowNum} className={cn(
                            "transition-colors",
                            hasError   ? "bg-red-50/60 dark:bg-red-900/10"    : "",
                            hasWarning ? "bg-amber-50/60 dark:bg-amber-900/10" : "hover:bg-gray-50 dark:hover:bg-gray-800/30",
                          )}>
                            <td className="px-3 py-2 font-mono text-gray-400">{r.rowNum}</td>
                            <td className="px-3 py-2">
                              {hasError ? (
                                <span className="flex items-center gap-1 text-red-600 font-semibold"><AlertCircle className="w-3.5 h-3.5" /> Error</span>
                              ) : hasWarning ? (
                                <span className="flex items-center gap-1 text-amber-600 font-semibold"><AlertCircle className="w-3.5 h-3.5" /> Warn</span>
                              ) : (
                                <span className="flex items-center gap-1 text-emerald-600 font-semibold"><CheckCircle className="w-3.5 h-3.5" /> OK</span>
                              )}
                            </td>
                            <td className="px-3 py-2 max-w-[200px]">
                              <p className="truncate text-gray-800 dark:text-gray-200">{r.question || <span className="text-gray-400 italic">—</span>}</p>
                            </td>
                            <td className="px-3 py-2 font-mono text-gray-500 max-w-[120px] truncate">{r.category || "—"}</td>
                            <td className="px-3 py-2">
                              <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold", DIFF_CLS[r.difficulty] ?? "bg-gray-100 text-gray-600")}>
                                {r.difficulty || "?"}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold", r.lang === "FR" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600")}>
                                {r.lang || "?"}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-gray-500">{r.answers.length} option{r.answers.length !== 1 ? "s" : ""}</td>
                            <td className="px-3 py-2">
                              <span className="font-bold text-gray-800 dark:text-gray-200">{r.correct || "—"}</span>
                            </td>
                            <td className="px-3 py-2 max-w-[200px]">
                              {[...r.errors.map((e) => ({ msg: e, cls: "text-red-600" })), ...r.warnings.map((w) => ({ msg: w, cls: "text-amber-600" }))].map(({ msg, cls }, i) => (
                                <p key={i} className={cn("text-[10px] leading-tight", cls)}>{msg}</p>
                              ))}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <button onClick={handleClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            {step === "done" ? "Close" : "Cancel"}
          </button>

          <div className="flex items-center gap-2">
            {step === "upload" && (
              <button
                onClick={() => setStep("preview")}
                disabled={!csvText.trim()}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50"
              >
                <Eye className="w-4 h-4" /> Preview {csvText.trim() ? `${csvText.split("\n").filter(Boolean).length - 1} rows` : ""}
              </button>
            )}
            {step === "preview" && (
              <button
                onClick={handleImport}
                disabled={uploading || validCount === 0}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {uploading ? "Importing…" : `Import ${validCount} valid row${validCount !== 1 ? "s" : ""}`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
