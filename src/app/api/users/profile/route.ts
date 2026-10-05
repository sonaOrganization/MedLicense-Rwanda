import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { profileSchema } from "@/lib/validations";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { name, phone, country, language } = parsed.data;

  const { error } = await supabase
    .from("users")
    .update({ name, phone, country, language })
    .eq("id", session.user.id);

  if (error) return NextResponse.json({ error: "Could not save your preference" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
