export type UserRole = "STUDENT" | "INSTRUCTOR" | "ADMIN";

export type SubscriptionPlan = {
  id: string;
  name: string;
  price: number;
  currency: string;
  duration: number;
  features: string[];
  popular?: boolean;
};

export type ExamQuestion = {
  id: string;
  textEn: string;
  textFr?: string;
  imageUrl?: string;
  difficulty: string;
  answers: {
    id: string;
    textEn: string;
    textFr?: string;
  }[];
  isFlagged?: boolean;
  selectedAnswerId?: string;
};

export type ExamState = {
  examId: string;
  currentIndex: number;
  answers: Record<string, string | null>;
  flagged: Record<string, boolean>;
  startedAt: number;
  timeLeft: number;
};

export type ExamResult = {
  score: number;
  correct: number;
  wrong: number;
  skipped: number;
  total: number;
  timeTaken: number;
  passed: boolean;
  passingScore: number;
};

export type StatsCard = {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  icon: string;
};

export type NavItem = {
  label: string;
  href: string;
  icon?: string;
  badge?: string | number;
};
