import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, FileText, Star, Lock } from "lucide-react";

export default async function ExamsPage() {
  const session = await auth();
  const subscription = await prisma.subscription.findUnique({ where: { userId: session!.user.id } });
  const isPremium = subscription?.status === "ACTIVE" || subscription?.status === "TRIAL";

  const exams = await prisma.exam.findMany({
    where: { isPublished: true },
    include: { category: true, _count: { select: { questions: true, attempts: true } } },
    orderBy: { createdAt: "desc" },
  });

  const categories = await prisma.category.findMany();

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mock Exams</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Choose an exam to start practicing</p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button className="px-3 py-1.5 rounded-full text-sm font-medium bg-indigo-600 text-white">All</button>
        {categories.map((cat) => (
          <button key={cat.id} className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 transition-colors">
            {cat.nameEn}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {exams.map((exam) => {
          const locked = !exam.isFree && !isPremium;
          return (
            <Card key={exam.id} className={locked ? "opacity-80" : ""}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="info">{exam.category.nameEn}</Badge>
                  {exam.isFree ? (
                    <Badge variant="success">Free</Badge>
                  ) : locked ? (
                    <Lock className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{exam.titleEn}</h3>
                {exam.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{exam.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                  <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {exam._count.questions} questions</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {exam.durationMinutes} min</span>
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

        {exams.length === 0 && (
          <div className="col-span-3 text-center py-16 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No exams available yet. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}
