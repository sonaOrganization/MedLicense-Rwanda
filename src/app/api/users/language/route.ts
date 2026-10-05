import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const lang = body?.language;
  if (lang !== "EN" && lang !== "FR") {
    return NextResponse.json({ error: "Invalid language" }, { status: 400 });
  }

  const { error } = await supabase.from("users").update({ language: lang }).eq("id", session.user.id);
  if (error) return NextResponse.json({ error: "Could not save your preference" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
