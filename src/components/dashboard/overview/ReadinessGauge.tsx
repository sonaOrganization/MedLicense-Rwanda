"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ReadinessGaugeProps {
  score: number;
  examsTaken: number;
  avgScore: number;
}

export function ReadinessGauge({ score, examsTaken, avgScore }: ReadinessGaugeProps) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(score), 300);
    return () => clearTimeout(timer);
  }, [score]);

  const getLabel = (s: number) => {
    if (s >= 85) return { label: "Exam Ready", color: "#10b981", bg: "from-emerald-500 to-green-400" };
    if (s >= 70) return { label: "Almost Ready", color: "#f59e0b", bg: "from-yellow-500 to-amber-400" };
    if (s >= 50) return { label: "Keep Practicing", color: "#f97316", bg: "from-orange-500 to-amber-400" };
    return { label: "Just Starting", color: "#6366f1", bg: "from-indigo-500 to-purple-400" };
  };

  const { label, color, bg } = getLabel(score);
  const circumference = 2 * Math.PI * 54;
  const dashoffset = circumference - (animated / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center h-full py-6">
      {/* SVG Gauge */}
      <div className="relative w-40 h-40">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          {/* Track */}
          <circle cx="60" cy="60" r="54" fill="none" strokeWidth="10"
            className="stroke-gray-100 dark:stroke-gray-700" />
          {/* Progress */}
          <circle cx="60" cy="60" r="54" fill="none" strokeWidth="10"
            stroke={color}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-gray-900 dark:text-white">{score}</span>
          <span className="text-xs text-gray-400 font-medium">/ 100</span>
        </div>
      </div>

      {/* Label */}
      <div className={`mt-4 px-4 py-1 rounded-full text-sm font-semibold text-white bg-gradient-to-r ${bg}`}>
        {label}
      </div>

      {/* Mini stats */}
      <div className="flex gap-6 mt-5">
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900 dark:text-white">{examsTaken}</div>
          <div className="text-xs text-gray-400">Exams Taken</div>
        </div>
        <div className="w-px bg-gray-200 dark:bg-gray-700" />
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900 dark:text-white">{avgScore}%</div>
          <div className="text-xs text-gray-400">Avg Score</div>
        </div>
      </div>
    </div>
  );
}
