import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { ResultsClient } from "./ResultsClient";

export default async function ResultsPage() {
  const session = await auth();
  const { data: attempts } = await supabase
    .from("exam_attempts")
    .select("*, exam:exams(title_en, title_fr, passing_score, duration_minutes, category:categories(name_en, name_fr))")
    .eq("user_id", session!.user.id)
    .eq("status", "COMPLETED")
    .order("submitted_at", { ascending: false });

  return <ResultsClient attempts={attempts ?? []} />;
}
