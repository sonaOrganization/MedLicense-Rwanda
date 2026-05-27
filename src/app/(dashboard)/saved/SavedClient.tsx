"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";
import Link from "next/link";
import { useLanguage, t } from "@/lib/language";
import { useT } from "@/lib/translations";

interface SavedItem {
  question: {
    id: string;
    text_en: string;
    text_fr?: string | null;
    difficulty: string;
    explanation_en?: string | null;
    explanation_fr?: string | null;
    category: { name_en: string; name_fr?: string | null };
    answers: { id: string; text_en: string; text_fr?: string | null; is_correct: boolean }[];
  };
}

export function SavedClient({ savedList }: { savedList: SavedItem[] }) {
  const { language } = useLanguage();
  const T = useT(language);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{T("saved_title")}</h1>
        <span className="text-sm text-gray-400">{savedList.length} {T("saved_sub")}</span>
      </div>

      {savedList.length === 0 ? (
        <div className="text-center py-16">
          <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">{T("saved_empty")}</p>
          <Link href="/exams"><Button>{T("saved_go_exam")}</Button></Link>
        </div>
      ) : (
        <div className="space-y-4">
          {savedList.map(({ question }) => {
            const questionText = t(question.text_en, question.text_fr, language);
            const explanation = t(question.explanation_en, question.explanation_fr, language);
            const catName = t(question.category.name_en, question.category.name_fr, language);
            return (
              <Card key={question.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="info">{catName}</Badge>
                        <Badge variant={question.difficulty === "EASY" ? "success" : question.difficulty === "HARD" ? "danger" : "warning"}>
                          {question.difficulty}
                        </Badge>
                      </div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm mb-3">{questionText}</p>
                      <div className="space-y-1.5">
                        {question.answers.map((ans) => {
                          const ansText = t(ans.text_en, ans.text_fr, language);
                          return (
                            <div key={ans.id} className={`text-sm px-3 py-1.5 rounded-lg ${ans.is_correct ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300" : "text-gray-500 dark:text-gray-400"}`}>
                              {ans.is_correct && "✓ "}{ansText}
                            </div>
                          );
                        })}
                      </div>
                      {explanation && (
                        <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-sm text-indigo-700 dark:text-indigo-300">
                          <strong>{T("saved_explanation")}</strong> {explanation}
                        </div>
                      )}
                    </div>
                    <Bookmark className="w-5 h-5 text-indigo-500 flex-shrink-0 fill-indigo-500" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
