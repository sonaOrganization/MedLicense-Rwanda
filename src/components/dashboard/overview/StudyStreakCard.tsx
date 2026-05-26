"use client";
import { Flame, Trophy, Star, Zap } from "lucide-react";

interface StudyStreakCardProps {
  streak: number;
  longestStreak: number;
  points: number;
  badges: number;
}

const milestones = [
  { days: 3, icon: "🌱", label: "Seedling" },
  { days: 7, icon: "⭐", label: "Rising Star" },
  { days: 14, icon: "🔥", label: "On Fire" },
  { days: 30, icon: "💎", label: "Diamond" },
  { days: 60, icon: "🏆", label: "Champion" },
  { days: 100, icon: "👑", label: "Legend" },
];

export function StudyStreakCard({ streak, longestStreak, points, badges }: StudyStreakCardProps) {
  const nextMilestone = milestones.find((m) => m.days > streak) ?? milestones[milestones.length - 1];
  const prevMilestone = [...milestones].reverse().find((m) => m.days <= streak);
  const progress = prevMilestone
    ? Math.min(100, ((streak - prevMilestone.days) / (nextMilestone.days - prevMilestone.days)) * 100)
    : (streak / nextMilestone.days) * 100;

  // Last 7 days activity (mock for now — would come from DB)
  const weekDays = ["M", "T", "W", "T", "F", "S", "S"];
  const activity = weekDays.map((_, i) => i < Math.min(streak, 7));

  return (
    <div className="space-y-5">
      {/* Streak hero */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-100 dark:bg-orange-900/30">
            <Flame className={`w-6 h-6 ${streak > 0 ? "text-orange-500" : "text-gray-400"}`} />
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{streak}</div>
            <div className="text-xs text-gray-400">Day streak</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900 dark:text-white">{longestStreak}</div>
          <div className="text-xs text-gray-400">Best streak</div>
        </div>
      </div>

      {/* Weekly activity dots */}
      <div>
        <p className="text-xs text-gray-400 mb-2">This week</p>
        <div className="flex gap-1.5">
          {weekDays.map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${
                activity[i]
                  ? "bg-orange-500 text-white font-bold"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-400"
              }`}>
                {activity[i] ? "✓" : ""}
              </div>
              <span className="text-xs text-gray-400">{day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Next milestone */}
      <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">Next milestone</span>
          <span className="text-lg">{nextMilestone.icon}</span>
        </div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{nextMilestone.label}</span>
          <span className="text-xs text-gray-400">{streak}/{nextMilestone.days} days</span>
        </div>
        <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-500 rounded-full transition-all duration-700"
            style={{ width: `${Math.max(2, progress)}%` }}
          />
        </div>
      </div>

      {/* Points & badges */}
      <div className="flex gap-3">
        <div className="flex-1 flex items-center gap-2 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20">
          <Zap className="w-4 h-4 text-indigo-500" />
          <div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{points}</div>
            <div className="text-xs text-gray-400">Points</div>
          </div>
        </div>
        <div className="flex-1 flex items-center gap-2 p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{badges}</div>
            <div className="text-xs text-gray-400">Badges</div>
          </div>
        </div>
      </div>
    </div>
  );
}
