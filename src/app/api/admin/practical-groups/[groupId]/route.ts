import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { groupId } = await params;
  const { stem_en, stem_fr, image_url, order } = await req.json();

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (stem_en !== undefined) update.stem_en = stem_en?.trim();
  if (stem_fr !== undefined) update.stem_fr = stem_fr?.trim() || null;
  if (image_url !== undefined) update.image_url = image_url?.trim() || null;
  if (order !== undefined) update.order = order;

  const { error } = await supabase.from("practical_groups").update(update).eq("id", groupId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { groupId } = await params;

  const { data: group } = await supabase
    .from("practical_groups")
    .select("practical_exam_id")
    .eq("id", groupId)
    .single();

  if (!group) return NextResponse.json({ error: "Case not found" }, { status: 404 });

  const { error } = await supabase.from("practical_groups").delete().eq("id", groupId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: remainingGroups } = await supabase
    .from("practical_groups")
    .select("id")
    .eq("practical_exam_id", group.practical_exam_id);

  const groupIds = (remainingGroups ?? []).map((g) => g.id);
  const { count: subCount } = groupIds.length > 0
    ? await supabase.from("practical_subquestions").select("id", { count: "exact", head: true }).in("group_id", groupIds)
    : { count: 0 };

  await supabase.from("practical_exams").update({
    total_groups: groupIds.length,
    total_subquestions: subCount ?? 0,
  }).eq("id", group.practical_exam_id);

  return NextResponse.json({ ok: true });
}
