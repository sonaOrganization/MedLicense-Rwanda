"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Trash2, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { LICENSE_CATEGORIES, LICENSE_CATEGORY_GROUPS } from "@/lib/license-categories";

interface Category { id: string; name_en: string; license_category?: string | null; }
interface AnswerField { text_en: string; text_fr: string; is_correct: boolean; }

type Lang = "EN" | "FR";

interface QuestionFormModalProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  question?: {
    id: string;
    text_en: string;
    text_fr?: string | null;
    explanation_en?: string | null;
    explanation_fr?: string | null;
    difficulty: string;
    category_id: string;
    language?: string | null;
    license_categories?: string[] | null;
    answers: { id?: string; text_en: string; text_fr?: string | null; is_correct: boolean }[];
  };
}

const EMPTY_ANSWERS: AnswerField[] = [
  { text_en: "", text_fr: "", is_correct: true  },
  { text_en: "", text_fr: "", is_correct: false },
  { text_en: "", text_fr: "", is_correct: false },
  { text_en: "", text_fr: "", is_correct: false },
];

export function QuestionFormModal({ open, onClose, categories, question }: QuestionFormModalProps) {
  const router = useRouter();
  const isEdit = !!question;

  const [lang,              setLang]              = useState<Lang>("EN");
  const [language,          setLanguage]          = useState<Lang>("EN");
  const [textEn,            setTextEn]            = useState("");
  const [textFr,            setTextFr]            = useState("");
  const [explanationEn,     setExplanationEn]     = useState("");
  const [explanationFr,     setExplanationFr]     = useState("");
  const [difficulty,        setDifficulty]        = useState("MEDIUM");
  const [categoryId,        setCategoryId]        = useState("");
  const [licenseCategories, setLicenseCategories] = useState<string[]>([]);
  const [answers,           setAnswers]           = useState<AnswerField[]>(EMPTY_ANSWERS);
  const [saving,            setSaving]            = useState(false);

  useEffect(() => {
    if (question) {
      setTextEn(question.text_en ?? "");
      setTextFr(question.text_fr ?? "");
      setExplanationEn(question.explanation_en ?? "");
      setExplanationFr(question.explanation_fr ?? "");
      setDifficulty(question.difficulty);
      setCategoryId(question.category_id);
      setLanguage((question.language as Lang) ?? "EN");
      setLicenseCategories(question.license_categories ?? []);
      setAnswers(question.answers.map((a) => ({
        text_en: a.text_en ?? "",
        text_fr: a.text_fr ?? "",
        is_correct: a.is_correct,
      })));
    } else {
      setTextEn(""); setTextFr("");
      setExplanationEn(""); setExplanationFr("");
      setDifficulty("MEDIUM");
      setCategoryId(categories[0]?.id ?? "");
      setLanguage("EN");
      setLicenseCategories([]);
      setAnswers(EMPTY_ANSWERS.map((a) => ({ ...a })));
    }
    setLang("EN");
  }, [question, categories, open]);

  // When language changes, switch the active tab to match
  useEffect(() => { setLang(language); }, [language]);

  const visibleCategories = useMemo(() => {
    if (licenseCategories.length === 0) return categories;
    return categories.filter(
      (c) => !c.license_category || licenseCategories.includes(c.license_category)
    );
  }, [categories, licenseCategories]);

  useEffect(() => {
    if (!categoryId) return;
    if (visibleCategories.length > 0 && !visibleCategories.some((c) => c.id === categoryId)) {
      setCategoryId(visibleCategories[0]?.id ?? "");
    }
  }, [visibleCategories]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleLicCat(id: string) {
    setLicenseCategories((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function setCorrect(idx: number) {
    setAnswers((prev) => prev.map((a, i) => ({ ...a, is_correct: i === idx })));
  }

  function updateAnswer(idx: number, field: "text_en" | "text_fr", value: string) {
    setAnswers((prev) => prev.map((a, i) => i === idx ? { ...a, [field]: value } : a));
  }

  function addAnswer() {
    if (answers.length >= 6) return;
    setAnswers((prev) => [...prev, { text_en: "", text_fr: "", is_correct: false }]);
  }

  function removeAnswer(idx: number) {
    if (answers.length <= 2) return;
    const next = answers.filter((_, i) => i !== idx);
    if (!next.some((a) => a.is_correct)) next[0].is_correct = true;
    setAnswers(next);
  }

  async function handleSave() {
    if (language === "EN" && !textEn.trim())
      return toast.error("English question text is required");
    if (language === "FR" && !textFr.trim())
      return toast.error("French question text is required");
    if (!categoryId)
      return toast.error("Select a category");
    if (!answers.some((a) => a.is_correct))
      return toast.error("Mark one answer as correct");
    if (language === "EN" && answers.some((a) => !a.text_en.trim()))
      return toast.error("All English answer fields must be filled in");
    if (language === "FR" && answers.some((a) => !a.text_fr.trim()))
      return toast.error("All French answer fields must be filled in");

    setSaving(true);
    try {
      const url    = isEdit ? `/api/admin/questions/${question!.id}` : "/api/admin/questions";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          text_en: textEn.trim() || null,
          text_fr: textFr.trim() || null,
          explanation_en: explanationEn.trim() || null,
          explanation_fr: explanationFr.trim() || null,
          difficulty,
          category_id: categoryId,
          license_categories: licenseCategories,
          answers: answers.map((a) => ({
            text_en: a.text_en.trim() || null,
            text_fr: a.text_fr.trim() || null,
            is_correct: a.is_correct,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(isEdit ? "Question updated" : "Question created");
      router.refresh();
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const isFr = lang === "FR";
  // Completeness indicators for the non-primary tab
  const secondaryLang = language === "EN" ? "FR" : "EN";
  const secondaryComplete = secondaryLang === "FR"
    ? (textFr.trim() !== "" && answers.every((a) => a.text_fr.trim() !== ""))
    : (textEn.trim() !== "" && answers.every((a) => a.text_en.trim() !== ""));
  const secondaryPartial = !secondaryComplete && (
    secondaryLang === "FR"
      ? (textFr.trim() !== "" || answers.some((a) => a.text_fr.trim() !== ""))
      : (textEn.trim() !== "" || answers.some((a) => a.text_en.trim() !== ""))
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white">
              {isEdit ? "Edit Question" : "Add New Question"}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Language selector */}
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-800 flex-shrink-0 bg-gray-50 dark:bg-gray-900/50">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Question Language *</p>
          <div className="flex gap-2">
            {(["EN", "FR"] as Lang[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLanguage(l)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-all",
                  language === l
                    ? l === "EN"
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                      : "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
                    : "border-gray-200 dark:border-gray-700 text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                )}
              >
                {l === "EN" ? "🇬🇧" : "🇫🇷"}
                {l === "EN" ? "English" : "French"}
                {language === l && (
                  <span className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                    l === "EN" ? "bg-blue-600 text-white" : "bg-indigo-600 text-white"
                  )}>
                    PRIMARY
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab bar (EN / FR content) */}
        <div className="flex gap-0 border-b border-gray-200 dark:border-gray-800 flex-shrink-0 px-6">
          {(["EN", "FR"] as Lang[]).map((l) => {
            const active      = lang === l;
            const isPrimary   = l === language;
            const isSecondary = l !== language;
            const showCheck   = isSecondary && secondaryComplete;
            const showDot     = isSecondary && secondaryPartial;
            return (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px",
                  active
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                )}
              >
                {l === "EN" ? "🇬🇧 English" : "🇫🇷 Français"}
                {isPrimary && <span className="text-[10px] text-red-500 font-bold">*</span>}
                {showCheck  && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                {showDot    && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
              </button>
            );
          })}
          {lang !== language && (
            <span className="ml-auto self-center text-[11px] text-gray-400 italic">
              Optional — shown as fallback
            </span>
          )}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* License Categories — only on primary tab */}
          {lang === language && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                License Categories *
                <span className="font-normal ml-1 text-gray-400">(select all that apply)</span>
              </label>
              <div className="space-y-3">
                {LICENSE_CATEGORY_GROUPS.map((group) => (
                  <div key={group}>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">{group}</p>
                    <div className="flex flex-wrap gap-2">
                      {LICENSE_CATEGORIES.filter((c) => c.group === group).map((c) => {
                        const checked = licenseCategories.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => toggleLicCat(c.id)}
                            className={cn(
                              "px-2.5 py-1 text-xs font-medium rounded-full border-2 transition-colors",
                              checked
                                ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
                                : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300"
                            )}
                          >
                            {c.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              {licenseCategories.length === 0 && (
                <p className="mt-1.5 text-[11px] text-amber-600 dark:text-amber-400">
                  No license selected — this question won&apos;t appear in any license-specific exam.
                </p>
              )}
            </div>
          )}

          {/* Category + Difficulty — only on primary tab */}
          {lang === language && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                  Subject Category *
                  {licenseCategories.length > 0 && (
                    <span className="font-normal ml-1 text-purple-500">({visibleCategories.length} available)</span>
                  )}
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select category</option>
                  {visibleCategories.map((c) => <option key={c.id} value={c.id}>{c.name_en}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Difficulty *</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>
            </div>
          )}

          {/* Question text */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
              {isFr ? "Question Text (French)" : "Question Text (English)"}
              {lang === language && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              value={isFr ? textFr : textEn}
              onChange={(e) => isFr ? setTextFr(e.target.value) : setTextEn(e.target.value)}
              rows={3}
              placeholder={isFr
                ? "Un patient de 45 ans se présente avec..."
                : "A 45-year-old patient presents with..."}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Answers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {isFr ? "Answer Options (French)" : "Answer Options (English)"}
                {!isFr && <span className="font-normal text-gray-400 ml-1">(click circle to mark correct)</span>}
                {lang === language && <span className="text-red-500 ml-1">*</span>}
              </label>
              {lang === language && answers.length < 6 && (
                <button onClick={addAnswer} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                  <Plus className="w-3.5 h-3.5" /> Add option
                </button>
              )}
            </div>
            <div className="space-y-2">
              {answers.map((ans, i) => (
                <div key={i} className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border-2 transition-colors",
                  ans.is_correct
                    ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10"
                    : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                )}>
                  <button
                    type="button"
                    onClick={() => lang === language && setCorrect(i)}
                    title={lang !== language ? undefined : "Mark as correct answer"}
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors",
                      ans.is_correct
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-gray-300 dark:border-gray-600 text-gray-400",
                      lang === language && !ans.is_correct && "hover:border-emerald-400 cursor-pointer",
                      lang !== language && "cursor-default"
                    )}
                  >
                    {ans.is_correct
                      ? <CheckCircle className="w-3.5 h-3.5" />
                      : <span className="text-xs font-bold">{String.fromCharCode(65 + i)}</span>}
                  </button>

                  <input
                    value={isFr ? ans.text_fr : ans.text_en}
                    onChange={(e) => updateAnswer(i, isFr ? "text_fr" : "text_en", e.target.value)}
                    placeholder={isFr
                      ? `Option ${String.fromCharCode(65 + i)} en français`
                      : `Option ${String.fromCharCode(65 + i)}`}
                    className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                  />
                  {lang === language && answers.length > 2 && (
                    <button onClick={() => removeAnswer(i)} className="text-gray-300 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
              {isFr ? "Explanation (French)" : "Explanation (English)"}
              {!isFr && <span className="font-normal ml-1">(shown after submission)</span>}
            </label>
            <textarea
              value={isFr ? explanationFr : explanationEn}
              onChange={(e) => isFr ? setExplanationFr(e.target.value) : setExplanationEn(e.target.value)}
              rows={2}
              placeholder={isFr
                ? "Expliquez pourquoi la bonne réponse est correcte..."
                : "Explain why the correct answer is right..."}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex-shrink-0 bg-gray-50 dark:bg-gray-900">
          <p className="text-[11px] text-gray-400 min-w-0">
            {secondaryComplete
              ? <span className="text-emerald-600 dark:text-emerald-400">✓ {secondaryLang === "FR" ? "French" : "English"} translation complete</span>
              : secondaryPartial
              ? <span className="text-amber-500">⚠ {secondaryLang === "FR" ? "French" : "English"} translation incomplete</span>
              : <span>{secondaryLang === "FR" ? "French" : "English"} translation optional</span>}
          </p>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 text-sm font-semibold rounded-lg bg-blue-700 hover:bg-blue-800 text-white transition-colors disabled:opacity-60"
            >
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Question"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
