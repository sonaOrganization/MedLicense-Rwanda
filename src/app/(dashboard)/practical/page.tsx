"use client";
import Link from "next/link";
import { Stethoscope, Clock } from "lucide-react";
import { useLanguage } from "@/lib/language";
import { useT } from "@/lib/translations";

export default function PracticalPage() {
  const { language } = useLanguage();
  const T = useT(language);

  return (
    <div className="max-w-2xl">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{T("practical_title")}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{T("practical_sub")}</p>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/80 p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
          <Stethoscope className="w-7 h-7 text-amber-500" />
        </div>
        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mb-3">
          <Clock className="w-3 h-3" /> {T("practical_coming_title")}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed mb-6">
          {T("practical_coming_desc")}
        </p>
        <Link
          href="/exams"
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 transition-colors"
        >
          {T("practical_cta_theory")}
        </Link>
      </div>
    </div>
  );
}
