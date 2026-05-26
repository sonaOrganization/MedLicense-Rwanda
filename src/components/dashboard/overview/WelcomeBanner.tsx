import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Flame } from "lucide-react";

interface WelcomeBannerProps {
  name: string;
  streak: number;
  subscriptionStatus: string;
}

const motivations = [
  "Rwanda's health system needs you. Every question you master brings you closer to serving your community.",
  "Vision 2050: A healthy, prosperous Rwanda. Your license is the first step toward that vision.",
  "Be among the healthcare heroes building Rwanda's tomorrow. Keep pushing forward.",
  "The patients of Kigali, Musanze, Huye and beyond are waiting for skilled professionals like you.",
];

export function WelcomeBanner({ name, streak, subscriptionStatus }: WelcomeBannerProps) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const quote = motivations[new Date().getDay() % motivations.length];
  const isPremium = subscriptionStatus === "ACTIVE" || subscriptionStatus === "TRIAL";

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-purple-700 text-white p-6 md:p-8">
      {/* Background decoration */}
      <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
      <div className="absolute right-20 bottom-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />

      {/* Rwanda flag stripe accent */}
      <div className="absolute top-0 left-0 right-0 h-1 flex">
        <div className="flex-1 bg-blue-400" />
        <div className="flex-[2] bg-yellow-400" />
        <div className="flex-1 bg-green-400" />
      </div>

      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <p className="text-indigo-200 text-sm font-medium">{greeting},</p>
            {streak > 0 && (
              <div className="flex items-center gap-1 bg-orange-500/30 border border-orange-400/40 rounded-full px-2.5 py-0.5 text-xs font-bold text-orange-200">
                <Flame className="w-3 h-3" />
                {streak} day streak
              </div>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Dr. {name} <span className="text-indigo-300 font-normal text-xl">(in progress)</span>
          </h1>
          <p className="text-indigo-200 text-sm leading-relaxed max-w-lg">{quote}</p>
        </div>

        <div className="flex flex-col gap-2 flex-shrink-0">
          <Link href="/exams">
            <Button className="bg-white text-indigo-700 hover:bg-indigo-50 gap-2 w-full">
              Start Exam <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          {!isPremium && (
            <Link href="/subscription">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 w-full text-xs">
                Unlock Full Access
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
