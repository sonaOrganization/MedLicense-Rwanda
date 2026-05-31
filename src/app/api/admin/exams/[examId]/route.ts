import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { examId } = await params;
  const body = await req.json();

  // Toggle-only call (from ExamToggle component)
  if (Object.keys(body).length === 1 && "is_published" in body) {
    const { error } = await supabase
      .from("exams")
      .update({ is_published: body.is_published, updated_at: new Date().toISOString() })
      .eq("id", examId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Full exam update
  const {
    title_en, description, category_id, license_category, target_language,
    duration_minutes, passing_score, points_per_question, is_free, is_published,
    shuffle_questions, shuffle_answers, question_ids,
  } = body;

  const { error: eErr } = await supabase
    .from("exams")
    .update({
      title_en: title_en?.trim(),
      title: title_en?.trim(),
      description: description?.trim() || null,
      category_id,
      license_category: license_category || null,
      target_language: target_language || null,
      duration_minutes:    Number(duration_minutes),
      passing_score:       Number(passing_score),
      points_per_question: Number(points_per_question) || 1,
      total_questions: Array.isArray(question_ids) ? question_ids.length : 0,
      is_free: Boolean(is_free),
      is_published: Boolean(is_published),
      shuffle_questions: Boolean(shuffle_questions),
      shuffle_answers: Boolean(shuffle_answers),
      updated_at: new Date().toISOString(),
    })
    .eq("id", examId);

  if (eErr) return NextResponse.json({ error: eErr.message }, { status: 500 });

  if (Array.isArray(question_ids)) {
    await supabase.from("exam_questions").delete().eq("exam_id", examId);
    if (question_ids.length > 0) {
      const rows = question_ids.map((qid: string, i: number) => ({
        exam_id: examId,
        question_id: qid,
        order: i,
      }));
      const { error: qErr } = await supabase.from("exam_questions").insert(rows);
      if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { examId } = await params;
  const { error } = await supabase.from("exams").delete().eq("id", examId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
