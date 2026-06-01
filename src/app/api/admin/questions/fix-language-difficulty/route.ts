import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

// POST — detects French questions by two signals:
// 1. Difficulty contains French words (Facile, Moyen, Difficile)
// 2. text_en contains French accent characters (é, è, à, ç, etc.)
// Sets language = 'FR' and copies text_en → text_fr if text_fr is empty.
export async function POST() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { data, error } = await supabase.rpc("fix_french_questions");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, fixed: data ?? 0 });
}
