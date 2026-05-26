import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Edit, Trash2 } from "lucide-react";

interface Props { searchParams: Promise<{ category?: string; approved?: string }> }

export default async function AdminQuestionsPage({ searchParams }: Props) {
  const { category, approved } = await searchParams;

  const questions = await prisma.question.findMany({
    where: {
      AND: [
        category ? { categoryId: category } : {},
        approved !== undefined ? { isApproved: approved === "true" } : {},
      ],
    },
    include: { category: true, answers: true, _count: { select: { answers: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const categories = await prisma.category.findMany();

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Question Bank</h1>
        <Link href="/admin/questions/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Add Question
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-3">
        <select name="category" defaultValue={category ?? ""} className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.nameEn}</option>)}
        </select>
        <select name="approved" defaultValue={approved ?? ""} className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          <option value="">All Status</option>
          <option value="true">Approved</option>
          <option value="false">Pending</option>
        </select>
        <Button type="submit" size="sm" variant="outline">Filter</Button>
      </form>

      <div className="space-y-3">
        {questions.map((q) => (
          <Card key={q.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge variant="info">{q.category.nameEn}</Badge>
                    <Badge variant={q.difficulty === "EASY" ? "success" : q.difficulty === "HARD" ? "danger" : "warning"}>{q.difficulty}</Badge>
                    <Badge variant={q.isApproved ? "success" : "warning"}>{q.isApproved ? "Approved" : "Pending"}</Badge>
                  </div>
                  <p className="text-sm text-gray-900 dark:text-white font-medium line-clamp-2">{q.textEn}</p>
                  <p className="text-xs text-gray-400 mt-1">{q._count.answers} answers</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {questions.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p>No questions found. Add your first question!</p>
          </div>
        )}
      </div>
    </div>
  );
}
