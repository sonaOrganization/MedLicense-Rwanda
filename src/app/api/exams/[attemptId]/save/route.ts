import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ attemptId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { attemptId } = await params;
  const body = await req.json();

  await supabase
    .from("exam_attempts")
    .update({ saved_state: body })
    .eq("id", attemptId)
    .eq("user_id", session.user.id)
    .eq("status", "IN_PROGRESS");

  return NextResponse.json({ ok: true });
}
