import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// POST /api/admin/questions/csv — bulk import from CSV text
// Expected CSV columns (header row required):
// category_slug, difficulty, text_en, explanation_en, answer_a, answer_b, answer_c, answer_d, correct_letter
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { csv } = await req.json();
  if (!csv) return NextResponse.json({ error: "No CSV data" }, { status: 400 });

  // Fetch categories for slug lookup
  const { data: categories } = await supabase.from("categories").select("id, slug");
  const catMap: Record<string, string> = {};
  (categories ?? []).forEach((c: { id: string; slug: string }) => { catMap[c.slug] = c.id; });

  const lines = csv.split("\n").map((l: string) => l.trim()).filter(Boolean);
  if (lines.length < 2) return NextResponse.json({ error: "CSV must have a header and at least one row" }, { status: 400 });

  function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === "," && !inQuotes) { result.push(current.trim()); current = ""; continue; }
      current += ch;
    }
    result.push(current.trim());
    return result;
  }

  const header = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, "_"));
  const get = (row: string[], key: string) => row[header.indexOf(key)] ?? "";

  const imported: string[] = [];
  const failed: { row: number; reason: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    const slug      = get(row, "category_slug");
    const diff      = get(row, "difficulty").toUpperCase() || "MEDIUM";
    const text      = get(row, "text_en");
    const expl      = get(row, "explanation_en");
    const a         = get(row, "answer_a");
    const b         = get(row, "answer_b");
    const c         = get(row, "answer_c");
    const d         = get(row, "answer_d");
    const correct   = get(row, "correct_letter").toUpperCase();
    // Optional: comma-separated license category IDs e.g. "medical_doctor,nurse_a0"
    const licCats   = get(row, "license_categories")
      .split(",").map((s: string) => s.trim()).filter(Boolean);

    if (!text || !slug || !a || !b || !correct) {
      failed.push({ row: i + 1, reason: "Missing required fields (text_en, category_slug, answer_a/b, correct_letter)" });
      continue;
    }
    const catId = catMap[slug];
    if (!catId) { failed.push({ row: i + 1, reason: `Category slug "${slug}" not found` }); continue; }
    if (!["A","B","C","D"].includes(correct)) { failed.push({ row: i + 1, reason: `correct_letter must be A, B, C, or D` }); continue; }

    const { data: question, error: qErr } = await supabase
      .from("questions")
      .insert({ text_en: text, explanation_en: expl || null, difficulty: diff, category_id: catId, license_categories: licCats, type: "MULTIPLE_CHOICE", is_approved: true, is_active: true })
      .select()
      .single();

    if (qErr) { failed.push({ row: i + 1, reason: qErr.message }); continue; }

    const answerTexts = [a, b, c, d].filter(Boolean);
    const correctIdx = ["A","B","C","D"].indexOf(correct);
    const answerRows = answerTexts.map((t, idx) => ({
      question_id: question.id,
      text_en: t,
      is_correct: idx === correctIdx,
      order: idx,
    }));

    const { error: aErr } = await supabase.from("answers").insert(answerRows);
    if (aErr) { failed.push({ row: i + 1, reason: aErr.message }); continue; }

    imported.push(question.id);
  }

  return NextResponse.json({ imported: imported.length, failed });
}
