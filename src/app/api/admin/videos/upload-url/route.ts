import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { getMux } from "@/lib/mux";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.title_en !== "string" || typeof body.category_id !== "string" || typeof body.is_free !== "boolean") {
    return NextResponse.json({ error: "Invalid video details" }, { status: 400 });
  }
  const { title_en, description, category_id, is_free } = body;
  if (!is_free && (!process.env.MUX_SIGNING_KEY_ID || !process.env.MUX_SIGNING_PRIVATE_KEY)) {
    return NextResponse.json({ error: "Configure protected video playback before uploading premium videos" }, { status: 503 });
  }

  if (!title_en?.trim())
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  if (!category_id)
    return NextResponse.json({ error: "Category is required" }, { status: 400 });

  // Insert placeholder video record first so we have an ID for passthrough
  const { data: video, error: dbErr } = await supabase
    .from("videos")
    .insert({
      title_en: title_en.trim(),
      title: title_en.trim(),
      description: description?.trim() || null,
      category_id,
      is_free,
      playback_policy: is_free ? "public" : "signed",
      is_published: false,
    })
    .select("id")
    .single();

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

  try {
    const mux = getMux();
    const upload = await mux.video.uploads.create({
      cors_origin: process.env.NEXT_PUBLIC_APP_URL ?? "*",
      new_asset_settings: {
        playback_policy: [is_free ? "public" : "signed"],
        passthrough: video.id,
      },
    });

    return NextResponse.json({ uploadUrl: upload.url, videoId: video.id });
  } catch (err: unknown) {
    // Clean up the DB record if Mux fails
    await supabase.from("videos").delete().eq("id", video.id);
    const msg = err instanceof Error ? err.message : "Mux error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
