import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

function parseCSV(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", quoted = false;
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char === '"' && quoted && input[i + 1] === '"') { field += '"'; i++; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(field.trim()); field = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && input[i + 1] === "\n") i++;
      row.push(field.trim()); field = "";
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else field += char;
  }
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { examId, csv } = await req.json();
  if (!examId || !csv) return NextResponse.json({ error: "Exam and CSV data are required" }, { status: 400 });
  const { data: exam } = await supabase.from("practical_exams").select("id").eq("id", examId).single();
  if (!exam) return NextResponse.json({ error: "Practical exam not found" }, { status: 404 });

  const rows = parseCSV(csv);
  if (rows.length < 2) return NextResponse.json({ error: "CSV must contain a header and at least one data row" }, { status: 400 });
  const headers = rows[0].map((value) => value.replace(/^\uFEFF/, "").toLowerCase().replace(/\s+/g, "_"));
  const required = ["case_key", "stem_en", "prompt_en", "model_answer_en"];
  const missing = required.filter((column) => !headers.includes(column));
  if (missing.length) return NextResponse.json({ error: `Missing required column(s): ${missing.join(", ")}` }, { status: 400 });
  const get = (row: string[], key: string) => row[headers.indexOf(key)]?.trim() || "";

  const { count: existingGroups } = await supabase.from("practical_groups").select("id", { count: "exact", head: true }).eq("practical_exam_id", examId);
  const groups = new Map<string, string>();
  const failed: { row: number; reason: string }[] = [];
  let imported = 0, createdGroups = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i], key = get(row, "case_key"), prompt = get(row, "prompt_en"), answer = get(row, "model_answer_en");
    if (!key || !prompt || !answer) { failed.push({ row: i + 1, reason: "case_key, prompt_en, and model_answer_en are required" }); continue; }
    let groupId = groups.get(key);
    if (!groupId) {
      const stem = get(row, "stem_en");
      if (!stem) { failed.push({ row: i + 1, reason: `First row for case_key "${key}" must include stem_en` }); continue; }
      const { data: group, error } = await supabase.from("practical_groups").insert({ practical_exam_id: examId, stem_en: stem, stem_fr: get(row, "stem_fr") || null, order: (existingGroups ?? 0) + createdGroups }).select("id").single();
      if (error || !group) { failed.push({ row: i + 1, reason: error?.message || "Could not create case" }); continue; }
      const createdGroupId: string = group.id;
      groupId = createdGroupId;
      groups.set(key, createdGroupId);
      createdGroups++;
    }
    const { count } = await supabase.from("practical_subquestions").select("id", { count: "exact", head: true }).eq("group_id", groupId);
    const { error } = await supabase.from("practical_subquestions").insert({ group_id: groupId, prompt_en: prompt, prompt_fr: get(row, "prompt_fr") || null, model_answer_en: answer, model_answer_fr: get(row, "model_answer_fr") || null, order: count ?? 0 });
    if (error) failed.push({ row: i + 1, reason: error.message }); else imported++;
  }

  const { data: allGroups } = await supabase.from("practical_groups").select("id").eq("practical_exam_id", examId);
  const ids = (allGroups ?? []).map((group) => group.id);
  let totalSubquestions = 0;
  if (ids.length) {
    const result = await supabase.from("practical_subquestions").select("id", { count: "exact", head: true }).in("group_id", ids);
    totalSubquestions = result.count ?? 0;
  }
  await supabase.from("practical_exams").update({ total_groups: ids.length, total_subquestions: totalSubquestions }).eq("id", examId);
  return NextResponse.json({ imported, groupsCreated: createdGroups, failed });
}
