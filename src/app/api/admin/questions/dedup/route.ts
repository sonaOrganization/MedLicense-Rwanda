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

  return NextResponse.json({
    groups,
    toDelete: allDupIds.length,
    inExams,
    pairs,
  });
}

// POST — execute deduplication
export async function POST() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { pairs, error: buildErr } = await buildDupPairs();
  if (buildErr) return NextResponse.json({ error: buildErr }, { status: 500 });

  if (pairs.length === 0) {
    return NextResponse.json({ deleted: 0, remapped: 0, errors: [] });
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

  return NextResponse.json({
    deleted: questionsErr ? 0 : allDupIds.length,
    remapped,
    errors,
  });
}
