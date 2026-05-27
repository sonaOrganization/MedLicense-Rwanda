import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { videoId } = await params;
  const body = await req.json();

  const { error } = await supabase
    .from("videos")
    .update({ is_published: body.is_published, updated_at: new Date().toISOString() })
    .eq("id", videoId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
