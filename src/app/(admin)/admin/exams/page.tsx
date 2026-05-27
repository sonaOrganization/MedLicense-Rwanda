import { supabase } from "@/lib/supabase";
import { ExamsClient } from "@/components/admin/ExamsClient";

interface Props {
  searchParams: Promise<{ category?: string; published?: string }>;
}

export default async function AdminExamsPage({ searchParams }: Props) {
  const { category, published } = await searchParams;

  let query = supabase
    .from("exams")
    .select("*, category:categories(id, name_en), exam_questions(question_id)")
    .order("created_at", { ascending: false });

  if (category) query = query.eq("category_id", category);
  if (published !== undefined && published !== "")
    query = query.eq("is_published", published === "true");

  const [{ data: exams }, { data: categories }, { data: questions }] = await Promise.all([
    query,
    supabase.from("categories").select("id, name_en, license_category"),
    supabase
      .from("questions")
      .select("id, text_en, difficulty, category_id, license_categories, category:categories(name_en)")
      .eq("is_approved", true)
      .order("created_at", { ascending: false }),
  ]);

  const examList = (exams ?? []).map((e: {
    id: string;
    title_en: string;
    description?: string | null;
    category_id: string;
    license_category?: string | null;
    duration_minutes: number;
    passing_score: number;
    is_published: boolean;
    is_free: boolean;
    shuffle_questions: boolean;
    shuffle_answers: boolean;
    category: { id: string; name_en: string };
    exam_questions: { question_id: string }[];
  }) => ({
    id: e.id,
    title_en: e.title_en,
    description: e.description,
    category_id: e.category_id,
    license_category: e.license_category ?? null,
    duration_minutes: e.duration_minutes,
    passing_score: e.passing_score,
    is_published: e.is_published,
    is_free: e.is_free,
    shuffle_questions: e.shuffle_questions,
    shuffle_answers: e.shuffle_answers,
    category: { name_en: e.category.name_en },
    exam_question_ids: e.exam_questions.map((eq) => eq.question_id),
    question_count: e.exam_questions.length,
  }));

  const categoryList = (categories ?? []).map((c: { id: string; name_en: string; license_category?: string | null }) => ({
    id: c.id,
    name_en: c.name_en,
    license_category: c.license_category ?? null,
  }));

  const questionList = (questions ?? []).map((q: {
    id: string;
    text_en: string;
    difficulty: string;
    category_id: string;
    license_categories?: string[] | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    category: any;
  }) => ({
    id: q.id,
    text_en: q.text_en,
    difficulty: q.difficulty,
    category_id: q.category_id,
    license_categories: q.license_categories ?? [],
    category: { name_en: Array.isArray(q.category) ? q.category[0]?.name_en ?? "" : q.category?.name_en ?? "" },
  }));

  return (
    <div className="max-w-6xl space-y-6">
      <ExamsClient
        exams={examList}
        categories={categoryList}
        questions={questionList}
        currentCategory={category ?? ""}
        currentPublished={published ?? ""}
      />
    </div>
  );
}
