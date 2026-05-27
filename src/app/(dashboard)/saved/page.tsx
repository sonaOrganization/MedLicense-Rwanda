import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { SavedClient } from "./SavedClient";

export default async function SavedQuestionsPage() {
  const session = await auth();
  const { data: saved } = await supabase
    .from("saved_questions")
    .select("*, question:questions(*, answers(*), category:categories(name_en, name_fr))")
    .eq("user_id", session!.user.id)
    .order("saved_at", { ascending: false });

  return <SavedClient savedList={saved ?? []} />;
}
