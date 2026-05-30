import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// POST /api/admin/questions/csv — bulk import from CSV
//
// Expected columns (header row required):
//   category_slug     — matches categories.slug
//   difficulty        — EASY | MEDIUM | HARD  (default: MEDIUM)
//   question          — question text
//   answer_a          — answer option A (required)
//   answer_b          — answer option B (required)
//   answer_c          — answer option C (optional)
//   answer_d          — answer option D (optional)
//   answer_e          — answer option E (optional)
//   correct_letter    — A | B | C | D | E
//   license_categories — comma-separated IDs e.g. "medical_doctor,nurse_a0" (optional)
//   explanation       — shown after submission (optional)
//   target_language   — EN | FR (default: EN)

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
  if (lines.length < 2)
    return NextResponse.json({ error: "CSV must have a header and at least one row" }, { status: 400 });

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
    const question = get(row, "question");
    const ansA     = get(row, "answer_a");
    const ansB     = get(row, "answer_b");
    const ansC     = get(row, "answer_c");
    const ansD     = get(row, "answer_d");
    const ansE     = get(row, "answer_e");
    const correct  = get(row, "correct_letter").toUpperCase();
    const expl     = get(row, "explanation");
    const lang     = (get(row, "target_language").toUpperCase() || "EN") as "EN" | "FR";
    const licCats  = get(row, "license_categories")
      .split(",").map((s: string) => s.trim()).filter(Boolean);

    // Validate
    if (!question) {
      failed.push({ row: i + 1, reason: "Missing question text" });
      continue;
    }
    if (!slug || !ansA || !ansB || !correct) {
      failed.push({ row: i + 1, reason: "Missing required fields (category_slug, answer_a, answer_b, correct_letter)" });
      continue;
    }
    const validLetters = ["A", "B", "C", "D", "E"].filter((l) => {
      if (l === "A") return !!ansA;
      if (l === "B") return !!ansB;
      if (l === "C") return !!ansC;
      if (l === "D") return !!ansD;
      if (l === "E") return !!ansE;
      return false;
    });
    if (!validLetters.includes(correct)) {
      failed.push({ row: i + 1, reason: `correct_letter "${correct}" has no matching answer text` });
      continue;
    }
    const catId = catMap[slug];
    if (!catId) {
      failed.push({ row: i + 1, reason: `Category slug "${slug}" not found` });
      continue;
    }

    // Store question text in the correct language column
    const { data: dbQuestion, error: qErr } = await supabase
      .from("questions")
      .insert({
        text_en:        lang === "EN" ? question : null,
        text_fr:        lang === "FR" ? question : null,
        explanation_en: lang === "EN" ? (expl || null) : null,
        explanation_fr: lang === "FR" ? (expl || null) : null,
        difficulty:     ["EASY", "MEDIUM", "HARD"].includes(diff) ? diff : "MEDIUM",
        category_id:    catId,
        language:       lang,
        license_categories: licCats,
        type:           "MULTIPLE_CHOICE",
        is_approved:    true,
        is_active:      true,
      })
      .select()
      .single();

    if (qErr) { failed.push({ row: i + 1, reason: qErr.message }); continue; }

    // Build answer rows — store in correct language column
    const answerTexts = [ansA, ansB, ansC, ansD, ansE];
    const correctIdx  = ["A", "B", "C", "D", "E"].indexOf(correct);

    const answerRows = answerTexts
      .map((t, idx) => ({ t, idx }))
      .filter(({ t }) => t)
      .map(({ t, idx }) => ({
        question_id: dbQuestion.id,
        text_en:     lang === "EN" ? t : null,
        text_fr:     lang === "FR" ? t : null,
        is_correct:  idx === correctIdx,
        order:       idx,
      }));

    const { error: aErr } = await supabase.from("answers").insert(answerRows);
    if (aErr) { failed.push({ row: i + 1, reason: aErr.message }); continue; }

    imported.push(dbQuestion.id);
  }

  return NextResponse.json({ imported: imported.length, failed });
}
