import { supabase } from "@/lib/supabase";
import { QBPClient } from "@/components/admin/practical/QBPClient";

export default async function QBPPage() {
  const { data: groups } = await supabase
    .from("practical_groups")
    .select("*, exam:practical_exams(id, title_en), subquestions:practical_subquestions(*)")
    .order("practical_exam_id", { ascending: true });

  const caseList = (groups ?? []).map((g) => ({
    id: g.id,
    stem_en: g.stem_en,
    stem_fr: g.stem_fr ?? null,
    order: g.order,
    exam: Array.isArray(g.exam) ? (g.exam[0] ?? null) : (g.exam ?? null),
    subquestions: [...(g.subquestions ?? [])].sort((a, b) => a.order - b.order),
  }));

  return <QBPClient cases={caseList} />;
}
