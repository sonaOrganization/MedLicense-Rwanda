"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, X, BookOpen, AlertTriangle, Trash2, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLicenseCategoryLabel } from "@/lib/license-categories";
import toast from "react-hot-toast";

interface Question {
  id: string;
  text_en: string;
  text_fr: string | null;
  language: string;
  difficulty: string;
  license_categories: string[];
  is_approved: boolean;
  created_at: string;
  category: { id: string; name_en: string } | null;
}

interface Props {
  questions: Question[];
  totalInBank: number;
  totalUsed: number;
}

type LangTab = "all" | "EN" | "FR";

const DIFF_CLS: Record<string, string> = {
  EASY:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  HARD:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function QuestionTable({
  rows,
  deletingId,
  onDelete,
}: {
  rows: Question[];
  deletingId: string | null;
  onDelete: (id: string) => void;
}) {
  if (rows.length === 0) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            {["#", "Question", "Category", "Diff", "License", "Added", ""].map((h) => (
              <th
                key={h}
                className={cn(
                  "px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500",
                  h === "" ? "text-right" : "text-left"
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.map((q, i) => (
            <tr key={q.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">

              {/* # */}
              <td className="px-4 py-3 text-xs text-gray-400 font-mono w-10">{i + 1}</td>

              {/* Question text */}
              <td className="px-4 py-3 max-w-xs">
                <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2 leading-snug">
                  {q.language === "FR" && q.text_fr ? q.text_fr : q.text_en}
                </p>
              </td>

              {/* Category */}
              <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                {q.category?.name_en ?? "—"}
              </td>

              {/* Difficulty */}
              <td className="px-4 py-3">
                <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap", DIFF_CLS[q.difficulty] ?? DIFF_CLS.MEDIUM)}>
                  {q.difficulty}
                </span>
              </td>

              {/* License */}
              <td className="px-4 py-3 max-w-[150px]">
                {q.license_categories.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {q.license_categories.slice(0, 2).map((lic) => (
                      <span key={lic} className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 whitespace-nowrap">
                        {getLicenseCategoryLabel(lic)}
                      </span>
                    ))}
                    {q.license_categories.length > 2 && (
                      <span className="text-[10px] text-gray-400">+{q.license_categories.length - 2}</span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">—</span>
                )}
              </td>

              {/* Date added */}
              <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                {fmtDate(q.created_at)}
              </td>

              {/* Delete action */}
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onDelete(q.id)}
                  disabled={deletingId === q.id}
                  className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 ml-auto px-2.5 py-1.5 text-xs font-medium rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-200 dark:hover:border-red-800/40 transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {deletingId === q.id ? "…" : "Delete"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function UnusedQuestionsClient({ questions, totalInBank, totalUsed }: Props) {
  const router = useRouter();

  const [langTab,    setLangTab]    = useState<LangTab>("all");
  const [search,     setSearch]     = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [category,   setCategory]   = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleted,    setDeleted]    = useState<Set<string>>(new Set());

  const live = useMemo(
    () => questions.filter((q) => !deleted.has(q.id)),
    [questions, deleted]
  );

  const enCount = useMemo(() => live.filter((q) => q.language === "EN").length, [live]);
  const frCount = useMemo(() => live.filter((q) => q.language === "FR").length, [live]);

  // Unique categories from the live list
  const categories = useMemo(() => {
    const map = new Map<string, string>();
    live.forEach((q) => {
      if (q.category) map.set(q.category.id, q.category.name_en);
    });
    return Array.from(map.entries()).sort(([, a], [, b]) => a.localeCompare(b));
  }, [live]);

  function applyFilters(list: Question[]) {
    return list.filter((q) => {
      if (search) {
        const s = search.toLowerCase();
        if (!q.text_en.toLowerCase().includes(s) && !(q.text_fr ?? "").toLowerCase().includes(s)) return false;
      }
      if (difficulty && q.difficulty !== difficulty) return false;
      if (category   && q.category?.id !== category) return false;
      return true;
    });
  }

  const filtered = useMemo(() => {
    const base = langTab === "all" ? live : live.filter((q) => q.language === langTab);
    return applyFilters(base);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, langTab, search, difficulty, category]);

  // For grouped "All" view split into EN / FR sections
  const filteredEN = useMemo(() => applyFilters(live.filter((q) => q.language === "EN")), [live, search, difficulty, category]); // eslint-disable-line react-hooks/exhaustive-deps
  const filteredFR = useMemo(() => applyFilters(live.filter((q) => q.language === "FR")), [live, search, difficulty, category]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasFilters = search || difficulty || category;
  const unusedTotal = live.length;
  const visibleCount = filtered.length;

  function clearFilters() {
    setSearch(""); setDifficulty(""); setCategory("");
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this question permanently? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/questions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      setDeleted((prev) => new Set([...prev, id]));
      toast.success("Question deleted");
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  }

  const LANG_TABS: { key: LangTab; label: string; count: number; activeClass: string }[] = [
    { key: "all", label: "All Languages", count: unusedTotal,  activeClass: "bg-violet-600 text-white" },
    { key: "EN",  label: "English (EN)",  count: enCount,      activeClass: "bg-gray-700 text-white" },
    { key: "FR",  label: "French (FR)",   count: frCount,      activeClass: "bg-blue-600 text-white" },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shadow-sm flex-shrink-0">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Unused Questions</h1>
          <p className="text-sm text-gray-400 mt-0.5">Questions approved but not included in any exam</p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalInBank}</p>
          <p className="text-xs text-gray-400 mt-0.5">Total Approved</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-500">{totalUsed}</p>
          <p className="text-xs text-gray-400 mt-0.5">Used in Exams</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center">
          <p className="text-2xl font-bold text-violet-500">{unusedTotal}</p>
          <p className="text-xs text-gray-400 mt-0.5">Unused</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center">
          <p className="text-2xl font-bold text-amber-500">
            {totalInBank > 0 ? Math.round((unusedTotal / totalInBank) * 100) : 0}%
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Sitting Idle</p>
        </div>
      </div>

      {unusedTotal > 0 && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            <span className="font-semibold">{unusedTotal} questions</span> are approved but never assigned to an exam —
            {enCount > 0 && <span className="font-semibold"> {enCount} EN</span>}
            {enCount > 0 && frCount > 0 && ","}
            {frCount > 0 && <span className="font-semibold"> {frCount} FR</span>}.
            {" "}Add them to exams via the Exam Builder, or delete low-quality ones.
          </p>
        </div>
      )}

      {/* Language tabs */}
      <div className="flex gap-2 flex-wrap">
        {LANG_TABS.map(({ key, label, count, activeClass }) => (
          <button
            key={key}
            onClick={() => setLangTab(key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-colors",
              langTab === key
                ? activeClass
                : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            {label}
            <span className={cn(
              "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
              langTab === key ? "bg-white/20" : "bg-gray-100 dark:bg-gray-800 text-gray-500"
            )}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />

          {/* Search */}
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search question text…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Difficulty */}
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>

          {/* Category */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">All Categories</option>
            {categories.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}

          <span className="ml-auto text-xs text-gray-400">
            {langTab === "all"
              ? `${filteredEN.length + filteredFR.length} question${filteredEN.length + filteredFR.length !== 1 ? "s" : ""} shown`
              : `${visibleCount} question${visibleCount !== 1 ? "s" : ""} shown`}
          </span>
        </div>
      </div>

      {/* Content */}
      {langTab === "all" ? (
        /* Grouped view: EN section then FR section */
        (filteredEN.length === 0 && filteredFR.length === 0) ? (
          <EmptyState hasFilters={!!hasFilters} onClear={clearFilters} />
        ) : (
          <div className="space-y-6">
            {/* English section */}
            {filteredEN.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60">
                  <span className="px-2.5 py-1 rounded-lg bg-gray-700 text-white text-xs font-bold tracking-wider">EN</span>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">English Questions</span>
                  <span className="ml-auto text-xs text-gray-400">{filteredEN.length} unused</span>
                </div>
                <QuestionTable rows={filteredEN} deletingId={deletingId} onDelete={handleDelete} />
              </div>
            )}

            {/* French section */}
            {filteredFR.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-blue-50 dark:bg-blue-900/10">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold tracking-wider">FR</span>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">French Questions</span>
                  <span className="ml-auto text-xs text-gray-400">{filteredFR.length} unused</span>
                </div>
                <QuestionTable rows={filteredFR} deletingId={deletingId} onDelete={handleDelete} />
              </div>
            )}
          </div>
        )
      ) : (
        /* Single-language view */
        filtered.length === 0 ? (
          <EmptyState hasFilters={!!hasFilters} onClear={clearFilters} />
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <QuestionTable rows={filtered} deletingId={deletingId} onDelete={handleDelete} />
            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                Showing {visibleCount} of {langTab === "EN" ? enCount : frCount} unused {langTab === "EN" ? "English" : "French"} questions
              </p>
              {hasFilters && (
                <p className="text-xs text-gray-400">
                  {(langTab === "EN" ? enCount : frCount) - visibleCount} hidden by filters
                </p>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}

function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="py-20 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
      <BookOpen className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
      <p className="text-gray-500 text-sm font-medium">
        {hasFilters ? "No questions match these filters." : "All approved questions are used in exams!"}
      </p>
      {hasFilters && (
        <button onClick={onClear} className="mt-2 text-xs text-violet-500 hover:underline">
          Clear filters
        </button>
      )}
    </div>
  );
}
