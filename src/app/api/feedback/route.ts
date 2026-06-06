import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rating, category, message } = await req.json();

  if (!rating || rating < 1 || rating > 5)
    return NextResponse.json({ error: "Rating must be 1–5" }, { status: 400 });

  const { error } = await supabase.from("feedback").insert({
    user_id:  session.user.id,
    rating,
    category: category ?? "general",
    message:  message?.trim() || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
