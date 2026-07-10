import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { PracticalResultClient } from "./PracticalResultClient";

interface Props { params: Promise<{ attemptId: string }> }

export default async function PracticalResultPage({ params }: Props) {
  const { attemptId } = await params;
  const session = await auth();
  if (!session) redirect("/login");

  const { data: attempt } = await supabase
    .from("practical_attempts")
    .select(`
      *,
      exam:practical_exams(id, title_en, title_fr),
      answers:practical_attempt_answers(
        *,
        subquestion:practical_subquestions(*, group:practical_groups(*))
      )
    `)
    .eq("id", attemptId)
    .eq("user_id", session.user.id)
    .single();

  if (!attempt || attempt.status !== "COMPLETED") notFound();

  return <PracticalResultClient attempt={attempt} />;
}
