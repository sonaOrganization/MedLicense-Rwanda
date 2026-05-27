import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Clock, Target, FileText } from "lucide-react";
import { ExamToggle } from "@/components/admin/ExamToggle";

interface Props {
  searchParams: Promise<{ category?: string; published?: string }>;
}

export default async function AdminExamsPage({ searchParams }: Props) {
  const { category, published } = await searchParams;

  let query = supabase
    .from("exams")
    .select("*, category:categories(name_en), exam_questions(count)")
    .order("created_at", { ascending: false });

  if (category) query = query.eq("category_id", category);
  if (published !== undefined && published !== "")
    query = query.eq("is_published", published === "true");

  const { data: exams } = await query;
  const { data: categories } = await supabase.from("categories").select("id, name_en");

  const examList = exams ?? [];
  const categoryList = categories ?? [];

  const totalPublished = examList.filter((e: { is_published: boolean }) => e.is_published).length;
  const totalFree = examList.filter((e: { is_free: boolean }) => e.is_free).length;

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Exams</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {examList.length} total · {totalPublished} published · {totalFree} free
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> New Exam
        </Button>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-3">
        <select
          name="category"
          defaultValue={category ?? ""}
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="">All Categories</option>
          {categoryList.map((c: { id: string; name_en: string }) => (
            <option key={c.id} value={c.id}>{c.name_en}</option>
          ))}
        </select>
        <select
          name="published"
          defaultValue={published ?? ""}
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="">All Status</option>
          <option value="true">Published</option>
          <option value="false">Draft</option>
        </select>
        <Button type="submit" size="sm" variant="outline">Filter</Button>
      </form>

      <div className="space-y-3">
        {examList.map((exam: {
          id: string;
          title_en: string;
          duration_minutes: number;
          passing_score: number;
          is_published: boolean;
          is_free: boolean;
          category: { name_en: string };
          exam_questions: { count: number }[];
        }) => (
          <Card key={exam.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <Badge variant="info">{exam.category.name_en}</Badge>
                    <Badge variant={exam.is_published ? "success" : "warning"}>
                      {exam.is_published ? "Published" : "Draft"}
                    </Badge>
                    {exam.is_free && <Badge variant="default">Free</Badge>}
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{exam.title_en}</p>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      {exam.exam_questions[0]?.count ?? 0} questions
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {exam.duration_minutes} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="w-3.5 h-3.5" />
                      Pass: {exam.passing_score}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <ExamToggle examId={exam.id} isPublished={exam.is_published} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {examList.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No exams yet. Create your first exam.</p>
          </div>
        )}
      </div>
    </div>
  );
}
