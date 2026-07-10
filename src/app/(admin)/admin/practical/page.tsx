import { supabase } from "@/lib/supabase";
import { PracticalExamsListClient } from "@/components/admin/practical/PracticalExamsListClient";

interface Props {
  searchParams: Promise<{ category?: string; published?: string }>;
}

export default async function AdminPracticalExamsPage({ searchParams }: Props) {
  const { category, published } = await searchParams;

  let query = supabase
    .from("practical_exams")
    .select("*, category:categories(id, name_en)")
    .order("created_at", { ascending: false });

  if (category) query = query.eq("category_id", category);
  if (published !== undefined && published !== "")
    query = query.eq("is_published", published === "true");

  const [{ data: exams }, { data: categories }] = await Promise.all([
    query,
    supabase.from("categories").select("id, name_en"),
  ]);

  const examList = (exams ?? []).map((e: {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    category: any;
  }) => ({
    id: e.id,
    title_en: e.title_en,
    description: e.description,
    category_id: e.category_id ?? null,
    license_category: e.license_category ?? null,
    target_language: e.target_language ?? null,
    is_free: e.is_free,
    is_published: e.is_published,
    total_groups: e.total_groups,
    total_subquestions: e.total_subquestions,
    category: Array.isArray(e.category) ? (e.category[0] ?? null) : (e.category ?? null),
  }));

  return (
    <div className="max-w-6xl space-y-6">
      <PracticalExamsListClient
        exams={examList}
        categories={categories ?? []}
        currentCategory={category ?? ""}
        currentPublished={published ?? ""}
      />
    </div>
  );
}
