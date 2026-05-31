import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

// POST /api/admin/questions/fix-language
// Auto-assigns language to questions that have none:
//   - text_fr IS NOT NULL  → language = 'FR'
//   - text_fr IS NULL      → language = 'EN'
// Questions that already have a language set are NOT touched.
export async function POST() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  // Set FR for questions that have French text but no language set
  const { data: frRows, error: frErr } = await supabase
    .from("questions")
    .update({ language: "FR" })
    .is("language", null)
    .not("text_fr", "is", null)
    .select("id");

  if (frErr) return NextResponse.json({ error: frErr.message }, { status: 500 });

  // Set EN for remaining questions with no language set
  const { data: enRows, error: enErr } = await supabase
    .from("questions")
    .update({ language: "EN" })
    .is("language", null)
    .select("id");

  const frFixed = frRows?.length ?? 0;
  const enFixed = enRows?.length ?? 0;

  if (enErr) return NextResponse.json({ error: enErr.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    frFixed,
    enFixed,
    total: frFixed + enFixed,
  });
}
