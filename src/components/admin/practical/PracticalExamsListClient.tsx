"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Stethoscope, Edit, Trash2, FolderOpen, ListChecks } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PracticalExamToggle } from "./PracticalExamToggle";
import { PracticalExamFormModal } from "./PracticalExamFormModal";
import { getLicenseCategoryLabel } from "@/lib/license-categories";
import toast from "react-hot-toast";

interface Category { id: string; name_en: string; }

interface PracticalExam {
  id: string;
  title_en: string;
  description?: string | null;
  category_id?: string | null;
  license_category?: string | null;
  target_language?: string | null;
  is_free: boolean;
  is_published: boolean;
  total_groups: number;
  total_subquestions: number;
  category: { name_en: string } | null;
}

interface Props {
  exams: PracticalExam[];
  categories: Category[];
  currentCategory: string;
  currentPublished: string;
}

export function PracticalExamsListClient({ exams, categories, currentCategory, currentPublished }: Props) {
  const router = useRouter();
  const [addOpen,    setAddOpen]    = useState(false);
  const [editExam,   setEditExam]   = useState<PracticalExam | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const totalPublished = exams.filter((e) => e.is_published).length;
  const totalFree      = exams.filter((e) => e.is_free).length;

  async function handleDelete(id: string) {
    if (!confirm("Delete this practical exam and all its cases? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/practical-exams/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Practical exam deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete exam");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Practical Exams</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {exams.length} total · {totalPublished} published · {totalFree} free
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Practical Exam
        </button>
      </div>

      <form className="flex flex-wrap gap-3 mt-4">
        <select
          name="category"
          defaultValue={currentCategory}
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name_en}</option>)}
        </select>
        <select
          name="published"
          defaultValue={currentPublished}
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="">All Status</option>
          <option value="true">Published</option>
          <option value="false">Draft</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Filter
        </button>
      </form>

      <div className="space-y-3 mt-4">
        {exams.length === 0 && (
          <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
            <Stethoscope className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No practical exams yet</p>
            <p className="text-sm mt-1">Create your first one above.</p>
          </div>
        )}
        {exams.map((exam) => (
          <div
            key={exam.id}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
          >
            <div className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {exam.category && <Badge variant="info">{exam.category.name_en}</Badge>}
                    <Badge variant={exam.is_published ? "success" : "warning"}>
                      {exam.is_published ? "Published" : "Draft"}
                    </Badge>
                    {exam.is_free && <Badge variant="default">Free</Badge>}
                    {exam.license_category && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
                        {getLicenseCategoryLabel(exam.license_category)}
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{exam.title_en}</p>
                  {exam.description && (
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{exam.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <FolderOpen className="w-3.5 h-3.5" />
                      {exam.total_groups} case{exam.total_groups !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <ListChecks className="w-3.5 h-3.5" />
                      {exam.total_subquestions} question{exam.total_subquestions !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <PracticalExamToggle examId={exam.id} isPublished={exam.is_published} />
                  <Link
                    href={`/admin/practical/${exam.id}/edit`}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 transition-colors"
                  >
                    Manage Content →
                  </Link>
                  <button
                    onClick={() => setEditExam(exam)}
                    className="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                    title="Edit exam"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(exam.id)}
                    disabled={deletingId === exam.id}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                    title="Delete exam"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <PracticalExamFormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        categories={categories}
      />
      <PracticalExamFormModal
        open={!!editExam}
        onClose={() => setEditExam(null)}
        categories={categories}
        exam={editExam ?? undefined}
      />
    </>
  );
}
