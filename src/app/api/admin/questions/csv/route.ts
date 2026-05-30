import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// POST /api/admin/questions/csv — bulk import from CSV text
//
// Required columns (header row required):
//   category_slug, difficulty, correct_letter
//   language         — EN or FR (defaults to EN if omitted)
//
// For English questions (language=EN):
//   text_en, explanation_en (optional)
//   answer_a, answer_b, answer_c, answer_d
//
// For French questions (language=FR):
//   text_fr, explanation_fr (optional)
//   answer_a_fr, answer_b_fr, answer_c_fr, answer_d_fr
//
// Optional columns (both languages):
//   license_categories  — comma-separated IDs e.g. "medical_doctor,nurse_a0"
//   text_en / text_fr   — translation fallback for the non-primary language

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { csv } = await req.json();
  if (!csv) return NextResponse.json({ error: "No CSV data" }, { status: 400 });

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

    const slug     = get(row, "category_slug");
    const diff     = get(row, "difficulty").toUpperCase() || "MEDIUM";
    const correct  = get(row, "correct_letter").toUpperCase();
    const language = (get(row, "language").toUpperCase() || "EN") as "EN" | "FR";
    const licCats  = get(row, "license_categories")
      .split(",").map((s: string) => s.trim()).filter(Boolean);

    // English fields
    const textEn   = get(row, "text_en");
    const explEn   = get(row, "explanation_en");
    const aEn      = get(row, "answer_a");
    const bEn      = get(row, "answer_b");
    const cEn      = get(row, "answer_c");
    const dEn      = get(row, "answer_d");

    // French fields
    const textFr   = get(row, "text_fr");
    const explFr   = get(row, "explanation_fr");
    const aFr      = get(row, "answer_a_fr");
    const bFr      = get(row, "answer_b_fr");
    const cFr      = get(row, "answer_c_fr");
    const dFr      = get(row, "answer_d_fr");

    // Validate required fields based on language
    const primaryText    = language === "FR" ? textFr  : textEn;
    const primaryAnswerA = language === "FR" ? aFr     : aEn;
    const primaryAnswerB = language === "FR" ? bFr     : bEn;

    if (!primaryText) {
      failed.push({ row: i + 1, reason: `Missing ${language === "FR" ? "text_fr" : "text_en"}` });
      continue;
    }
    if (!slug || !primaryAnswerA || !primaryAnswerB || !correct) {
      failed.push({ row: i + 1, reason: "Missing required fields (category_slug, answer_a/b, correct_letter)" });
      continue;
    }

    const catId = catMap[slug];
    if (!catId) { failed.push({ row: i + 1, reason: `Category slug "${slug}" not found` }); continue; }
    if (!["A","B","C","D"].includes(correct)) { failed.push({ row: i + 1, reason: "correct_letter must be A, B, C, or D" }); continue; }

    const { data: question, error: qErr } = await supabase
      .from("questions")
      .insert({
        text_en:        textEn  || null,
        text_fr:        textFr  || null,
        explanation_en: explEn  || null,
        explanation_fr: explFr  || null,
        difficulty:     diff,
        category_id:    catId,
        language,
        license_categories: licCats,
        type:        "MULTIPLE_CHOICE",
        is_approved: true,
        is_active:   true,
      })
      .select()
      .single();

    if (qErr) { failed.push({ row: i + 1, reason: qErr.message }); continue; }

    // Build answer rows using primary language + optional translation
    const enTexts = [aEn, bEn, cEn, dEn];
    const frTexts = [aFr, bFr, cFr, dFr];
    const primaryTexts = language === "FR" ? frTexts : enTexts;

    const correctIdx  = ["A","B","C","D"].indexOf(correct);
    const answerRows  = primaryTexts
      .map((t, idx) => ({ t, idx }))
      .filter(({ t }) => t)
      .map(({ t, idx }) => ({
        question_id: question.id,
        text_en:     language === "EN" ? t : (enTexts[idx] || null),
        text_fr:     language === "FR" ? t : (frTexts[idx] || null),
        is_correct:  idx === correctIdx,
        order:       idx,
      }));

    const { error: aErr } = await supabase.from("answers").insert(answerRows);
    if (aErr) { failed.push({ row: i + 1, reason: aErr.message }); continue; }

    imported.push(question.id);
  }

  return NextResponse.json({ imported: imported.length, failed });
}
