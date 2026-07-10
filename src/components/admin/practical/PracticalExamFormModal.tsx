"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, CheckSquare, Square } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { FlagIcon } from "@/components/ui/FlagIcon";
import { LICENSE_CATEGORIES, LICENSE_CATEGORY_GROUPS } from "@/lib/license-categories";

interface Category { id: string; name_en: string; }

type ExamLang = "EN" | "FR";

interface PracticalExam {
  id: string;
  title_en: string;
  description?: string | null;
  category_id?: string | null;
  license_category?: string | null;
  target_language?: string | null;
  is_free: boolean;
  is_published: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  exam?: PracticalExam;
}

export function PracticalExamFormModal({ open, onClose, categories, exam }: Props) {
  const router = useRouter();
  const isEdit = !!exam;

  const [titleEn,         setTitleEn]         = useState("");
  const [description,     setDescription]     = useState("");
  const [examLanguage,    setExamLanguage]    = useState<ExamLang>("EN");
  const [categoryId,      setCategoryId]      = useState("");
  const [licenseCategory, setLicenseCategory] = useState("");
  const [isFree,          setIsFree]          = useState(false);
  const [isPublished,     setIsPublished]     = useState(false);
  const [saving,          setSaving]          = useState(false);

  useEffect(() => {
    if (!open) return;
    if (exam) {
      setTitleEn(exam.title_en);
      setDescription(exam.description ?? "");
      setExamLanguage((exam.target_language as ExamLang) ?? "EN");
      setCategoryId(exam.category_id ?? "");
      setLicenseCategory(exam.license_category ?? "");
      setIsFree(exam.is_free);
      setIsPublished(exam.is_published);
    } else {
      setTitleEn(""); setDescription("");
      setExamLanguage("EN"); setCategoryId(categories[0]?.id ?? "");
      setLicenseCategory(""); setIsFree(false); setIsPublished(false);
    }
  }, [open, exam, categories]);

  async function handleSave() {
    if (!titleEn.trim()) return toast.error("Exam title is required");

    setSaving(true);
    try {
      const url    = isEdit ? `/api/admin/practical-exams/${exam!.id}` : "/api/admin/practical-exams";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title_en: titleEn.trim(),
          description: description.trim() || null,
          target_language: examLanguage,
          category_id: categoryId || null,
          license_category: licenseCategory || null,
          is_free: isFree,
          is_published: isPublished,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(isEdit ? "Exam updated" : "Exam created");
      router.refresh();
      onClose();
      if (!isEdit && data.id) router.push(`/admin/practical/${data.id}/edit`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <h2 className="font-bold text-gray-900 dark:text-white">
            {isEdit ? "Edit Practical Exam" : "Create New Practical Exam"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Language */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
              Exam Language <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              {(["EN", "FR"] as ExamLang[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setExamLanguage(l)}
                  className={cn(
                    "flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all",
                    examLanguage === l
                      ? "border-amber-500 bg-amber-50 dark:bg-amber-900/10"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  )}
                >
                  <FlagIcon lang={l} size={20} />
                  <span className={cn("text-sm font-semibold", examLanguage === l ? "text-amber-700 dark:text-amber-300" : "text-gray-600 dark:text-gray-300")}>
                    {l === "EN" ? "English" : "French"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Title + description */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
              Exam Title <span className="text-red-500">*</span>
            </label>
            <input
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder="e.g. Obstetric Emergencies — Case Review 1"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Subject Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">No category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name_en}</option>)}
            </select>
          </div>

          {/* License category */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
              Target License Category
              <span className="font-normal ml-1 text-gray-400">— filters student visibility</span>
            </label>
            <select
              value={licenseCategory}
              onChange={(e) => setLicenseCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
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
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-3">
            {([
              { label: "Free for all students",           value: isFree,      set: setIsFree      },
              { label: "Published (visible to students)", value: isPublished, set: setIsPublished },
            ] as const).map(({ label, value, set }) => (
              <button key={label} type="button" onClick={() => set(!value)}
                className={cn("flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-sm font-medium text-left transition-colors",
                  value
                    ? "border-amber-400 bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-300"
                    : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400"
                )}>
                {value ? <CheckSquare className="w-4 h-4 flex-shrink-0" /> : <Square className="w-4 h-4 flex-shrink-0" />}
                {label}
              </button>
            ))}
          </div>

          {!isEdit && (
            <p className="text-xs text-gray-400">
              After creating, you&apos;ll be taken to the content editor to add case questions.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex-shrink-0 bg-gray-50 dark:bg-gray-900">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 text-sm font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors disabled:opacity-60"
          >
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create & Add Content"}
          </button>
        </div>
      </div>
    </div>
  );
}
