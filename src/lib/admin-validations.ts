import { z } from "zod";
const text = z.string().trim().max(20000).nullable().optional();
export const questionApiSchema = z.object({
  text_en: text, text_fr: text, explanation_en: text, explanation_fr: text,
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  category_id: z.string().min(1).max(100), language: z.enum(["EN", "FR"]).default("EN"),
  license_categories: z.array(z.string().min(1).max(100)).max(30).default([]),
  answers: z.array(z.object({ id: z.string().min(1).max(100).optional(), text_en: text, text_fr: text, is_correct: z.boolean() })).min(2).max(6),
}).superRefine((q, ctx) => {
  const field = q.language === "FR" ? "text_fr" : "text_en";
  if (!q[field]) ctx.addIssue({ code: "custom", message: "Question text is required in its primary language", path: [field] });
  if (q.answers.filter((a) => a.is_correct).length !== 1) ctx.addIssue({ code: "custom", message: "Exactly one answer must be correct", path: ["answers"] });
  q.answers.forEach((a, i) => { if (!a[field]) ctx.addIssue({ code: "custom", message: "Every answer requires text in the primary language", path: ["answers", i, field] }); });
  const ids = q.answers.flatMap((a) => a.id ? [a.id] : []);
  if (ids.length !== new Set(ids).size) ctx.addIssue({ code: "custom", message: "Duplicate answer IDs", path: ["answers"] });
});
export const examApiSchema = z.object({
  title_en: z.string().trim().min(1).max(500), description: text, category_id: z.string().max(100).nullable().optional(),
  license_category: z.string().trim().min(1, "Choose the license category this exam is for").max(100), target_language: z.enum(["EN", "FR"]).nullable().optional(),
  duration_minutes: z.coerce.number().int().min(1).max(240), passing_score: z.coerce.number().int().min(0).max(100),
  points_per_question: z.coerce.number().int().min(1).max(100).default(1),
  is_free: z.boolean().default(false), is_published: z.boolean().default(false),
  shuffle_questions: z.boolean().default(true), shuffle_answers: z.boolean().default(true),
  question_ids: z.array(z.string().min(1).max(100)).max(1000).default([]),
}).superRefine((e, ctx) => {
  if (new Set(e.question_ids).size !== e.question_ids.length) ctx.addIssue({ code: "custom", message: "Duplicate question IDs", path: ["question_ids"] });
  if (e.is_published && e.question_ids.length === 0) ctx.addIssue({ code: "custom", message: "Published exams need questions", path: ["question_ids"] });
});
