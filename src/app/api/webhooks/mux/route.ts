import { getMux } from "@/lib/mux";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const secret  = process.env.MUX_WEBHOOK_SECRET;

  if (secret) {
    try {
      const mux = getMux();
      mux.webhooks.verifySignature(
        rawBody,
        Object.fromEntries(req.headers.entries()),
        secret
      );
    } catch {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  const event = JSON.parse(rawBody) as {
    type: string;
    data: {
      id: string;
      passthrough?: string;
      upload_id?: string;
      duration?: number;
      playback_ids?: { id: string; policy: string }[];
    };
  };

  if (event.type === "video.asset.ready") {
    const { id: assetId, passthrough, duration, playback_ids } = event.data;
    const playbackId = playback_ids?.find((p) => p.policy === "public")?.id;

    if (passthrough) {
      const thumbnail = playbackId
        ? `https://image.mux.com/${playbackId}/thumbnail.jpg?time=0`
        : null;

      await supabase
        .from("videos")
        .update({
          mux_asset_id: assetId,
          mux_playback_id: playbackId ?? null,
          duration: duration ? Math.round(duration) : null,
          thumbnail,
          updated_at: new Date().toISOString(),
        })
        .eq("id", passthrough);
    }
  }

  if (event.type === "video.asset.errored") {
    // Mark the video as having a processing error — passthrough is our video ID
    if (event.data.passthrough) {
      await supabase
        .from("videos")
        .update({ mux_asset_id: "error", updated_at: new Date().toISOString() })
        .eq("id", event.data.passthrough);
    }
  }

  return NextResponse.json({ ok: true });
}
