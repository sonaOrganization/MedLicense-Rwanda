import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { getMux } from "@/lib/mux";
import { hasPremiumAccess } from "@/lib/subscriptions";
export async function GET(_req: NextRequest, { params }: { params: Promise<{ videoId: string }> }) {
  const { videoId } = await params;
  const { data: video, error } = await supabase.from("videos").select("id, is_free, is_published, mux_playback_id, playback_policy").eq("id", videoId).eq("is_published", true).maybeSingle();
  if (error) return NextResponse.json({ error: "Could not load video" }, { status: 500 });
  if (!video || !video.mux_playback_id) return NextResponse.json({ error: "This video is not ready yet" }, { status: 404 });
  if (!video.is_free) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Sign in to watch premium videos" }, { status: 401 });
    if (session.user.role !== "ADMIN" && !(await hasPremiumAccess(session.user.id))) return NextResponse.json({ error: "An active subscription is required" }, { status: 403 });
    if (video.playback_policy !== "signed") return NextResponse.json({ error: "This video is temporarily unavailable" }, { status: 503 });
  }
  const headers = { "Cache-Control": "private, no-store" };
  if (video.playback_policy === "public") return NextResponse.json({ playbackId: video.mux_playback_id }, { headers });
  if (!process.env.MUX_SIGNING_KEY_ID || !process.env.MUX_SIGNING_PRIVATE_KEY) return NextResponse.json({ error: "Video playback is temporarily unavailable" }, { status: 503 });
  try {
    const tokens = await getMux().jwt.signPlaybackId(video.mux_playback_id, { type: ["video", "thumbnail", "storyboard"], expiration: "1h" });
    return NextResponse.json({ playbackId: video.mux_playback_id, tokens: { playback: tokens["playback-token"], thumbnail: tokens["thumbnail-token"], storyboard: tokens["storyboard-token"] } }, { headers });
  } catch (err) { console.error("[VIDEO_PLAYBACK]", err); return NextResponse.json({ error: "Could not open video" }, { status: 500 }); }
}
