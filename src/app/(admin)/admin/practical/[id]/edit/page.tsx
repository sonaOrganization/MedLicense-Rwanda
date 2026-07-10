import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PracticalExamEditorClient } from "@/components/admin/practical/PracticalExamEditorClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminPracticalExamEditPage({ params }: Props) {
  const { id } = await params;

  const { data: exam } = await supabase
    .from("practical_exams")
    .select("id, title_en")
    .eq("id", id)
    .single();

  if (!exam) notFound();

  const { data: groups } = await supabase
    .from("practical_groups")
    .select("id, stem_en, stem_fr, order, subquestions:practical_subquestions(id, prompt_en, prompt_fr, model_answer_en, model_answer_fr, order)")
    .eq("practical_exam_id", id)
    .order("order", { ascending: true });

  const groupList = (groups ?? []).map((g) => ({
    ...g,
    subquestions: [...(g.subquestions ?? [])].sort((a, b) => a.order - b.order),
  }));

  return (
    <div className="max-w-4xl">
      <PracticalExamEditorClient exam={exam} groups={groupList} />
    </div>
  );
}
