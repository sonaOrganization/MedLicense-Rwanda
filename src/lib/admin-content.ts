import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { questionApiSchema, examApiSchema } from "@/lib/admin-validations";

export async function saveQuestion(req: NextRequest, id: string | null) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = questionApiSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { answers, ...question } = parsed.data;
  if (!id && answers.some((a) => a.id)) return NextResponse.json({ error: "New answers must not supply IDs" }, { status: 400 });
  const { data, error } = await supabase.rpc("save_question", { p_id: id, p_question: question, p_answers: answers });
  if (error) { console.error("[SAVE_QUESTION]", error); return NextResponse.json({ error: "Could not save question. No changes were applied." }, { status: 409 }); }
  return NextResponse.json({ id: data }, { status: id ? 200 : 201 });
}
export async function saveTheoryExam(req: NextRequest, id: string | null) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (id && body && Object.keys(body).length === 1 && typeof body.is_published === "boolean") {
    const { data: exam, error: readError } = await supabase.from("exams").select("id, questions:exam_questions(count)").eq("id", id).maybeSingle();
    if (readError) return NextResponse.json({ error: "Could not check exam" }, { status: 500 });
    if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    if (body.is_published && !exam.questions?.[0]?.count) return NextResponse.json({ error: "Add questions before publishing" }, { status: 400 });
    const { error } = await supabase.from("exams").update({ is_published: body.is_published }).eq("id", id);
    return NextResponse.json(error ? { error: "Could not update exam" } : { ok: true }, { status: error ? 500 : 200 });
  }
  const parsed = examApiSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { question_ids, ...exam } = parsed.data;
  const { data, error } = await supabase.rpc("save_theory_exam", { p_id: id, p_exam: exam, p_question_ids: question_ids });
  if (error) { console.error("[SAVE_EXAM]", error); return NextResponse.json({ error: "Could not save exam. No changes were applied." }, { status: 409 }); }
  return NextResponse.json({ id: data }, { status: id ? 200 : 201 });
}
