import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { getMux } from "@/lib/mux";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  title_en: z.string().trim().min(1).max(500).optional(),
  description: z.string().trim().max(10000).nullable().optional(),
  category_id: z.string().max(100).nullable().optional(),
  is_free: z.boolean().optional(), is_published: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).length > 0);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ videoId: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { videoId } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid video details" }, { status: 400 });
  const { data: video, error: readError } = await supabase.from("videos").select("*").eq("id", videoId).maybeSingle();
  if (readError) return NextResponse.json({ error: "Could not load video" }, { status: 500 });
  if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });
  const isFree = parsed.data.is_free ?? video.is_free;
  const isPublished = parsed.data.is_published ?? video.is_published;
  const update: Record<string, unknown> = { ...parsed.data, updated_at: new Date().toISOString() };
  if (parsed.data.title_en) update.title = parsed.data.title_en;
  if (!isFree && isPublished) {
    if (!process.env.MUX_SIGNING_KEY_ID || !process.env.MUX_SIGNING_PRIVATE_KEY) return NextResponse.json({ error: "Configure protected playback before publishing premium videos" }, { status: 503 });
    if (!video.mux_asset_id || video.mux_asset_id === "error") return NextResponse.json({ error: "Wait for video processing to finish" }, { status: 409 });
    try {
      const mux = getMux();
      const asset = await mux.video.assets.retrieve(video.mux_asset_id);
      const signed = asset.playback_ids?.find((p) => p.policy === "signed")
        ?? await mux.video.assets.createPlaybackId(video.mux_asset_id, { policy: "signed" });
      // Existing public playback links must be revoked to enforce the paywall.
      for (const playback of asset.playback_ids ?? []) {
        if (playback.policy === "public") await mux.video.assets.deletePlaybackId(video.mux_asset_id, playback.id);
      }
      update.mux_playback_id = signed.id;
      update.playback_policy = "signed";
      update.thumbnail = null;
    } catch (error) { console.error("[SECURE_VIDEO]", error); return NextResponse.json({ error: "Could not protect this video. Please try again." }, { status: 502 }); }
  }
  if (isPublished && !video.mux_playback_id && !update.mux_playback_id) return NextResponse.json({ error: "Wait for video processing to finish" }, { status: 409 });
  const { error } = await supabase.from("videos").update(update).eq("id", videoId);
  if (error) return NextResponse.json({ error: "Could not save video" }, { status: 500 });
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
