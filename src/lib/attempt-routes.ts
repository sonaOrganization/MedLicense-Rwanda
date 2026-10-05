import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { emitAutomationEvent } from "@/lib/automation";
import { z } from "zod";

const theoryAnswers = z.record(z.string().max(100), z.string().max(100).nullable()).refine((a) => Object.keys(a).length <= 1000);
const practicalAnswers = z.record(z.string().max(100), z.boolean()).refine((a) => Object.keys(a).length <= 1000);
const revision = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const theoryState = z.object({ revision, answers: theoryAnswers, flagged: z.record(z.string().max(100), z.boolean()).optional(), currentIndex: z.number().int().min(0).max(999).optional() });
const practicalState = z.object({ revision, answers: practicalAnswers, groupIndex: z.number().int().min(0).max(999).optional(), subIndex: z.number().int().min(0).max(999).optional() });

type Context = { params: Promise<{ attemptId: string }> };
export function saveAttempt(kind: "theory" | "practical") {
  return async (req: NextRequest, { params }: Context) => {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const parsed = (kind === "theory" ? theoryState : practicalState).safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid state" }, { status: 400 });
    const { revision: stateRevision, ...state } = parsed.data;
    const { attemptId } = await params;
    const { data, error } = await supabase.rpc("save_exam_state", { p_user_id: session.user.id, p_attempt_id: attemptId, p_kind: kind, p_state: state, p_revision: stateRevision });
    if (error) { console.error("[SAVE_ATTEMPT]", error); return NextResponse.json({ error: "Could not save attempt" }, { status: 500 }); }
    return NextResponse.json(data, { status: data?.error ? 409 : 200 });
  };
}
export function submitAttempt(kind: "theory" | "practical") {
  return async (req: NextRequest, { params }: Context) => {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => null);
    const parsed = (kind === "theory" ? theoryAnswers : practicalAnswers).safeParse(body?.answers);
    if (!parsed.success) return NextResponse.json({ error: "Invalid answers" }, { status: 400 });
    const { attemptId } = await params;
    const { data, error } = await supabase.rpc("submit_exam_attempt", { p_user_id: session.user.id, p_attempt_id: attemptId, p_kind: kind, p_answers: parsed.data });
    if (error) { console.error("[SUBMIT_ATTEMPT]", error); return NextResponse.json({ error: "Could not submit attempt" }, { status: 500 }); }
    if (data?.error) return NextResponse.json({ error: data.error }, { status: data.error === "not_found" ? 404 : 409 });
    await emitAutomationEvent({ type: kind === "theory" ? "exam.completed" : "practical.completed", userId: session.user.id, data }).catch((err) => console.error("[ATTEMPT_AUTOMATION]", err));
    return NextResponse.json(data);
  };
}
