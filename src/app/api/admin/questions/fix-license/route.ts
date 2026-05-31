import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

// POST /api/admin/questions/fix-license
// Sets license_categories = ['medical_doctor'] for every question
// that has an empty license_categories array.
export async function POST() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { data: fixed, error } = await supabase
    .from("questions")
    .update({ license_categories: ["medical_doctor"] })
    .eq("license_categories", "{}")   // PostgreSQL empty array literal
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, fixed: fixed?.length ?? 0 });
}
