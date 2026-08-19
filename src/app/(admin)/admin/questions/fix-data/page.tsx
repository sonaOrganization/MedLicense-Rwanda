import { supabase } from "@/lib/supabase";
import { QuestionFixClient } from "@/components/admin/QuestionFixClient";

export default async function QuestionFixPage() {
  // Fetch questions whose text_en looks like corrupt data:
  // - starts with "[" (bracket + number pattern like "[ 256")
  // - very short (≤ 25 chars) — likely incomplete
  // - text_fr is missing while language = FR
  const { data: allSuspect } = await supabase
    .from("questions")
    .select("id, text_en, text_fr, language, difficulty, license_categories, category:categories(id, name_en), answers(*)")
    .or("text_en.like.[%,text_en.like.[ %")
    .order("created_at", { ascending: false })
    .limit(500);

  // Also fetch short questions separately and merge
  const { data: shortQuestions } = await supabase
    .from("questions")
    .select("id, text_en, text_fr, language, difficulty, license_categories, category:categories(id, name_en), answers(*)")
    .order("created_at", { ascending: false })
    .limit(2000);

  // Detect corrupt patterns in JS
  const corrupt = new Map<string, object>();

  function isSuspect(q: { id: string; text_en: string; text_fr?: string | null; language?: string | null }) {
    const textEn = q.text_en ?? "";
    const textFr = q.text_fr ?? "";
    const reasons: string[] = [];

    // Pattern 1: starts with "[" followed by a number (e.g. "[ 256", "[266")
    if (/^\[\s*\d/.test(textEn.trim())) reasons.push("Text is a bracket-number reference");

    // Pattern 2: text is only digits, brackets, spaces
    if (/^[\[\]\d\s]+$/.test(textEn.trim()) && textEn.trim().length < 30)
      reasons.push("Text is only digits/brackets");

    // Pattern 3: text is suspiciously short (< 15 chars)
    if (textEn.trim().length < 15 && textEn.trim().length > 0)
      reasons.push(`Text too short (${textEn.trim().length} chars)`);

    // Pattern 4: French question missing text_fr
    if (q.language === "FR" && !textFr.trim())
      reasons.push("FR question missing text_fr");

    // Pattern 5: text_fr equals text_en on an EN question (copy-paste error)
    // For FR questions this is expected — the import stores FR text in both columns
    if (q.language !== "FR" && textFr && textFr.trim() === textEn.trim())
      reasons.push("text_fr identical to text_en");

    return reasons;
  }

  // Add bracket-pattern questions
  (allSuspect ?? []).forEach((q) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reasons = isSuspect(q as any);
    if (reasons.length > 0) corrupt.set(q.id, { ...q, reasons });
  });

  // Add anything from the full scan
  (shortQuestions ?? []).forEach((q) => {
    if (!corrupt.has(q.id)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const reasons = isSuspect(q as any);
      if (reasons.length > 0) corrupt.set(q.id, { ...q, reasons });
    }
  });

  // Fetch exam associations for corrupt question IDs
  const questionIds = Array.from(corrupt.keys());
  const examMap: Record<string, { examId: string; title: string }[]> = {};

  if (questionIds.length > 0) {
    const { data: eq } = await supabase
      .from("exam_questions")
      .select("question_id, exam:exams(id, title_en)")
      .in("question_id", questionIds)
      .limit(1000);

    (eq ?? []).forEach((row: {
      question_id: string;
      exam: { id: string; title_en: string } | { id: string; title_en: string }[] | null;
    }) => {
      const exam = Array.isArray(row.exam) ? row.exam[0] : row.exam;
      if (!exam) return;
      if (!examMap[row.question_id]) examMap[row.question_id] = [];
      examMap[row.question_id].push({ examId: exam.id, title: exam.title_en });
    });
  }

  // Build final list
  const questions = Array.from(corrupt.values()).map((q) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = q as any;
    const cat = Array.isArray(row.category) ? row.category[0] : row.category;
    const answers = (row.answers ?? []).sort(
      (a: { order: number }, b: { order: number }) => a.order - b.order
    );
    return {
      id:                 row.id as string,
      text_en:            row.text_en as string,
      text_fr:            (row.text_fr ?? null) as string | null,
      language:           (row.language ?? "EN") as string,
      difficulty:         (row.difficulty ?? "MEDIUM") as string,
      license_categories: (row.license_categories ?? []) as string[],
      category:           cat ? { id: cat.id as string, name_en: cat.name_en as string } : null,
      answers:            answers.map((a: { id: string; text_en: string; text_fr?: string | null; is_correct: boolean; order: number }) => ({
        id:        a.id,
        text_en:   a.text_en,
        text_fr:   a.text_fr ?? null,
        is_correct: a.is_correct,
        order:     a.order,
      })),
      reasons:  row.reasons as string[],
      exams:    (examMap[row.id] ?? []),
    };
  });

  return (
    <div className="max-w-6xl">
      <QuestionFixClient questions={questions} total={corrupt.size} />
    </div>
  );
}
