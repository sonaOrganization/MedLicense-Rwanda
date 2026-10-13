import { notFound, redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { auth } from "@/lib/auth";
import { PracticalEngine } from "@/components/practical/PracticalEngine";
import type { StartedAttempt, PracticalSnapshot, PracticalState } from "@/lib/exam-types";
interface Props { params: Promise<{ id: string }> }
export default async function PracticalExamPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/login");
  const { data: target } = await supabase.from("practical_exams").select("license_category").eq("id", id).maybeSingle();
  if (!target || (session.user.role !== "ADMIN" && target.license_category !== session.user.licenseCategory)) notFound();
  const { data, error } = await supabase.rpc("start_exam_attempt", { p_user_id: session.user.id, p_exam_id: id, p_kind: "practical" });
  if (error) { console.error("[START_PRACTICAL]", error); throw new Error("Could not start practical exam"); }
  const attempt = data as StartedAttempt<PracticalSnapshot, PracticalState> | null;
  if (attempt?.error === "access_denied") redirect("/subscription?required=true");
  if (!attempt || attempt.error || !attempt.exam_snapshot) notFound();
  const exam = attempt.exam_snapshot;
  const groups = exam.groups.filter((g) => g.subquestions.length > 0);
  const saved = attempt.saved_state;
  const groupIndex = Math.min(Math.max(0, saved?.groupIndex ?? 0), groups.length - 1);
  const subIndex = Math.min(Math.max(0, saved?.subIndex ?? 0), groups[groupIndex].subquestions.length - 1);
  return <PracticalEngine exam={{
    id: exam.id, titleEn: exam.title_en, titleFr: exam.title_fr ?? null, attemptId: attempt.id,
    groups: groups.map((g) => ({
      id: g.id, stemEn: g.stem_en, stemFr: g.stem_fr ?? null, imageUrl: g.image_url ?? null,
      subquestions: g.subquestions.map((s) => ({ id: s.id, promptEn: s.prompt_en, promptFr: s.prompt_fr ?? null,
        modelAnswerEn: s.model_answer_en, modelAnswerFr: s.model_answer_fr ?? null })),
    })),
    initialRevision: attempt.saved_revision,
    initialState: saved ? { groupIndex, subIndex, answers: saved.answers ?? {} } : null,
  }} />;
}
