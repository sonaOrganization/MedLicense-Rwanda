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

  // Toggle-only call (from PracticalExamToggle component)
  if (Object.keys(body).length === 1 && "is_published" in body) {
    const { error } = await supabase
      .from("practical_exams")
      .update({ is_published: body.is_published, updated_at: new Date().toISOString() })
      .eq("id", examId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Full metadata update
  const {
    title_en, description, category_id, license_category, target_language,
    is_free, is_published,
  } = body;

  const { error } = await supabase
    .from("practical_exams")
    .update({
      title_en: title_en?.trim(),
      title: title_en?.trim(),
      description: description?.trim() || null,
      category_id: category_id || null,
      license_category: license_category || null,
      target_language: target_language || null,
      is_free: Boolean(is_free),
      is_published: Boolean(is_published),
      updated_at: new Date().toISOString(),
    })
    .eq("id", examId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

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
  const { error } = await supabase.from("practical_exams").delete().eq("id", examId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
