"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Trash2, CheckCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface DupPair {
  keeper_id: string;
  dup_id: string;
  text_preview: string;
  in_exams?: boolean;
}

interface ConflictInfo {
  exam_id: string;
  exam_title: string;
  dup_id: string;
  keeper_id: string;
  text_preview: string;
  category_id: string | null;
  category_name: string | null;
}

interface ReplacementOption {
  id: string;
  text_en: string;
  difficulty: string;
}

interface PreviewData {
  groups: number;
  toDelete: number;
  inExams: number;
  pairs: DupPair[];
  conflicts: ConflictInfo[];
}

interface ExecuteResult {
  deleted: number;
  remapped: number;
  replacementsAdded?: number;
  errors: string[];
}

function shortId(id: string) {
  return id.slice(0, 8) + "…";
}

function StatCard({
  label,
  value,
  sub,
  color = "text-white",
}: {
  label: string;
  value: number | string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="flex-1 min-w-0 rounded-xl bg-gray-900 border border-gray-800 px-5 py-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">{label}</p>
      <p className={cn("text-2xl font-bold tabular-nums", color)}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function ConfirmDialog({
  toDelete,
  onConfirm,
  onCancel,
  busy,
}: {
  toDelete: number;
  onConfirm: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gray-900 border border-red-500/40 rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Confirm Deduplication</h2>
            <p className="text-sm text-gray-400 mt-1">
              This will permanently delete{" "}
              <span className="font-bold text-red-400">{toDelete} duplicate questions</span> from
              the database. Exam references will be remapped to the original question automatically.
              This action cannot be undone.
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
            className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Yes, Delete {toDelete} Questions
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DedupPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [data, setData] = useState<PreviewData | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<ExecuteResult | null>(null);

  // key: `${exam_id}:${dup_id}` → chosen question_id or "empty"
  const [resolutions, setResolutions] = useState<Map<string, string>>(new Map());
  // key: `${exam_id}:${category_id}` → ReplacementOption[]
  const [replacementOptions, setReplacementOptions] = useState<Map<string, ReplacementOption[]>>(new Map());
  const [loadingOptions, setLoadingOptions] = useState<Set<string>>(new Set());

  const loadPreview = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/questions/dedup");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load preview");
      setData(json as PreviewData);
      setResolutions(new Map());
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  async function loadReplacementOptions(examId: string, categoryId: string) {
    const key = `${examId}:${categoryId}`;
    if (replacementOptions.has(key) || loadingOptions.has(key)) return;
    setLoadingOptions(prev => new Set(prev).add(key));
    try {
      const res = await fetch(`/api/admin/questions/dedup/replacements?exam_id=${examId}&category_id=${categoryId}`);
      if (res.ok) {
        const opts = await res.json();
        setReplacementOptions(prev => new Map(prev).set(key, opts));
      }
    } finally {
      setLoadingOptions(prev => { const s = new Set(prev); s.delete(key); return s; });
    }
  }

  async function handleExecute() {
    setExecuting(true);
    try {
      const replacements: { exam_id: string; question_id: string }[] = [];
      for (const [key, value] of resolutions.entries()) {
        if (value === "empty") continue;
        const [exam_id] = key.split(":");
        replacements.push({ exam_id, question_id: value });
      }

      const res = await fetch("/api/admin/questions/dedup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replacements }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Execution failed");
      setResult(json as ExecuteResult);
      if ((json as ExecuteResult).errors?.length > 0) {
        toast.error(`Completed with ${(json as ExecuteResult).errors.length} error(s)`);
      } else {
        toast.success(`Deleted ${(json as ExecuteResult).deleted} duplicate questions`);
      }
      router.refresh();
      await loadPreview();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Execution failed");
    } finally {
      setExecuting(false);
      setConfirming(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Remove Duplicate Questions</h1>
            <p className="text-sm text-gray-500 mt-0.5">Scanning question bank for duplicates…</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (loadError || !data) {
    return (
      <div className="max-w-5xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Remove Duplicate Questions</h1>
        </div>
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-5 py-4 text-red-400 text-sm">
          {loadError ?? "Failed to load preview data."}
        </div>
        <button
          onClick={loadPreview}
          className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const displayPairs = showAll ? data.pairs : data.pairs.slice(0, 20);
  const hasMore = data.pairs.length > 20;
  const conflicts = data.conflicts ?? [];
  const allConflictsResolved = conflicts.every(c => resolutions.has(`${c.exam_id}:${c.dup_id}`));
  const conflictsLeft = conflicts.filter(c => !resolutions.has(`${c.exam_id}:${c.dup_id}`)).length;
  const canExecute = data.toDelete > 0 && !executing && !result && allConflictsResolved;

  return (
    <>
      {confirming && (
        <ConfirmDialog
          toDelete={data.toDelete}
          onConfirm={handleExecute}
          onCancel={() => setConfirming(false)}
          busy={executing}
        />
      )}

      <div className="max-w-5xl space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Remove Duplicate Questions</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Detects exact text duplicates (case-insensitive, trimmed) and remaps exam references to the original.
            </p>
          </div>
        </div>

        {/* Warning banner */}
        {data.toDelete > 0 && !result && (
          <div className="flex items-start gap-3 px-5 py-4 rounded-xl bg-red-500/10 border border-red-500/30">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">
              This will permanently delete{" "}
              <span className="font-bold text-red-400">{data.toDelete} questions</span> from the
              database. Exam references will be remapped to the original question before deletion.
            </p>
          </div>
        )}

        {data.toDelete === 0 && !result && (
          <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <p className="text-sm text-emerald-300 font-medium">
              No duplicate questions detected. The question bank is clean.
            </p>
          </div>
        )}

        {/* Result banner */}
        {result && (
          <div className={cn(
            "flex items-start gap-3 px-5 py-4 rounded-xl border",
            result.errors.length === 0
              ? "bg-emerald-500/10 border-emerald-500/30"
              : "bg-amber-500/10 border-amber-500/30"
          )}>
            {result.errors.length === 0 ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className={cn(
                "text-sm font-semibold",
                result.errors.length === 0 ? "text-emerald-300" : "text-amber-300"
              )}>
                Deleted {result.deleted} duplicate questions, remapped {result.remapped} exam references.
                {(result.replacementsAdded ?? 0) > 0 && (
                  <> Added {result.replacementsAdded} replacement question{result.replacementsAdded !== 1 ? "s" : ""}.</>
                )}
              </p>
              {result.errors.length > 0 && (
                <ul className="text-xs text-amber-400 space-y-0.5 list-disc list-inside">
                  {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="flex gap-4 flex-wrap">
          <StatCard
            label="Duplicate Groups"
            value={data.groups}
            sub="distinct question texts with duplicates"
            color={data.groups > 0 ? "text-amber-400" : "text-white"}
          />
          <StatCard
            label="Questions to Remove"
            value={data.toDelete}
            sub="extra copies beyond the keeper"
            color={data.toDelete > 0 ? "text-red-400" : "text-white"}
          />
          <StatCard
            label="Currently in Exams"
            value={data.inExams}
            sub="duplicates referenced by exams (remapped automatically)"
            color={data.inExams > 0 ? "text-amber-400" : "text-white"}
          />
        </div>

        {/* Conflict Resolution */}
        {conflicts.length > 0 && !result && (
          <div className="rounded-xl bg-gray-900 border border-amber-500/30 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-amber-500/20 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <h2 className="text-sm font-semibold text-white">Conflict Resolution Required</h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-xs font-bold border border-amber-500/25">
                  {conflicts.length} exam{conflicts.length !== 1 ? "s" : ""} affected
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {conflictsLeft === 0 ? "All resolved ✓" : `${conflictsLeft} of ${conflicts.length} unresolved`}
              </p>
            </div>

            <div className="px-5 py-3 bg-amber-500/5 border-b border-amber-500/15">
              <p className="text-xs text-amber-300/80">
                These exams already contain the <strong>keeper</strong> version of a duplicate — so the duplicate
                will be removed without being replaced automatically. Choose a replacement question for each gap,
                or select &quot;Leave empty&quot; to reduce the exam size.
              </p>
            </div>

            <div className="divide-y divide-gray-800/60">
              {conflicts.map((conflict) => {
                const resKey = `${conflict.exam_id}:${conflict.dup_id}`;
                const optKey = `${conflict.exam_id}:${conflict.category_id}`;
                const resolved = resolutions.get(resKey);
                const options = replacementOptions.get(optKey) ?? [];
                const isLoadingOpts = loadingOptions.has(optKey);

                return (
                  <div key={resKey} className="px-5 py-4 space-y-3">
                    {/* Exam + category + status badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 text-xs font-semibold border border-indigo-500/25">
                        {conflict.exam_title}
                      </span>
                      {conflict.category_name && (
                        <span className="px-2.5 py-1 rounded-lg bg-gray-800 text-gray-400 text-xs border border-gray-700">
                          {conflict.category_name}
                        </span>
                      )}
                      {resolved ? (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-semibold border border-emerald-500/25 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          {resolved === "empty" ? "Leave empty" : "Replacement chosen"}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 text-xs font-semibold border border-amber-500/25">
                          Needs decision
                        </span>
                      )}
                    </div>

                    {/* Question being removed */}
                    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/15">
                      <Trash2 className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-red-400 font-semibold uppercase tracking-wide mb-0.5">Being removed</p>
                        <p className="text-xs text-gray-300 leading-relaxed line-clamp-2">{conflict.text_preview}</p>
                      </div>
                    </div>

                    {/* Replacement selector */}
                    <select
                      value={resolved ?? ""}
                      onFocus={() => conflict.category_id && loadReplacementOptions(conflict.exam_id, conflict.category_id)}
                      onChange={(e) => {
                        const val = e.target.value;
                        setResolutions(prev => {
                          const next = new Map(prev);
                          if (val === "") next.delete(resKey);
                          else next.set(resKey, val);
                          return next;
                        });
                      }}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-700 bg-gray-800 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">— Choose replacement question —</option>
                      <option value="empty">Leave empty (reduce exam size by 1)</option>
                      {isLoadingOpts && <option disabled>Loading options…</option>}
                      {options.map(opt => (
                        <option key={opt.id} value={opt.id}>
                          [{opt.difficulty}] {opt.text_en.slice(0, 90)}{opt.text_en.length > 90 ? "…" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pairs table */}
        {data.pairs.length > 0 && (
          <div className="rounded-xl bg-gray-900 border border-gray-800 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-800 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-white">
                Duplicate Pairs{" "}
                <span className="text-gray-500 font-normal">
                  (showing {displayPairs.length} of {data.pairs.length})
                </span>
              </h2>
              {hasMore && (
                <button
                  onClick={() => setShowAll((v) => !v)}
                  className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
                >
                  {showAll ? (
                    <><EyeOff className="w-3.5 h-3.5" /> Show first 20</>
                  ) : (
                    <><Eye className="w-3.5 h-3.5" /> Show all {data.pairs.length} pairs</>
                  )}
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium w-10">#</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Keep (original)</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Delete (duplicate)</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium w-28">In Exams</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {displayPairs.map((pair, idx) => (
                    <tr key={pair.dup_id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3 text-gray-600 tabular-nums text-xs">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <p className="text-gray-200 text-xs leading-relaxed line-clamp-2">{pair.text_preview}</p>
                        <p className="text-gray-600 text-xs mt-0.5 font-mono">{shortId(pair.keeper_id)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-500 text-xs font-mono">{shortId(pair.dup_id)}</p>
                      </td>
                      <td className="px-4 py-3">
                        {pair.in_exams ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-xs font-medium border border-amber-500/25">
                            <AlertTriangle className="w-3 h-3" />
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-800 text-gray-500 text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            No
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Execute button */}
        {!result && (
          <div className="flex flex-col gap-2 pt-2">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setConfirming(true)}
                disabled={!canExecute}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all",
                  canExecute
                    ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/30 hover:shadow-red-900/50"
                    : "bg-gray-800 text-gray-600 cursor-not-allowed"
                )}
              >
                <Trash2 className="w-4 h-4" />
                Execute Deduplication
                {data.toDelete > 0 && (
                  <span className={cn(
                    "ml-1 px-2 py-0.5 rounded-full text-xs font-bold",
                    canExecute ? "bg-red-800 text-red-200" : "bg-gray-700 text-gray-500"
                  )}>
                    {data.toDelete}
                  </span>
                )}
              </button>
              {data.toDelete === 0 && (
                <p className="text-sm text-gray-600">Nothing to delete — no duplicates found.</p>
              )}
            </div>
            {conflicts.length > 0 && !allConflictsResolved && (
              <p className="text-xs text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Resolve all {conflictsLeft} conflict{conflictsLeft !== 1 ? "s" : ""} above before executing
              </p>
            )}
          </div>
        )}

        {result && (
          <button
            onClick={() => { setResult(null); loadPreview(); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium transition-colors"
          >
            <Eye className="w-4 h-4" />
            Re-scan for remaining duplicates
          </button>
        )}
      </div>
    </>
  );
}
