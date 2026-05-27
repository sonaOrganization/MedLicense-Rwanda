import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { getMux } from "@/lib/mux";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { title_en, description, category_id, is_free } = await req.json();

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
      is_free: Boolean(is_free),
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
        playback_policy: ["public"],
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
