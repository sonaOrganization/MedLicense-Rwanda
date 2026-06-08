import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

interface QuestionRow {
  id: string;
  text_en: string;
  created_at: string;
}

export interface DupPair {
  keeper_id: string;
  dup_id: string;
  text_preview: string;
}

export interface ConflictInfo {
  exam_id: string;
  exam_title: string;
  dup_id: string;
  keeper_id: string;
  text_preview: string;
  category_id: string | null;
  category_name: string | null;
}

/**
 * Fetch all questions and compute (keeper_id, dup_id) pairs in JS.
 * The keeper is the row with the earliest created_at in each text group.
 * Groups are formed by LOWER(TRIM(text_en)), minimum length 21 chars.
 */
export async function buildDupPairs(): Promise<{ pairs: DupPair[]; error: string | null }> {
  const { data, error } = await supabase
    .from("questions")
    .select("id, text_en, created_at")
    .not("text_en", "is", null)
    .limit(10000);

  if (error) return { pairs: [], error: error.message };

  const groups = new Map<string, QuestionRow[]>();
  for (const row of (data ?? []) as QuestionRow[]) {
    const key = row.text_en.trim().toLowerCase();
    if (key.length <= 20) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  const pairs: DupPair[] = [];
  for (const rows of groups.values()) {
    if (rows.length < 2) continue;
    rows.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const keeper = rows[0];
    const preview = keeper.text_en.slice(0, 80) + (keeper.text_en.length > 80 ? "…" : "");
    for (let i = 1; i < rows.length; i++) {
      pairs.push({ keeper_id: keeper.id, dup_id: rows[i].id, text_preview: preview });
    }
  }

  return { pairs, error: null };
}

async function findConflicts(pairs: DupPair[]): Promise<ConflictInfo[]> {
  if (pairs.length === 0) return [];
  const allDupIds = pairs.map(p => p.dup_id);
  const allKeeperIds = [...new Set(pairs.map(p => p.keeper_id))];

  const [{ data: dupRefs }, { data: keeperRefs }] = await Promise.all([
    supabase.from("exam_questions").select("exam_id, question_id").in("question_id", allDupIds),
    supabase.from("exam_questions").select("exam_id, question_id").in("question_id", allKeeperIds),
  ]);

  const keeperExams = new Map<string, Set<string>>();
  for (const ref of (keeperRefs ?? []) as { exam_id: string; question_id: string }[]) {
    if (!keeperExams.has(ref.question_id)) keeperExams.set(ref.question_id, new Set());
    keeperExams.get(ref.question_id)!.add(ref.exam_id);
  }

  const dupToKeeper = new Map(pairs.map(p => [p.dup_id, p.keeper_id]));
  const dupToPreview = new Map(pairs.map(p => [p.dup_id, p.text_preview]));
  const seen = new Set<string>();
  const raw: { exam_id: string; dup_id: string }[] = [];

  for (const ref of (dupRefs ?? []) as { exam_id: string; question_id: string }[]) {
    const keeperId = dupToKeeper.get(ref.question_id);
    if (!keeperId) continue;
    if (keeperExams.get(keeperId)?.has(ref.exam_id)) {
      const key = `${ref.exam_id}:${ref.question_id}`;
      if (!seen.has(key)) { seen.add(key); raw.push({ exam_id: ref.exam_id, dup_id: ref.question_id }); }
    }
  }

  if (raw.length === 0) return [];

  const uniqueExamIds = [...new Set(raw.map(c => c.exam_id))];
  const uniqueDupIds  = [...new Set(raw.map(c => c.dup_id))];

  const [{ data: exams }, { data: questions }] = await Promise.all([
    supabase.from("exams").select("id, title").in("id", uniqueExamIds),
    supabase.from("questions").select("id, category_id, category:categories(name_en)").in("id", uniqueDupIds),
  ]);

  const examTitles = new Map((exams ?? []).map((e: { id: string; title: string }) => [e.id, e.title ?? "Untitled Exam"]));
  const qData = new Map((questions ?? []).map((q: { id: string; category_id: string; category: unknown }) => [q.id, q]));

  return raw.map(c => {
    const q = qData.get(c.dup_id) as { id: string; category_id: string; category: { name_en: string }[] | { name_en: string } | null } | undefined;
    const catName = Array.isArray(q?.category)
      ? (q?.category[0]?.name_en ?? null)
      : ((q?.category as { name_en: string } | null)?.name_en ?? null);
    return {
      exam_id: c.exam_id,
      exam_title: examTitles.get(c.exam_id) ?? "Unknown Exam",
      dup_id: c.dup_id,
      keeper_id: dupToKeeper.get(c.dup_id)!,
      text_preview: dupToPreview.get(c.dup_id) ?? "",
      category_id: q?.category_id ?? null,
      category_name: catName,
    };
  });
}

// GET — dry-run preview
export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { pairs, error } = await buildDupPairs();
  if (error) return NextResponse.json({ error }, { status: 500 });

  const allDupIds = pairs.map((p) => p.dup_id);

  let inExams = 0;
  if (allDupIds.length > 0) {
    const { data: examRefs } = await supabase
      .from("exam_questions")
      .select("question_id")
      .in("question_id", allDupIds);
    const inExamSet = new Set((examRefs ?? []).map((r: { question_id: string }) => r.question_id));
    inExams = inExamSet.size;
  }

  const groups = new Set(pairs.map((p) => p.keeper_id)).size;
  const conflicts = await findConflicts(pairs);

  return NextResponse.json({
    groups,
    toDelete: allDupIds.length,
    inExams,
    pairs,
    conflicts,
  });
}

// POST — execute deduplication
export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  let replacements: Array<{ exam_id: string; question_id: string }> = [];
  try {
    const body = await request.json();
    if (Array.isArray(body?.replacements)) replacements = body.replacements;
  } catch {
    // No body or invalid JSON — proceed without replacements
  }

  const { pairs, error: buildErr } = await buildDupPairs();
  if (buildErr) return NextResponse.json({ error: buildErr }, { status: 500 });

  if (pairs.length === 0) {
    return NextResponse.json({ deleted: 0, remapped: 0, replacementsAdded: 0, errors: [] });
  }

  const errors: string[] = [];
  let remapped = 0;

  for (const { keeper_id, dup_id } of pairs) {
    const { data: dupExamRows, error: fetchErr } = await supabase
      .from("exam_questions")
      .select("exam_id")
      .eq("question_id", dup_id);

    if (fetchErr) {
      errors.push(`Fetch exam_questions for dup ${dup_id}: ${fetchErr.message}`);
      continue;
    }

    const dupExamIds = (dupExamRows ?? []).map((r: { exam_id: string }) => r.exam_id);

    if (dupExamIds.length > 0) {
      const { data: keeperExamRows, error: keeperFetchErr } = await supabase
        .from("exam_questions")
        .select("exam_id")
        .eq("question_id", keeper_id)
        .in("exam_id", dupExamIds);

      if (keeperFetchErr) {
        errors.push(`Fetch keeper exam_questions for ${keeper_id}: ${keeperFetchErr.message}`);
        continue;
      }

      const keeperExamIds = new Set(
        (keeperExamRows ?? []).map((r: { exam_id: string }) => r.exam_id)
      );

      const remapExamIds = dupExamIds.filter((eid) => !keeperExamIds.has(eid));
      if (remapExamIds.length > 0) {
        const { error: remapErr } = await supabase
          .from("exam_questions")
          .update({ question_id: keeper_id })
          .eq("question_id", dup_id)
          .in("exam_id", remapExamIds);

        if (remapErr) {
          errors.push(`Remap exam_questions for dup ${dup_id}: ${remapErr.message}`);
        } else {
          remapped += remapExamIds.length;
        }
      }
    }

    const { error: deleteEqErr } = await supabase
      .from("exam_questions")
      .delete()
      .eq("question_id", dup_id);

    if (deleteEqErr) {
      errors.push(`Delete remaining exam_questions for dup ${dup_id}: ${deleteEqErr.message}`);
    }
  }

  const allDupIds = pairs.map((p) => p.dup_id);

  // Delete attempt_answers that reference duplicate questions or their answers
  // (attempt_answers has FK on both question_id and answer_id — must go first)
  const { error: attemptAnswersErr } = await supabase
    .from("attempt_answers")
    .delete()
    .in("question_id", allDupIds);

  if (attemptAnswersErr) errors.push(`Delete attempt_answers: ${attemptAnswersErr.message}`);

  const { error: answersErr } = await supabase
    .from("answers")
    .delete()
    .in("question_id", allDupIds);

  if (answersErr) errors.push(`Delete answers: ${answersErr.message}`);

  const { error: questionsErr } = await supabase
    .from("questions")
    .delete()
    .in("id", allDupIds);

  if (questionsErr) errors.push(`Delete questions: ${questionsErr.message}`);

  // Insert chosen replacements into affected exams
  let replacementsAdded = 0;
  for (const { exam_id, question_id } of replacements) {
    let insertPayload: Record<string, unknown> = { exam_id, question_id };
    try {
      const { data: orderRows } = await supabase
        .from("exam_questions")
        .select("order")
        .eq("exam_id", exam_id);
      if (orderRows && orderRows.length > 0) {
        const maxOrder = Math.max(...orderRows.map((r: { order: number }) => r.order ?? 0));
        insertPayload = { exam_id, question_id, order: maxOrder + 1 };
      }
    } catch {
      // Insert without order if fetching fails
    }

    const { error: insertErr } = await supabase
      .from("exam_questions")
      .insert(insertPayload);

    if (insertErr) {
      errors.push(`Insert replacement ${question_id} into exam ${exam_id}: ${insertErr.message}`);
    } else {
      replacementsAdded++;
    }
  }

  return NextResponse.json({
    deleted: questionsErr ? 0 : allDupIds.length,
    remapped,
    replacementsAdded,
    errors,
  });
}
