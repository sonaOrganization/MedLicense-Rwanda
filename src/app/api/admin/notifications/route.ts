import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// POST /api/admin/notifications — send a notification to one or all users
// Body: { user_id?: string, title: string, message: string, type?: "info"|"success"|"warning"|"error" }
// Omit user_id to broadcast to all students
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { user_id, title, message, type = "info" } = await req.json();

  if (!title?.trim() || !message?.trim())
    return NextResponse.json({ error: "title and message are required" }, { status: 400 });

  if (user_id) {
    const { error } = await supabase
      .from("notifications")
      .insert({ user_id, title: title.trim(), message: message.trim(), type });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, sent: 1 });
  }

  // Broadcast: fetch all non-banned student IDs then bulk insert
  const { data: users, error: uErr } = await supabase
    .from("users")
    .select("id")
    .eq("role", "STUDENT")
    .eq("is_banned", false);

  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });

  const rows = (users ?? []).map((u: { id: string }) => ({
    user_id: u.id,
    title: title.trim(),
    message: message.trim(),
    type,
  }));

  if (rows.length === 0) return NextResponse.json({ ok: true, sent: 0 });

  const { error } = await supabase.from("notifications").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, sent: rows.length });
}
