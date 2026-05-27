import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await params;
  const { action } = await req.json();

  switch (action) {
    case "ban":
      await supabase.from("users").update({ is_banned: true }).eq("id", userId);
      break;
    case "unban":
      await supabase.from("users").update({ is_banned: false }).eq("id", userId);
      break;
    case "make_admin":
      await supabase.from("users").update({ role: "ADMIN" }).eq("id", userId);
      break;
    case "make_student":
      await supabase.from("users").update({ role: "STUDENT" }).eq("id", userId);
      break;
    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
