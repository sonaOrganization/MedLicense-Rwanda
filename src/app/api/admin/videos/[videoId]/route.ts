import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { getMux } from "@/lib/mux";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { videoId } = await params;
  const body = await req.json();

  // Toggle-only call (from VideoToggle)
  if (Object.keys(body).length === 1 && "is_published" in body) {
    const { error } = await supabase
      .from("videos")
      .update({ is_published: body.is_published, updated_at: new Date().toISOString() })
      .eq("id", videoId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Full metadata update
  const { title_en, description, category_id, is_free, is_published } = body;
  const { error } = await supabase
    .from("videos")
    .update({
      title_en: title_en?.trim(),
      title: title_en?.trim(),
      description: description?.trim() || null,
      category_id,
      is_free: Boolean(is_free),
      is_published: Boolean(is_published),
      updated_at: new Date().toISOString(),
    })
    .eq("id", videoId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { videoId } = await params;

  // Get mux_asset_id so we can delete from Mux too
  const { data: video } = await supabase
    .from("videos")
    .select("mux_asset_id")
    .eq("id", videoId)
    .single();

  if (video?.mux_asset_id && video.mux_asset_id !== "error") {
    try {
      const mux = getMux();
      await mux.video.assets.delete(video.mux_asset_id);
    } catch {
      // Best-effort: proceed with DB delete even if Mux delete fails
    }
  }

  const { error } = await supabase.from("videos").delete().eq("id", videoId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
