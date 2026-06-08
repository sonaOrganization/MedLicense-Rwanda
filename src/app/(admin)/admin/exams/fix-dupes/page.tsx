"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, AlertTriangle, CheckCircle, Loader2, Copy, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface DuplicateInfo {
  question_id: string;
  text_preview: string;
  category_id: string | null;
  category_name: string | null;
  extra_count: number;
}

interface AffectedExam {
  exam_id: string;
  exam_title: string;
  duplicates: DuplicateInfo[];
}

interface ScanData {
  affected: number;
  duplicateSlots: number;
  exams: AffectedExam[];
}

interface FixResult {
  fixed: number;
  removed: number;
  errors: string[];
}

function StatCard({
  label, value, sub, color = "text-white",
}: {
  label: string; value: number | string; sub?: string; color?: string;
}) {
  return (
    <div className="flex-1 min-w-0 rounded-xl bg-gray-900 border border-gray-800 px-5 py-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">{label}</p>
      <p className={cn("text-2xl font-bold tabular-nums", color)}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function ConfirmModal({
  duplicateSlots, onConfirm, onCancel, busy,
}: {
  duplicateSlots: number; onConfirm: () => void; onCancel: () => void; busy: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gray-900 border border-amber-500/40 rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Confirm Auto-Fix</h2>
            <p className="text-sm text-gray-400 mt-1">
              This will fix{" "}
              <span className="font-bold text-amber-400">
                {duplicateSlots} duplicate slot{duplicateSlots !== 1 ? "s" : ""}
              </span>{" "}
              across all affected exams. Each duplicate will be replaced with a
              different approved question from the same category where possible,
              or removed if no replacement exists.
            </p>
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 px-4 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {busy ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Fixing…</>
            ) : (
              <><ArrowRightLeft className="w-4 h-4" /> Yes, Auto-Fix All</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FixDupesPage() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [data, setData] = useState<ScanData | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<FixResult | null>(null);

  const loadScan = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/exams/fix-dupes");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to scan exams");
      setData(json as ScanData);
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadScan(); }, [loadScan]);

  async function handleExecute() {
    setExecuting(true);
    try {
      const res = await fetch("/api/admin/exams/fix-dupes", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Fix failed");
      const fixResult = json as FixResult;
      setResult(fixResult);
      if (fixResult.errors.length > 0) {
        toast.error(`Completed with ${fixResult.errors.length} error(s)`);
      } else {
        toast.success(
          `Fixed ${fixResult.fixed} slot${fixResult.fixed !== 1 ? "s" : ""}` +
          (fixResult.removed > 0 ? `, removed ${fixResult.removed} (no replacement available)` : "")
        );
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Auto-fix failed");
    } finally {
      setExecuting(false);
      setConfirming(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600/20 flex items-center justify-center">
            <Copy className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Fix Duplicate Questions in Exams</h1>
            <p className="text-sm text-gray-500 mt-0.5">Scanning all exams for duplicate question slots…</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (loadError || !data) {
    return (
      <div className="max-w-5xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600/20 flex items-center justify-center">
            <Copy className="w-5 h-5 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Fix Duplicate Questions in Exams</h1>
        </div>
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-5 py-4 text-red-400 text-sm">
          {loadError ?? "Failed to load scan data."}
        </div>
        <button onClick={loadScan} className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      {confirming && (
        <ConfirmModal
          duplicateSlots={data.duplicateSlots}
          onConfirm={handleExecute}
          onCancel={() => setConfirming(false)}
          busy={executing}
        />
      )}

      <div className="max-w-5xl space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 flex items-center justify-center flex-shrink-0">
              <Copy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Fix Duplicate Questions in Exams</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Finds exams where the same question appears more than once and replaces duplicates with a different question from the same category
              </p>
            </div>
          </div>
          {!executing && (
            <button
              onClick={loadScan}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Re-scan
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-4 flex-wrap">
          <StatCard
            label="Exams Affected"
            value={data.affected}
            sub="exams with at least one duplicate question"
            color={data.affected > 0 ? "text-amber-400" : "text-white"}
          />
          <StatCard
            label="Duplicate Slots"
            value={data.duplicateSlots}
            sub="extra question occurrences to fix"
            color={data.duplicateSlots > 0 ? "text-amber-400" : "text-white"}
          />
          <StatCard
            label="Auto-Fix Available"
            value={data.duplicateSlots > 0 ? "Yes" : "None needed"}
            sub={data.duplicateSlots > 0 ? "replacements sourced from the same category" : "all exams are clean"}
            color={data.duplicateSlots > 0 ? "text-indigo-400" : "text-emerald-400"}
          />
        </div>

        {/* Clean banner */}
        {data.affected === 0 && !result && (
          <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <p className="text-sm text-emerald-300 font-medium">
              All exams are clean — no exam contains the same question more than once.
            </p>
          </div>
        )}

        {/* Warning banner */}
        {data.affected > 0 && !result && (
          <div className="flex items-start gap-3 px-5 py-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-300">
              <span className="font-bold">{data.affected} exam{data.affected !== 1 ? "s" : ""}</span>{" "}
              {data.affected !== 1 ? "have" : "has"} questions appearing more than once.
              Clicking &quot;Auto-Fix All Exams&quot; will remove each extra occurrence and replace it
              with a different approved question from the same category. If no replacement is available,
              the exam will be one question shorter.
            </p>
          </div>
        )}

        {/* Result banner */}
        {result && (
          <div className={cn(
            "flex items-start gap-3 px-5 py-4 rounded-xl border",
            result.errors.length === 0 ? "bg-emerald-500/10 border-emerald-500/30" : "bg-amber-500/10 border-amber-500/30"
          )}>
            {result.errors.length === 0
              ? <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              : <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            }
            <div className="space-y-1">
              <p className={cn("text-sm font-semibold", result.errors.length === 0 ? "text-emerald-300" : "text-amber-300")}>
                Fixed {result.fixed} slot{result.fixed !== 1 ? "s" : ""} with replacement questions
                {result.removed > 0 ? `, removed ${result.removed} slot${result.removed !== 1 ? "s" : ""} (no replacement available in category)` : ""}.
              </p>
              {result.errors.length > 0 && (
                <ul className="text-xs text-amber-400 space-y-0.5 list-disc list-inside">
                  {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Affected exams list */}
        {data.affected > 0 && !result && (
          <div className="rounded-xl bg-gray-900 border border-gray-800 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-800 flex items-center gap-2.5">
              <Copy className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <h2 className="text-sm font-semibold text-white">Affected Exams</h2>
              <span className="ml-auto px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-xs font-bold border border-amber-500/25">
                {data.affected} exam{data.affected !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="divide-y divide-gray-800/60">
              {data.exams.map((exam) => (
                <div key={exam.exam_id} className="px-5 py-4 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 text-xs font-semibold border border-indigo-500/25">
                      {exam.exam_title}
                    </span>
                    <span className="text-xs text-gray-500">
                      {exam.duplicates.length} duplicate {exam.duplicates.length !== 1 ? "questions" : "question"}
                    </span>
                  </div>
                  <div className="space-y-2 pl-1">
                    {exam.duplicates.map((dup) => (
                      <div key={dup.question_id} className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/15">
                        <Copy className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="text-xs text-gray-300 leading-relaxed line-clamp-2">{dup.text_preview}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {dup.category_name && (
                              <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-400 text-[10px] border border-gray-700">
                                {dup.category_name}
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-semibold border border-amber-500/25">
                              appears {dup.extra_count + 1} times
                            </span>
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-medium border border-indigo-500/20">
                              <ArrowRightLeft className="w-2.5 h-2.5" />
                              {dup.extra_count} slot{dup.extra_count !== 1 ? "s" : ""} to replace
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Execute button */}
        {!result && data.affected > 0 && (
          <div className="pt-2">
            <button
              onClick={() => setConfirming(true)}
              disabled={executing}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all",
                !executing
                  ? "bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-900/30"
                  : "bg-gray-800 text-gray-600 cursor-not-allowed"
              )}
            >
              {executing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Running auto-fix…</>
              ) : (
                <>
                  <ArrowRightLeft className="w-4 h-4" />
                  Auto-Fix All Exams
                  <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-800 text-amber-200">
                    {data.duplicateSlots} slot{data.duplicateSlots !== 1 ? "s" : ""}
                  </span>
                </>
              )}
            </button>
          </div>
        )}

        {result && (
          <button
            onClick={loadScan}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Re-scan Exams
          </button>
        )}
      </div>
    </>
  );
}
