import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { consumeLimit } from "@/lib/rate-limit";
import { z } from "zod";
const schema = z.object({
  name: z.string().trim().min(2).max(100), email: z.string().trim().email().max(254),
  subject: z.string().trim().min(3).max(200), message: z.string().trim().min(10).max(5000),
  website: z.string().max(0).optional(),
});
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { name, email, subject, message } = parsed.data;
  if (!(await consumeLimit("contact", email.toLowerCase(), 3, 3600)) || !(await consumeLimit("contact-total", "all", 100, 3600))) {
    return NextResponse.json({ error: "Too many messages. Please try again later." }, { status: 429 });
  }
  const { error } = await supabase.from("feedback").insert({ name, email: email.toLowerCase(), subject, message, category: "contact" });
  if (error) { console.error("[CONTACT]", error); return NextResponse.json({ error: "Could not send your message. Please try again." }, { status: 500 }); }
  return NextResponse.json({ ok: true }, { status: 201 });
}
