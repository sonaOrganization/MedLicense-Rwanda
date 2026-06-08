import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const exam_id = searchParams.get("exam_id");
  const category_id = searchParams.get("category_id");

  if (!exam_id || !category_id)
    return NextResponse.json({ error: "exam_id and category_id required" }, { status: 400 });

  // Get question IDs already in this exam
  const { data: existing } = await supabase
    .from("exam_questions")
    .select("question_id")
    .eq("exam_id", exam_id);
  const existingIds = (existing ?? []).map((r: { question_id: string }) => r.question_id);

  // Get approved questions from this category not already in the exam
  let query = supabase
    .from("questions")
    .select("id, text_en, difficulty")
    .eq("category_id", category_id)
    .eq("is_approved", true)
    .limit(60);

  if (existingIds.length > 0) {
    query = query.not("id", "in", `(${existingIds.join(",")})`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
