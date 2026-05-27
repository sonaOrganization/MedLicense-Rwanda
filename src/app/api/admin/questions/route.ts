import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json();
  const { text_en, text_fr, explanation_en, explanation_fr, difficulty, category_id, answers, license_categories } = body;

  if (!text_en || !category_id || !Array.isArray(answers) || answers.length < 2)
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  const correctCount = answers.filter((a: { is_correct: boolean }) => a.is_correct).length;
  if (correctCount !== 1)
    return NextResponse.json({ error: "Exactly one answer must be correct" }, { status: 400 });

  const { data: question, error: qErr } = await supabase
    .from("questions")
    .insert({
      text_en,
      text_fr: text_fr || null,
      explanation_en: explanation_en || null,
      explanation_fr: explanation_fr || null,
      difficulty: difficulty || "MEDIUM",
      category_id,
      license_categories: Array.isArray(license_categories) ? license_categories : [],
      type: "MULTIPLE_CHOICE",
      is_approved: true,
      is_active: true,
    })
    .select()
    .single();

  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });

  const answerRows = answers.map((a: { text_en: string; text_fr?: string | null; is_correct: boolean }, i: number) => ({
    question_id: question.id,
    text_en: a.text_en,
    text_fr: a.text_fr || null,
    is_correct: a.is_correct,
    order: i,
  }));

  const { error: aErr } = await supabase.from("answers").insert(answerRows);
  if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 });

  return NextResponse.json({ id: question.id });
}
