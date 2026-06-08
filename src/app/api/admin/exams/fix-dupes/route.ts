import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

interface ExamQuestionRow {
  exam_id: string;
  question_id: string;
}

interface DuplicateEntry {
  exam_id: string;
  question_id: string;
  count: number;
}

async function findExamDupes(): Promise<{
  duplicates: DuplicateEntry[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("exam_questions")
    .select("exam_id, question_id")
    .limit(50000);

  if (error) return { duplicates: [], error: error.message };

  const counts = new Map<string, number>();
  for (const row of (data ?? []) as ExamQuestionRow[]) {
    const key = `${row.exam_id}::${row.question_id}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const duplicates: DuplicateEntry[] = [];
  for (const [key, count] of counts.entries()) {
    if (count > 1) {
      const separatorIdx = key.indexOf("::");
      const exam_id = key.slice(0, separatorIdx);
      const question_id = key.slice(separatorIdx + 2);
      duplicates.push({ exam_id, question_id, count });
    }
  }

  return { duplicates, error: null };
}

// GET — dry-run: list all exams with duplicate question slots
export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { duplicates, error } = await findExamDupes();
  if (error) return NextResponse.json({ error }, { status: 500 });

  if (duplicates.length === 0) {
    return NextResponse.json({ affected: 0, duplicateSlots: 0, exams: [] });
  }

  const uniqueExamIds = [...new Set(duplicates.map((d) => d.exam_id))];
  const uniqueQuestionIds = [...new Set(duplicates.map((d) => d.question_id))];
  const duplicateSlots = duplicates.reduce((sum, d) => sum + (d.count - 1), 0);

  const [{ data: examRows }, { data: questionRows }] = await Promise.all([
    supabase.from("exams").select("id, title, title_en").in("id", uniqueExamIds),
    supabase
      .from("questions")
      .select("id, text_en, category_id, category:categories(name_en)")
      .in("id", uniqueQuestionIds),
  ]);

  const examTitles = new Map(
    (examRows ?? []).map(
      (e: { id: string; title?: string | null; title_en?: string | null }) => [
        e.id,
        e.title_en ?? e.title ?? "Untitled Exam",
      ]
    )
  );

  type QuestionData = {
    id: string;
    text_en: string;
    category_id: string | null;
    category: { name_en: string }[] | { name_en: string } | null;
  };

  const questionData = new Map(
    (questionRows ?? []).map((q: QuestionData) => [q.id, q])
  );

  const examMap = new Map<
    string,
    {
      exam_id: string;
      exam_title: string;
      duplicates: Array<{
        question_id: string;
        text_preview: string;
        category_id: string | null;
        category_name: string | null;
        extra_count: number;
      }>;
    }
  >();

  for (const dup of duplicates) {
    if (!examMap.has(dup.exam_id)) {
      examMap.set(dup.exam_id, {
        exam_id: dup.exam_id,
        exam_title: examTitles.get(dup.exam_id) ?? "Unknown Exam",
        duplicates: [],
      });
    }

    const q = questionData.get(dup.question_id) as QuestionData | undefined;
    const textPreview = q
      ? q.text_en.slice(0, 100) + (q.text_en.length > 100 ? "…" : "")
      : "(unknown question)";
    const categoryName = q?.category
      ? Array.isArray(q.category)
        ? (q.category[0]?.name_en ?? null)
        : ((q.category as { name_en: string }).name_en ?? null)
      : null;

    examMap.get(dup.exam_id)!.duplicates.push({
      question_id: dup.question_id,
      text_preview: textPreview,
      category_id: q?.category_id ?? null,
      category_name: categoryName,
      extra_count: dup.count - 1,
    });
  }

  return NextResponse.json({
    affected: uniqueExamIds.length,
    duplicateSlots,
    exams: [...examMap.values()],
  });
}

// POST — auto-fix all duplicate slots
export async function POST() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { duplicates, error } = await findExamDupes();
  if (error) return NextResponse.json({ error }, { status: 500 });

  if (duplicates.length === 0) {
    return NextResponse.json({ fixed: 0, removed: 0, errors: [] });
  }

  let fixed = 0;
  let removed = 0;
  const errors: string[] = [];

  for (const { exam_id, question_id } of duplicates) {
    try {
      // 1. Fetch all current question_ids in this exam
      const { data: allRows, error: allRowsErr } = await supabase
        .from("exam_questions")
        .select("question_id")
        .eq("exam_id", exam_id);

      if (allRowsErr) {
        errors.push(`Fetch exam questions for exam ${exam_id}: ${allRowsErr.message}`);
        continue;
      }

      const currentIds = (allRows ?? []).map(
        (r: { question_id: string }) => r.question_id
      );

      // 2. Re-check exact duplicate count (a prior iteration may have already fixed this pair)
      const { data: dupRows, error: dupRowsErr } = await supabase
        .from("exam_questions")
        .select("question_id")
        .eq("exam_id", exam_id)
        .eq("question_id", question_id);

      if (dupRowsErr) {
        errors.push(`Fetch dup rows for (${exam_id}, ${question_id}): ${dupRowsErr.message}`);
        continue;
      }

      const extraCount = (dupRows ?? []).length - 1;
      if (extraCount <= 0) continue;

      // 3. Get the question's category_id
      const { data: qData, error: qErr } = await supabase
        .from("questions")
        .select("category_id")
        .eq("id", question_id)
        .single();

      if (qErr) {
        errors.push(`Fetch category for question ${question_id}: ${qErr.message}`);
        continue;
      }

      const catId = (qData as { category_id: string | null } | null)?.category_id ?? null;

      // 4. Delete ALL rows for this (exam_id, question_id)
      const { error: deleteErr } = await supabase
        .from("exam_questions")
        .delete()
        .eq("exam_id", exam_id)
        .eq("question_id", question_id);

      if (deleteErr) {
        errors.push(`Delete rows for (${exam_id}, ${question_id}): ${deleteErr.message}`);
        continue;
      }

      // 5. Re-insert exactly ONE row with the original question_id
      const { error: reinsertErr } = await supabase
        .from("exam_questions")
        .insert({ exam_id, question_id });

      if (reinsertErr) {
        errors.push(`Re-insert original question ${question_id} into exam ${exam_id}: ${reinsertErr.message}`);
        continue;
      }

      // 6. For each extra slot, find a replacement from the same category
      const usedIds = new Set(currentIds);
      usedIds.add(question_id);

      for (let i = 0; i < extraCount; i++) {
        let replaced = false;

        if (catId) {
          const usedIdsArray = [...usedIds];
          const filterStr = `(${usedIdsArray.join(",")})`;

          const { data: candidates, error: candErr } = await supabase
            .from("questions")
            .select("id")
            .eq("category_id", catId)
            .eq("is_approved", true)
            .not("id", "in", filterStr)
            .limit(1);

          if (!candErr && candidates && candidates.length > 0) {
            const replacementId = (candidates[0] as { id: string }).id;
            const { error: insertErr } = await supabase
              .from("exam_questions")
              .insert({ exam_id, question_id: replacementId });

            if (!insertErr) {
              usedIds.add(replacementId);
              fixed++;
              replaced = true;
            } else {
              errors.push(`Insert replacement ${replacementId} into exam ${exam_id}: ${insertErr.message}`);
            }
          }
        }

        if (!replaced) {
          removed++;
        }
      }
    } catch (e: unknown) {
      errors.push(
        `Unexpected error for (${exam_id}, ${question_id}): ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  return NextResponse.json({ fixed, removed, errors });
}
