import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const {
    title_en, description, category_id, license_category, target_language,
    is_free, is_published,
  } = await req.json();

  if (!title_en?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const { data: exam, error } = await supabase
    .from("practical_exams")
    .insert({
      title_en: title_en.trim(),
      title: title_en.trim(),
      description: description?.trim() || null,
      category_id: category_id || null,
      license_category: license_category || null,
      target_language: target_language || null,
      is_free: Boolean(is_free),
      is_published: Boolean(is_published),
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id: exam.id }, { status: 201 });
}
