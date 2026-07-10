import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { examId } = await params;
  const { stem_en, stem_fr, image_url } = await req.json();

  if (!stem_en?.trim()) return NextResponse.json({ error: "Case stem is required" }, { status: 400 });

  const { count } = await supabase
    .from("practical_groups")
    .select("id", { count: "exact", head: true })
    .eq("practical_exam_id", examId);

  const { data: group, error } = await supabase
    .from("practical_groups")
    .insert({
      practical_exam_id: examId,
      stem_en: stem_en.trim(),
      stem_fr: stem_fr?.trim() || null,
      image_url: image_url?.trim() || null,
      order: count ?? 0,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("practical_exams").update({ total_groups: (count ?? 0) + 1 }).eq("id", examId);

  return NextResponse.json({ id: group.id }, { status: 201 });
}
