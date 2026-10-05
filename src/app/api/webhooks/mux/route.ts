import { getMux } from "@/lib/mux";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
const schema = z.object({
  type: z.string(), data: z.object({
    id: z.string(), passthrough: z.string().optional(), duration: z.number().nonnegative().optional(),
    playback_ids: z.array(z.object({ id: z.string(), policy: z.enum(["public", "signed"]) })).optional(),
  }),
});
export async function POST(req: NextRequest) {
  const secret = process.env.MUX_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  const rawBody = await req.text();
  if (rawBody.length > 1000000) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  try { getMux().webhooks.verifySignature(rawBody, Object.fromEntries(req.headers.entries()), secret); }
  catch { return NextResponse.json({ error: "Invalid signature" }, { status: 401 }); }
  let body: unknown;
  try { body = JSON.parse(rawBody); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  const event = parsed.data;
  const videoId = event.data.passthrough;
  if (!videoId || !["video.asset.ready", "video.asset.errored"].includes(event.type)) return NextResponse.json({ ok: true });
  const playback = event.data.playback_ids?.find((p) => p.policy === "signed") ?? event.data.playback_ids?.find((p) => p.policy === "public");
  const update = event.type === "video.asset.errored"
    ? { mux_asset_id: "error", updated_at: new Date().toISOString() }
    : {
      mux_asset_id: event.data.id, mux_playback_id: playback?.id ?? null, playback_policy: playback?.policy ?? "public",
      duration: event.data.duration ? Math.round(event.data.duration) : null,
      thumbnail: playback?.policy === "public" ? "https://image.mux.com/" + playback.id + "/thumbnail.jpg?time=0" : null,
      updated_at: new Date().toISOString(),
    };
  const { error } = await supabase.from("videos").update(update).eq("id", videoId);
  if (error) { console.error("[MUX_WEBHOOK]", error); return NextResponse.json({ error: "Could not process event" }, { status: 500 }); }
  return NextResponse.json({ ok: true });
}
