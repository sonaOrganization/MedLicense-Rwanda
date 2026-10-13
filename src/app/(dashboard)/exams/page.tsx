import { supabase } from "@/lib/supabase";
import { hasPremiumAccess } from "@/lib/subscriptions";
import { auth } from "@/lib/auth";
import { ExamsClient } from "./ExamsClient";

export default async function ExamsPage() {
  const session = await auth();
  const isPremium = await hasPremiumAccess(session!.user.id);

  const licenseCategory = session?.user?.licenseCategory;

  let examsQuery = supabase
    .from("exams")
    .select("*, category:categories(name_en, name_fr), questions:exam_questions(count)")
    .eq("is_published", true);

  // Exams (free or paid) are only shown to students of the exam's license category.
  examsQuery = examsQuery.eq("license_category", licenseCategory ?? "");

  const { data: exams } = await examsQuery
    .order("is_free", { ascending: false })       // free exams first
    .order("created_at", { ascending: false });

  return <ExamsClient exams={exams ?? []} isPremium={isPremium} />;
}
