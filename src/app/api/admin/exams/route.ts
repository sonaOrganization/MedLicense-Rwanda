import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const {
    title_en, description, category_id, license_category,
    duration_minutes, passing_score, is_free, is_published,
    shuffle_questions, shuffle_answers, question_ids,
  } = await req.json();

  if (!title_en?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  if (!category_id)       return NextResponse.json({ error: "Category is required" }, { status: 400 });

  const { data: exam, error: eErr } = await supabase
    .from("exams")
    .insert({
      title_en: title_en.trim(),
      title: title_en.trim(),
      description: description?.trim() || null,
      category_id,
      license_category: license_category || null,
      duration_minutes: Number(duration_minutes) || 60,
      passing_score: Number(passing_score) || 70,
      total_questions: Array.isArray(question_ids) ? question_ids.length : 0,
      is_free: Boolean(is_free),
      is_published: Boolean(is_published),
      shuffle_questions: shuffle_questions !== false,
      shuffle_answers: shuffle_answers !== false,
    })
    .select("id")
    .single();

  if (eErr) return NextResponse.json({ error: eErr.message }, { status: 500 });

  if (Array.isArray(question_ids) && question_ids.length > 0) {
    const rows = question_ids.map((qid: string, i: number) => ({
      exam_id: exam.id,
      question_id: qid,
      order: i,
    }));
    const { error: qErr } = await supabase.from("exam_questions").insert(rows);
    if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });
  }

  return NextResponse.json({ id: exam.id }, { status: 201 });
}
