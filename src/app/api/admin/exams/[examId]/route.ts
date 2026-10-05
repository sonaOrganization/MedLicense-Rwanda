import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { saveTheoryExam } from "@/lib/admin-content";
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  return saveTheoryExam(req, examId);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { examId } = await params;
  const { error } = await supabase.from("exams").delete().eq("id", examId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
