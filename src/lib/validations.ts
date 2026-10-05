import { z } from "zod";
import { LICENSE_CATEGORIES } from "./license-categories";

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().trim().email("Invalid email address").max(254),
    phone: z
      .string()
      .min(8, "Enter a valid phone number")
      .max(30)
      .regex(/^\+?[\d\s\-()]+$/, "Invalid phone number format"),
    licenseCategory: z.string().refine((value) => LICENSE_CATEGORIES.some((category) => category.id === value), "Please select a valid license category"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must be at most 72 characters")
      .refine((value) => new TextEncoder().encode(value).length <= 72, "Password is too long in UTF-8")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(254),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(254),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must be at most 72 characters")
      .refine((value) => new TextEncoder().encode(value).length <= 72, "Password is too long in UTF-8")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().trim().max(30).optional(),
  country: z.string().trim().max(100).optional(),
  language: z.enum(["EN", "FR"]),
});

export const questionSchema = z.object({
  textEn: z.string().min(10, "Question text is required"),
  textFr: z.string().optional(),
  type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_BLANK"]),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  categoryId: z.string().min(1, "Category is required"),
  explanationEn: z.string().optional(),
  explanationFr: z.string().optional(),
  answers: z
    .array(
      z.object({
        textEn: z.string().min(1, "Answer text is required"),
        textFr: z.string().optional(),
        isCorrect: z.boolean(),
      })
    )
    .min(2, "At least 2 answers required"),
});

export const feedbackSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  subject: z.string().min(3, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type QuestionInput = z.infer<typeof questionSchema>;
export type FeedbackInput = z.infer<typeof feedbackSchema>;
