import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { groupId } = await params;
  const { prompt_en, prompt_fr, model_answer_en, model_answer_fr } = await req.json();

  if (!prompt_en?.trim()) return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  if (!model_answer_en?.trim()) return NextResponse.json({ error: "Model answer is required" }, { status: 400 });

  const { data: group } = await supabase
    .from("practical_groups")
    .select("practical_exam_id")
    .eq("id", groupId)
    .single();

  if (!group) return NextResponse.json({ error: "Case not found" }, { status: 404 });

  const { count } = await supabase
    .from("practical_subquestions")
    .select("id", { count: "exact", head: true })
    .eq("group_id", groupId);

  const { data: subquestion, error } = await supabase
    .from("practical_subquestions")
    .insert({
      group_id: groupId,
      prompt_en: prompt_en.trim(),
      prompt_fr: prompt_fr?.trim() || null,
      model_answer_en: model_answer_en.trim(),
      model_answer_fr: model_answer_fr?.trim() || null,
      order: count ?? 0,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: siblingGroups } = await supabase
    .from("practical_groups")
    .select("id")
    .eq("practical_exam_id", group.practical_exam_id);

  const groupIds = (siblingGroups ?? []).map((g) => g.id);
  const { count: totalSub } = await supabase
    .from("practical_subquestions")
    .select("id", { count: "exact", head: true })
    .in("group_id", groupIds);

  await supabase.from("practical_exams").update({ total_subquestions: totalSub ?? 0 }).eq("id", group.practical_exam_id);

  return NextResponse.json({ id: subquestion.id }, { status: 201 });
}
