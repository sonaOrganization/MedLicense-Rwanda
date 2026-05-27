import { supabase } from "@/lib/supabase";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, FileText, Star, Lock } from "lucide-react";

export default async function ExamsPage() {
  const session = await auth();
  const { data: subscription } = await supabase.from("subscriptions").select("*").eq("user_id", session!.user.id).single();
  const isPremium = subscription?.status === "ACTIVE" || subscription?.status === "TRIAL";

  const { data: exams } = await supabase
    .from("exams")
    .select("*, category:categories(*), questions:exam_questions(count), attempts:exam_attempts(count)")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  const { data: categories } = await supabase.from("categories").select("*");

  const examList = exams ?? [];
  const categoryList = categories ?? [];

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mock Exams</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Choose an exam to start practicing</p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button className="px-3 py-1.5 rounded-full text-sm font-medium bg-indigo-600 text-white">All</button>
        {categoryList.map((cat: { id: string; name_en: string }) => (
          <button key={cat.id} className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 transition-colors">
            {cat.name_en}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {examList.map((exam: {
          id: string;
          title_en: string;
          description?: string;
          is_free: boolean;
          is_published: boolean;
          duration_minutes: number;
          category: { name_en: string };
          questions: { count: number }[];
        }) => {
          const locked = !exam.is_free && !isPremium;
          return (
            <Card key={exam.id} className={locked ? "opacity-80" : ""}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="info">{exam.category.name_en}</Badge>
                  {exam.is_free ? (
                    <Badge variant="success">Free</Badge>
                  ) : locked ? (
                    <Lock className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{exam.title_en}</h3>
                {exam.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{exam.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                  <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {exam.questions[0]?.count ?? 0} questions</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {exam.duration_minutes} min</span>
                </div>
                {locked ? (
                  <Link href="/subscription">
                    <Button variant="outline" className="w-full" size="sm">
                      <Lock className="w-4 h-4" /> Upgrade to Unlock
                    </Button>
                  </Link>
                ) : (
                  <Link href={`/exams/${exam.id}`}>
                    <Button className="w-full" size="sm">Start Exam</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          );
        })}

        {examList.length === 0 && (
          <div className="col-span-3 text-center py-16 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No exams available yet. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}
