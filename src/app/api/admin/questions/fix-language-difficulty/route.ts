import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

// POST — sets language = 'FR' for questions whose difficulty
// contains French words: Facile, Moyen, or Difficile
export async function POST() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  // Use Supabase RPC to run raw SQL (needed for ILIKE on enum cast)
  const { data, error } = await supabase.rpc("fix_language_by_difficulty");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, fixed: data ?? 0 });
}
