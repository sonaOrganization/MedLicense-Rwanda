"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { X, Search, CheckSquare, Square, Wand2, List, RefreshCw, Loader2, Clock, Trophy, Star } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { LICENSE_CATEGORIES, LICENSE_CATEGORY_GROUPS, getLicenseCategoryLabel } from "@/lib/license-categories";

interface Category { id: string; name_en: string; license_category?: string | null; }
interface Question {
  id: string;
  text_en: string;
  text_fr?: string | null;
  difficulty: string;
  category_id: string;
  license_categories: string[];
  language?: string | null;
  category: { name_en: string };
}

interface Exam {
  id: string;
  title_en: string;
  description?: string | null;
  category_id: string;
  license_category?: string | null;
  target_language?: string | null;
  duration_minutes: number;
  passing_score: number;
  points_per_question?: number | null;
  is_free: boolean;
  is_published: boolean;
  shuffle_questions: boolean;
  shuffle_answers: boolean;
  exam_question_ids: string[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  questions: Question[];
  exam?: Exam;
}

type DiffMix = "balanced" | "progressive" | "challenge";
type ExamLang = "EN" | "FR";

const DIFF_MIXES: { id: DiffMix; label: string; desc: string }[] = [
  { id: "progressive", label: "Progressive",  desc: "20% Easy · 60% Medium · 20% Hard" },
  { id: "balanced",    label: "Balanced",      desc: "33% Easy · 34% Medium · 33% Hard" },
  { id: "challenge",   label: "Challenge",     desc: "10% Easy · 40% Medium · 50% Hard" },
];

const DIFF_COLOR: Record<string, string> = {
  EASY:   "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/40 dark:text-emerald-400",
  MEDIUM: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/40 dark:text-amber-400",
  HARD:   "text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/40 dark:text-red-400",
};

interface BreakdownRow {
  category_id: string; category_name: string;
  requested: number; selected: number;
  easy: number; medium: number; hard: number;
}

export function ExamFormModal({ open, onClose, categories, questions, exam }: Props) {
  const router = useRouter();
  const isEdit = !!exam;

  // ── Exam metadata ──
  const [titleEn,           setTitleEn]           = useState("");
  const [description,       setDescription]       = useState("");
  const [examLanguage,      setExamLanguage]      = useState<ExamLang>("EN");
  const [licenseCategory,   setLicenseCategory]   = useState("");
  const [duration,          setDuration]          = useState(60);
  const [passingScore,      setPassingScore]      = useState(70);
  const [pointsPerQuestion, setPointsPerQuestion] = useState(1);
  const [isFree,            setIsFree]            = useState(false);
  const [isPublished,       setIsPublished]       = useState(false);
  const [shuffleQ,          setShuffleQ]          = useState(true);
  const [shuffleA,          setShuffleA]          = useState(true);

  // ── Question selection ──
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [qMode,       setQMode]       = useState<"smart" | "manual">("smart");

  // ── Smart Build ──
  const [catRows,    setCatRows]    = useState<{ catId: string; enabled: boolean; count: number }[]>([]);
  const [diffMix,    setDiffMix]    = useState<DiffMix>("progressive");
  const [generating, setGenerating] = useState(false);
  const [breakdown,  setBreakdown]  = useState<BreakdownRow[] | null>(null);

  // ── Manual ──
  const [qSearch, setQSearch] = useState("");
  const [saving,  setSaving]  = useState(false);

  // ── Questions filtered by exam language + license category ──
  const langFilteredQuestions = useMemo(() => {
    let qs = questions.filter((q) => (q.language ?? "EN") === examLanguage);
    if (licenseCategory) {
      // Match by ID OR by label to handle legacy data stored with label strings
      const label = getLicenseCategoryLabel(licenseCategory);
      qs = qs.filter((q) =>
        q.license_categories.some(
          (lc) => lc === licenseCategory || lc.toLowerCase() === label.toLowerCase()
            || label.toLowerCase().includes(lc.toLowerCase())
            || lc.toLowerCase().includes(licenseCategory.replace(/_/g, " "))
        )
      );
    }
    return qs;
  }, [questions, examLanguage, licenseCategory]);

  // ── Availability map for Smart Build ──
  const availMap = useMemo(() => {
    const m: Record<string, { EASY: number; MEDIUM: number; HARD: number; total: number }> = {};
    for (const q of langFilteredQuestions) {
      if (!m[q.category_id]) m[q.category_id] = { EASY: 0, MEDIUM: 0, HARD: 0, total: 0 };
      const d = q.difficulty as "EASY" | "MEDIUM" | "HARD";
      if (d in m[q.category_id]) m[q.category_id][d]++;
      m[q.category_id].total++;
    }
    return m;
  }, [langFilteredQuestions]);

  // ── Smart Build rows: only categories that have questions in current language+license ──
  const visibleCatRows = useMemo(() => {
    if (!licenseCategory) return catRows;
    return catRows.filter((row) => {
      const cat = categories.find((c) => c.id === row.catId);
      return !cat?.license_category || cat.license_category === licenseCategory;
    });
  }, [catRows, licenseCategory, categories]);

  // Reset selections when language or license category changes
  useEffect(() => {
    setCatRows((prev) => prev.map((r) => ({ ...r, enabled: false, count: 0 })));
    setBreakdown(null);
    setSelectedIds([]);
  }, [examLanguage, licenseCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Populate on open ──
  useEffect(() => {
    if (!open) return;
    if (exam) {
      setTitleEn(exam.title_en);
      setDescription(exam.description ?? "");
      setExamLanguage((exam.target_language as ExamLang) ?? "EN");
      setLicenseCategory(exam.license_category ?? "");
      setDuration(exam.duration_minutes);
      setPassingScore(exam.passing_score);
      setPointsPerQuestion(exam.points_per_question ?? 1);
      setIsFree(exam.is_free);
      setIsPublished(exam.is_published);
      setShuffleQ(exam.shuffle_questions);
      setShuffleA(exam.shuffle_answers);
      setSelectedIds(exam.exam_question_ids);
      setQMode("manual");
    } else {
      setTitleEn(""); setDescription("");
      setExamLanguage("EN"); setLicenseCategory("");
      setDuration(60); setPassingScore(70); setPointsPerQuestion(1);
      setIsFree(false); setIsPublished(false); setShuffleQ(true); setShuffleA(true);
      setSelectedIds([]);
      setQMode("smart");
    }
    setBreakdown(null); setQSearch("");
    setCatRows(categories.map((c) => ({ catId: c.id, enabled: false, count: 0 })));
    setDiffMix("progressive");
  }, [open, exam, categories]);

  // ── Smart Build: generate ──
  async function handleGenerate() {
    const selections = visibleCatRows
      .filter((r) => r.enabled && r.count > 0)
      .map((r) => ({ category_id: r.catId, count: r.count }));
    if (selections.length === 0) return toast.error("Enable at least one category with a count > 0");

    setGenerating(true); setBreakdown(null);
    try {
      const res = await fetch("/api/admin/exams/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_selections: selections,
          difficulty_mix:      diffMix,
          license_category:    licenseCategory  || undefined,
          language:            examLanguage,     // filters questions by EN or FR
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSelectedIds(data.question_ids);
      setBreakdown(data.breakdown);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  // ── Manual: toggle ──
  function toggleQuestion(id: string) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  const filteredQuestions = useMemo(() => {
    const s = qSearch.toLowerCase();
    return s
      ? langFilteredQuestions.filter((q) => {
          const text = examLanguage === "FR" ? (q.text_fr ?? q.text_en) : q.text_en;
          return text.toLowerCase().includes(s) || q.category.name_en.toLowerCase().includes(s);
        })
      : langFilteredQuestions;
  }, [langFilteredQuestions, qSearch, examLanguage]);

  // ── Save ──
  async function handleSave() {
    if (!titleEn.trim())          return toast.error("Exam title is required");
    if (selectedIds.length === 0) return toast.error("Select at least one question");

    setSaving(true);
    try {
      const url    = isEdit ? `/api/admin/exams/${exam!.id}` : "/api/admin/exams";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title_en:           titleEn.trim(),
          description:        description.trim() || null,
          target_language:    examLanguage,
          license_category:   licenseCategory || null,
          duration_minutes:   duration,
          passing_score:      passingScore,
          points_per_question: pointsPerQuestion,
          is_free:            isFree,
          is_published:       isPublished,
          shuffle_questions:  shuffleQ,
          shuffle_answers:    shuffleA,
          question_ids:       selectedIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(isEdit ? "Exam updated" : "Exam created");
      router.refresh(); onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  const totalRequested = visibleCatRows
    .filter((r) => r.enabled && (availMap[r.catId]?.total ?? 0) > 0)
    .reduce((s, r) => s + r.count, 0);

  const totalScore = selectedIds.length * pointsPerQuestion;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-3xl max-h-[92vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <h2 className="font-bold text-gray-900 dark:text-white">{isEdit ? "Edit Exam" : "Create New Exam"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* ── Step 1: Exam Language ── */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
              Exam Language <span className="text-red-500">*</span>
              <span className="font-normal ml-1 text-gray-400">— determines which questions are used</span>
            </label>
            <div className="flex gap-3">
              {([
                { value: "EN" as ExamLang, flag: "🇬🇧", label: "English",  sub: "Uses English questions" },
                { value: "FR" as ExamLang, flag: "🇫🇷", label: "French",   sub: "Uses French questions"  },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setExamLanguage(opt.value)}
                  className={cn(
                    "flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all",
                    examLanguage === opt.value
                      ? opt.value === "EN"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10"
                        : "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  )}
                >
                  <span className="text-2xl">{opt.flag}</span>
                  <div>
                    <p className={cn("text-sm font-semibold", examLanguage === opt.value
                      ? opt.value === "EN" ? "text-blue-700 dark:text-blue-300" : "text-indigo-700 dark:text-indigo-300"
                      : "text-gray-600 dark:text-gray-300")}>{opt.label}</p>
                    <p className="text-[11px] text-gray-400">{opt.sub}</p>
                  </div>
                  {examLanguage === opt.value && (
                    <div className={cn("ml-auto w-5 h-5 rounded-full flex items-center justify-center",
                      opt.value === "EN" ? "bg-blue-500" : "bg-indigo-500"
                    )}>
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Step 2: Exam Title & Description ── */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                Exam Title <span className="text-red-500">*</span>
              </label>
              <input
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="e.g. Obstetrics & Gynaecology — Mock Exam 1"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                Description <span className="font-normal">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Brief description shown to students..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          {/* ── Step 3: Target License Category ── */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
              Target License Category
              <span className="font-normal ml-1 text-gray-400">— filters questions and student visibility</span>
            </label>
            <select
              value={licenseCategory}
              onChange={(e) => setLicenseCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All students (no restriction)</option>
              {LICENSE_CATEGORY_GROUPS.map((group) => (
                <optgroup key={group} label={group}>
                  {LICENSE_CATEGORIES.filter((c) => c.group === group).map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            {licenseCategory && (
              <p className="mt-1.5 text-xs text-purple-600 dark:text-purple-400">
                Only &quot;{LICENSE_CATEGORIES.find((c) => c.id === licenseCategory)?.label}&quot; students will see this exam. Smart Build will only show tagged questions.
              </p>
            )}
          </div>

          {/* ── Step 4: Category + Duration + Scores ── */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
              Duration &amp; Scores
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-gray-400 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Duration (min)
                </label>
                <input type="number" min={5} max={480} value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-2.5 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-gray-400 mb-1 flex items-center gap-1">
                  <Trophy className="w-3 h-3" /> Passing Score (%)
                </label>
                <input type="number" min={0} max={100} value={passingScore}
                  onChange={(e) => setPassingScore(Number(e.target.value))}
                  className="w-full px-2.5 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-gray-400 mb-1 flex items-center gap-1">
                  <Star className="w-3 h-3" /> Points / Question
                </label>
                <input type="number" min={1} max={100} value={pointsPerQuestion}
                  onChange={(e) => setPointsPerQuestion(Number(e.target.value))}
                  className="w-full px-2.5 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {selectedIds.length > 0 && (
              <p className="mt-1.5 text-xs text-gray-400">
                Total score: <strong className="text-gray-700 dark:text-gray-300">{totalScore} pts</strong> ·
                Pass at: <strong className="text-gray-700 dark:text-gray-300">{Math.ceil(totalScore * passingScore / 100)} pts</strong> ({passingScore}%)
              </p>
            )}
          </div>

          {/* ── Toggles ── */}
          <div className="grid grid-cols-2 gap-3">
            {([
              { label: "Free for all students",           value: isFree,      set: setIsFree      },
              { label: "Published (visible to students)",  value: isPublished, set: setIsPublished },
              { label: "Shuffle questions",                value: shuffleQ,    set: setShuffleQ    },
              { label: "Shuffle answers",                  value: shuffleA,    set: setShuffleA    },
            ] as const).map(({ label, value, set }) => (
              <button key={label} type="button" onClick={() => set(!value)}
                className={cn("flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-sm font-medium text-left transition-colors",
                  value
                    ? "border-blue-400 bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300"
                    : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400"
                )}>
                {value ? <CheckSquare className="w-4 h-4 flex-shrink-0" /> : <Square className="w-4 h-4 flex-shrink-0" />}
                {label}
              </button>
            ))}
          </div>

          {/* ── Question Selection ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Questions <span className="text-red-500">*</span>
                  <span className="font-normal text-gray-400 ml-1">({selectedIds.length} selected)</span>
                </label>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Showing {examLanguage === "EN" ? "🇬🇧 English" : "🇫🇷 French"} questions
                  {licenseCategory && ` · ${LICENSE_CATEGORIES.find(c => c.id === licenseCategory)?.label}`}
                </p>
              </div>
              <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                {(["smart", "manual"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setQMode(mode)}
                    className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors",
                      qMode === mode
                        ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                    )}
                  >
                    {mode === "smart" ? <><Wand2 className="w-3.5 h-3.5" /> Smart Build</> : <><List className="w-3.5 h-3.5" /> Manual</>}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Smart Build panel ── */}
            {qMode === "smart" && (
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">

                {/* Difficulty mix */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Difficulty Mix</p>
                  <div className="flex gap-2">
                    {DIFF_MIXES.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => { setDiffMix(m.id); setBreakdown(null); }}
                        className={cn(
                          "flex-1 px-3 py-2 rounded-lg border-2 text-xs font-semibold text-left transition-colors",
                          diffMix === m.id
                            ? m.id === "progressive"
                              ? "border-amber-400 bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-300"
                              : m.id === "balanced"
                                ? "border-blue-400 bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300"
                                : "border-red-400 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-300"
                            : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300"
                        )}
                      >
                        <div>{m.label}</div>
                        <div className="text-[10px] font-normal mt-0.5 opacity-80">{m.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category rows */}
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  <div className="grid grid-cols-[1fr_80px_auto] gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-800/30">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Category</p>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 text-center">Count</p>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 text-right w-32">Available</p>
                  </div>

                  {visibleCatRows.filter((row) => (availMap[row.catId]?.total ?? 0) > 0).length === 0 && (
                    <div className="px-4 py-6 text-center text-sm text-gray-400">
                      No {examLanguage === "EN" ? "English" : "French"} questions
                      {licenseCategory ? " for this license category" : ""} yet.
                    </div>
                  )}

                  {visibleCatRows.map((row) => {
                    const avail = availMap[row.catId] ?? { EASY: 0, MEDIUM: 0, HARD: 0, total: 0 };
                    if (avail.total === 0) return null;
                    const cat      = categories.find((c) => c.id === row.catId);
                    const globalIdx = catRows.findIndex((r) => r.catId === row.catId);
                    return (
                      <div key={row.catId}
                        className={cn("grid grid-cols-[1fr_80px_auto] items-center gap-3 px-4 py-2.5 transition-colors",
                          row.enabled ? "bg-blue-50/40 dark:bg-blue-900/5" : ""
                        )}
                      >
                        <button type="button"
                          onClick={() => {
                            const next = [...catRows];
                            next[globalIdx] = { ...next[globalIdx], enabled: !next[globalIdx].enabled };
                            setCatRows(next); setBreakdown(null);
                          }}
                          className="flex items-center gap-2.5 text-left"
                        >
                          <div className={cn("w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                            row.enabled ? "border-blue-500 bg-blue-500" : "border-gray-300 dark:border-gray-600"
                          )}>
                            {row.enabled && <div className="w-2 h-2 bg-white rounded-sm" />}
                          </div>
                          <span className={cn("text-sm font-medium", row.enabled ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400")}>
                            {cat?.name_en}
                          </span>
                        </button>

                        <input type="number" min={0} value={row.count} disabled={!row.enabled}
                          onChange={(e) => {
                            const next = [...catRows];
                            next[globalIdx] = { ...next[globalIdx], count: Math.max(0, Number(e.target.value) || 0) };
                            setCatRows(next); setBreakdown(null);
                          }}
                          className="w-full px-2 py-1.5 text-sm text-center rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
                        />

                        <div className="flex items-center gap-1.5 w-32 justify-end">
                          <span className="text-[10px] text-gray-400">{avail.total}</span>
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded border", DIFF_COLOR.EASY)}>E:{avail.EASY}</span>
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded border", DIFF_COLOR.MEDIUM)}>M:{avail.MEDIUM}</span>
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded border", DIFF_COLOR.HARD)}>H:{avail.HARD}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Generate button */}
                <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 flex items-center justify-between gap-3">
                  <span className="text-xs text-gray-500">
                    {totalRequested > 0 ? `${totalRequested} question${totalRequested !== 1 ? "s" : ""} requested` : "Enable categories and set counts above"}
                  </span>
                  <button type="button" onClick={handleGenerate}
                    disabled={generating || totalRequested === 0}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-blue-700 hover:bg-blue-800 text-white transition-colors disabled:opacity-50"
                  >
                    {generating
                      ? <><Loader2 className="w-4 h-4 animate-spin" />Generating…</>
                      : <><Wand2 className="w-4 h-4" />Generate Question Set</>
                    }
                  </button>
                </div>

                {/* Breakdown */}
                {breakdown && (
                  <div className="border-t border-gray-100 dark:border-gray-800">
                    <div className="px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/10 flex items-center justify-between">
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        ✓ {selectedIds.length} questions selected · Total: {totalScore} pts
                      </p>
                      <button type="button" onClick={handleGenerate} disabled={generating}
                        className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                      >
                        <RefreshCw className="w-3 h-3" />Regenerate
                      </button>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {breakdown.map((b) => (
                        <div key={b.category_id} className="px-4 py-2.5 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{b.category_name}</p>
                            {b.selected < b.requested && (
                              <p className="text-[10px] text-amber-600 dark:text-amber-400">Only {b.selected}/{b.requested} available</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 w-8 text-right">{b.selected}q</span>
                            <span className={cn("text-[10px] px-1.5 py-0.5 rounded border", DIFF_COLOR.EASY)}>E:{b.easy}</span>
                            <span className={cn("text-[10px] px-1.5 py-0.5 rounded border", DIFF_COLOR.MEDIUM)}>M:{b.medium}</span>
                            <span className={cn("text-[10px] px-1.5 py-0.5 rounded border", DIFF_COLOR.HARD)}>H:{b.hard}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Manual panel ── */}
            {qMode === "manual" && (
              <>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  <input value={qSearch} onChange={(e) => setQSearch(e.target.value)}
                    placeholder={`Search ${examLanguage === "FR" ? "French" : "English"} questions…`}
                    className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="max-h-60 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredQuestions.length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-6">
                      No {examLanguage === "EN" ? "English" : "French"} questions found
                    </p>
                  )}
                  {filteredQuestions.map((q) => {
                    const selected  = selectedIds.includes(q.id);
                    const displayText = examLanguage === "FR" ? (q.text_fr ?? q.text_en) : q.text_en;
                    return (
                      <button key={q.id} type="button" onClick={() => toggleQuestion(q.id)}
                        className={cn("w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                          selected ? "bg-blue-50 dark:bg-blue-900/10" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        )}
                      >
                        <div className={cn("w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-colors",
                          selected ? "border-blue-500 bg-blue-500" : "border-gray-300 dark:border-gray-600"
                        )}>
                          {selected && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-1">{displayText}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[10px] text-blue-500 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 px-1.5 py-0.5 rounded-full">{q.category.name_en}</span>
                          <span className={cn("text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full border", DIFF_COLOR[q.difficulty] ?? DIFF_COLOR.MEDIUM)}>{q.difficulty}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex-shrink-0 bg-gray-50 dark:bg-gray-900">
          <p className="text-xs text-gray-400">
            {selectedIds.length} question{selectedIds.length !== 1 ? "s" : ""}
            {selectedIds.length > 0 && <> · {totalScore} pts total</>}
          </p>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="px-5 py-2 text-sm font-semibold rounded-lg bg-blue-700 hover:bg-blue-800 text-white transition-colors disabled:opacity-60"
            >
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Exam"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
