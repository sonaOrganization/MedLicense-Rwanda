export interface ExamAnswer { id: string; text_en: string | null; text_fr?: string | null; is_correct: boolean; order: number; }
export interface ExamQuestion { id: string; text_en: string | null; text_fr?: string | null; image_url?: string | null; difficulty: string; explanation_en?: string | null; explanation_fr?: string | null; answers: ExamAnswer[]; }
export interface TheorySnapshot { id: string; title_en: string; title_fr?: string | null; duration_minutes: number; passing_score: number; negative_marking: boolean; shuffle_questions: boolean; shuffle_answers: boolean; questions: ExamQuestion[]; }
export interface PracticalSubquestion { id: string; prompt_en: string; prompt_fr?: string | null; model_answer_en: string; model_answer_fr?: string | null; order: number; }
export interface PracticalGroup { id: string; stem_en: string; stem_fr?: string | null; image_url?: string | null; order: number; subquestions: PracticalSubquestion[]; }
export interface PracticalSnapshot { id: string; title_en: string; title_fr?: string | null; groups: PracticalGroup[]; }
export interface TheoryState { answers?: Record<string, string | null>; flagged?: Record<string, boolean>; currentIndex?: number; }
export interface PracticalState { answers?: Record<string, boolean>; groupIndex?: number; subIndex?: number; }
export interface StartedAttempt<T, S = TheoryState | PracticalState> { id: string; exam_snapshot: T; started_at: string; deadline_at?: string; saved_revision: number; remaining_seconds?: number; saved_state: S | null; error?: string; }
