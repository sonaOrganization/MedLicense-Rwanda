import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { consumeLimit } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
const schema = z.object({
  rating: z.number().int().min(1).max(5),
  category: z.enum(["general", "exam_content", "ui_ux", "subscription", "bug_report"]).default("general"),
  message: z.string().trim().max(5000).optional(),
});
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid feedback" }, { status: 400 });
  if (!(await consumeLimit("feedback", session.user.id, 5, 3600))) return NextResponse.json({ error: "Please try again later." }, { status: 429 });
  const { error } = await supabase.from("feedback").insert({
    user_id: session.user.id, name: session.user.name, email: session.user.email,
    subject: "Student feedback", ...parsed.data, message: parsed.data.message || null,
  });
  if (error) { console.error("[FEEDBACK]", error); return NextResponse.json({ error: "Could not save feedback" }, { status: 500 }); }
  return NextResponse.json({ ok: true });
}
