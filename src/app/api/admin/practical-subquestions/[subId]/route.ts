import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ subId: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { subId } = await params;
  const { prompt_en, prompt_fr, model_answer_en, model_answer_fr, order } = await req.json();

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (prompt_en !== undefined) update.prompt_en = prompt_en?.trim();
  if (prompt_fr !== undefined) update.prompt_fr = prompt_fr?.trim() || null;
  if (model_answer_en !== undefined) update.model_answer_en = model_answer_en?.trim();
  if (model_answer_fr !== undefined) update.model_answer_fr = model_answer_fr?.trim() || null;
  if (order !== undefined) update.order = order;

  const { error } = await supabase.from("practical_subquestions").update(update).eq("id", subId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ subId: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { subId } = await params;

  const { data: sub } = await supabase
    .from("practical_subquestions")
    .select("group_id, group:practical_groups(practical_exam_id)")
    .eq("id", subId)
    .single();

  if (!sub) return NextResponse.json({ error: "Question not found" }, { status: 404 });

  const groupRel = Array.isArray(sub.group) ? sub.group[0] : sub.group;
  const practicalExamId = groupRel?.practical_exam_id as string | undefined;

  const { error } = await supabase.from("practical_subquestions").delete().eq("id", subId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (practicalExamId) {
    const { data: siblingGroups } = await supabase
      .from("practical_groups")
      .select("id")
      .eq("practical_exam_id", practicalExamId);

    const groupIds = (siblingGroups ?? []).map((g) => g.id);
    const { count: totalSub } = groupIds.length > 0
      ? await supabase.from("practical_subquestions").select("id", { count: "exact", head: true }).in("group_id", groupIds)
      : { count: 0 };

    await supabase.from("practical_exams").update({ total_subquestions: totalSub ?? 0 }).eq("id", practicalExamId);
  }

  return NextResponse.json({ ok: true });
}
