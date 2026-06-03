import { supabase } from "@/lib/supabase";
import { QuestionsClient } from "@/components/admin/QuestionsClient";

interface Props { searchParams: Promise<{ category?: string; approved?: string; incomplete?: string }> }

export default async function AdminQuestionsPage({ searchParams }: Props) {
  const { category, approved, incomplete } = await searchParams;

  let query = supabase
    .from("questions")
    .select("*, category:categories(*), answers(*)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (category)  query = query.eq("category_id", category);
  if (approved !== undefined && approved !== "") query = query.eq("is_approved", approved === "true");

  // "Incomplete" = missing language tag OR empty license_categories OR FR question with no text_fr
  if (incomplete === "true") {
    query = query.or(
      "language.is.null,license_categories.eq.{},and(language.eq.FR,text_fr.is.null)"
    );
  }

  const [{ data: questions }, { data: categories }, { count: totalCount }, { count: enCount }, { count: frCount }] = await Promise.all([
    query,
    supabase.from("categories").select("*"),
    supabase.from("questions").select("*", { count: "exact", head: true }).eq("is_approved", true),
    supabase.from("questions").select("*", { count: "exact", head: true }).eq("is_approved", true).eq("language", "EN"),
    supabase.from("questions").select("*", { count: "exact", head: true }).eq("is_approved", true).eq("language", "FR"),
  ]);

  const questionList = questions ?? [];
  const categoryList = categories ?? [];

  return (
    <div className="max-w-6xl space-y-6">
      <QuestionsClient
        totalCount={totalCount ?? 0}
        enCount={enCount ?? 0}
        frCount={frCount ?? 0}
        questions={questionList.map((q: {
          id: string;
          text_en: string;
          text_fr?: string | null;
          explanation_en?: string | null;
          explanation_fr?: string | null;
          difficulty: string;
          is_approved: boolean;
          category_id: string;
          license_categories?: string[] | null;
          language?: string | null;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          category: any;
          answers: { id: string; text_en: string; text_fr?: string | null; is_correct: boolean; order: number }[];
        }) => ({
          id: q.id,
          text_en: q.text_en,
          text_fr: q.text_fr ?? null,
          explanation_en: q.explanation_en,
          explanation_fr: q.explanation_fr ?? null,
          difficulty: q.difficulty,
          is_approved: q.is_approved,
          category_id: q.category_id,
          license_categories: q.license_categories ?? [],
          language: q.language ?? null,
          category: {
            id: Array.isArray(q.category) ? q.category[0]?.id ?? "" : q.category?.id ?? "",
            name_en: Array.isArray(q.category) ? q.category[0]?.name_en ?? "" : q.category?.name_en ?? "",
          },
          answers: q.answers
            .sort((a: { order: number }, b: { order: number }) => a.order - b.order)
            .map((a: { id: string; text_en: string; text_fr?: string | null; is_correct: boolean }) => ({
              id: a.id, text_en: a.text_en, text_fr: a.text_fr ?? null, is_correct: a.is_correct,
            })),
        }))}
        categories={categoryList.map((c: { id: string; name_en: string; license_category?: string | null }) => ({ id: c.id, name_en: c.name_en, license_category: c.license_category ?? null }))}
        currentCategory={category ?? ""}
        currentApproved={approved ?? ""}
        currentIncomplete={incomplete ?? ""}
      />
    </div>
  );
}
