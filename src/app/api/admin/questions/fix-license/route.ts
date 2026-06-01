import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// POST /api/admin/questions/fix-license
// ?all=true  → sets ALL questions to ['medical_doctor']
// default    → only fixes questions with empty license_categories
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "true";

  let query = supabase
    .from("questions")
    .update({ license_categories: ["medical_doctor"] });

  if (!all) {
    query = query.eq("license_categories", "{}"); // only empty ones
  }
  // if all=true, no filter → updates every question

  const { data: fixed, error } = await query.select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, fixed: fixed?.length ?? 0 });
}
