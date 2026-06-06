import { supabase } from "@/lib/supabase";
import { UnusedQuestionsClient } from "@/components/admin/UnusedQuestionsClient";

export default async function UnusedQuestionsPage() {
  // Step 1: get all question IDs that are used in at least one exam
  const { data: usedRows } = await supabase
    .from("exam_questions")
    .select("question_id")
    .limit(10000);

  const usedIds = new Set((usedRows ?? []).map((r: { question_id: string }) => r.question_id));

  // Step 2: fetch all approved questions with their details
  const { data: allQuestions } = await supabase
    .from("questions")
    .select("id, text_en, text_fr, language, difficulty, license_categories, is_approved, created_at, category:categories(id, name_en)")
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(5000);

  // Step 3: filter out used ones in JS
  const unused = (allQuestions ?? []).filter((q: { id: string }) => !usedIds.has(q.id));

  const questions = unused.map((q: {
    id: string;
    text_en: string;
    text_fr?: string | null;
    language?: string | null;
    difficulty: string;
    license_categories?: string[] | null;
    is_approved: boolean;
    created_at: string;
    category: { id: string; name_en: string } | { id: string; name_en: string }[] | null;
  }) => {
    const cat = Array.isArray(q.category) ? q.category[0] : q.category;
    return {
      id:                 q.id,
      text_en:            q.text_en,
      text_fr:            q.text_fr ?? null,
      language:           q.language ?? "EN",
      difficulty:         q.difficulty,
      license_categories: q.license_categories ?? [],
      is_approved:        q.is_approved,
      created_at:         q.created_at,
      category:           cat ? { id: cat.id, name_en: cat.name_en } : null,
    };
  });

  return (
    <div className="max-w-6xl">
      <UnusedQuestionsClient
        questions={questions}
        totalInBank={allQuestions?.length ?? 0}
        totalUsed={usedIds.size}
      />
    </div>
  );
}
