import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// PATCH /api/admin/questions/[id] — update question + replace answers
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;
  const { text_en, explanation_en, difficulty, category_id, answers } = await req.json();

  const { error: qErr } = await supabase
    .from("questions")
    .update({ text_en, explanation_en: explanation_en || null, difficulty, category_id, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });

  if (Array.isArray(answers)) {
    await supabase.from("answers").delete().eq("question_id", id);
    const rows = answers.map((a: { text_en: string; is_correct: boolean }, i: number) => ({
      question_id: id,
      text_en: a.text_en,
      is_correct: a.is_correct,
      order: i,
    }));
    const { error: aErr } = await supabase.from("answers").insert(rows);
    if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/questions/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;
  const { error } = await supabase.from("questions").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
