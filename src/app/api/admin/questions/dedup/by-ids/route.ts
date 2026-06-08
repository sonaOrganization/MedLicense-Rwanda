import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

interface Pair {
  dup_id: string;
  keeper_id?: string;
}

interface PreviewResult {
  found: number;
  notFound: string[];
  inExams: number;
  pairs: Pair[];
}

interface ExecuteResult {
  deleted: number;
  remapped: number;
  errors: string[];
}

// POST ?action=preview|execute
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { action, pairs } = (await req.json()) as {
    action: "preview" | "execute";
    pairs: Pair[];
  };

  if (!Array.isArray(pairs) || pairs.length === 0)
    return NextResponse.json({ error: "No IDs provided" }, { status: 400 });

  const dupIds = pairs.map((p) => p.dup_id);

  // Verify which IDs actually exist
  const { data: existingRows } = await supabase
    .from("questions")
    .select("id")
    .in("id", dupIds);

  const existingSet = new Set((existingRows ?? []).map((r: { id: string }) => r.id));
  const notFound = dupIds.filter((id) => !existingSet.has(id));
  const validPairs = pairs.filter((p) => existingSet.has(p.dup_id));

  if (action === "preview") {
    let inExams = 0;
    if (validPairs.length > 0) {
      const { data: examRefs } = await supabase
        .from("exam_questions")
        .select("question_id")
        .in("question_id", validPairs.map((p) => p.dup_id));
      const refSet = new Set((examRefs ?? []).map((r: { question_id: string }) => r.question_id));
      inExams = refSet.size;
    }

    return NextResponse.json({
      found: validPairs.length,
      notFound,
      inExams,
      pairs: validPairs,
    } satisfies PreviewResult);
  }

  // ── Execute ──
  const errors: string[] = [];
  let remapped = 0;

  for (const { dup_id, keeper_id } of validPairs) {
    if (!keeper_id) {
      // No keeper: just delete exam_questions rows
      const { error: delEqErr } = await supabase
        .from("exam_questions")
        .delete()
        .eq("question_id", dup_id);
      if (delEqErr) errors.push(`Delete exam_questions for ${dup_id}: ${delEqErr.message}`);
      continue;
    }

    // Remap exam refs from dup → keeper (skip exams that already have the keeper)
    const { data: dupExamRows, error: fetchErr } = await supabase
      .from("exam_questions")
      .select("exam_id")
      .eq("question_id", dup_id);

    if (fetchErr) {
      errors.push(`Fetch exam refs for ${dup_id}: ${fetchErr.message}`);
      continue;
    }

    const dupExamIds = (dupExamRows ?? []).map((r: { exam_id: string }) => r.exam_id);

    if (dupExamIds.length > 0) {
      const { data: keeperExamRows } = await supabase
        .from("exam_questions")
        .select("exam_id")
        .eq("question_id", keeper_id)
        .in("exam_id", dupExamIds);

      const keeperExamSet = new Set(
        (keeperExamRows ?? []).map((r: { exam_id: string }) => r.exam_id)
      );
      const remapIds = dupExamIds.filter((eid) => !keeperExamSet.has(eid));

      if (remapIds.length > 0) {
        const { error: remapErr } = await supabase
          .from("exam_questions")
          .update({ question_id: keeper_id })
          .eq("question_id", dup_id)
          .in("exam_id", remapIds);

        if (remapErr) errors.push(`Remap ${dup_id}: ${remapErr.message}`);
        else remapped += remapIds.length;
      }
    }

    // Delete any remaining exam_questions for dup (conflict rows where keeper already in same exam)
    const { error: delEqErr } = await supabase
      .from("exam_questions")
      .delete()
      .eq("question_id", dup_id);

    if (delEqErr) errors.push(`Delete remaining exam_questions for ${dup_id}: ${delEqErr.message}`);
  }

  const allDupIds = validPairs.map((p) => p.dup_id);

  const { error: attemptErr } = await supabase
    .from("attempt_answers")
    .delete()
    .in("question_id", allDupIds);
  if (attemptErr) errors.push(`Delete attempt_answers: ${attemptErr.message}`);

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
  } satisfies ExecuteResult);
}
