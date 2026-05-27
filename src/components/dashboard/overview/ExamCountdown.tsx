"use client";
import { useState, useEffect } from "react";
import { Calendar, Clock } from "lucide-react";

// Rwanda license exam schedule (approximate)
const NEXT_EXAM_DATES = [
  { session: "Session 1 – 2026", date: new Date("2026-03-15"), type: "Written" },
  { session: "Session 2 – 2026", date: new Date("2026-07-20"), type: "Written" },
  { session: "Session 3 – 2026", date: new Date("2026-11-08"), type: "Written" },
];

function getNext() {
  const now = new Date();
  return NEXT_EXAM_DATES.find((e) => e.date > now) ?? NEXT_EXAM_DATES[NEXT_EXAM_DATES.length - 1];
}

export function ExamCountdown() {
  const [target] = useState(getNext);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0 });

  useEffect(() => {
    function calc() {
      const diff = target.date.getTime() - Date.now();
      if (diff <= 0) return setTimeLeft({ days: 0, hours: 0, mins: 0 });
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      setTimeLeft({ days, hours, mins });
    }
    calc();
    const id = setInterval(calc, 60000);
    return () => clearInterval(id);
  }, [target]);

  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-white">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-indigo-400" />
        <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wide">Next License Exam</span>
      </div>

      <p className="font-bold text-white mb-3">{target.session}</p>

      <div className="flex gap-2">
        {[
          { value: timeLeft.days, label: "Days" },
          { value: timeLeft.hours, label: "Hours" },
          { value: timeLeft.mins, label: "Mins" },
        ].map(({ value, label }) => (
          <div key={label} className="flex-1 bg-white/10 rounded-lg p-2 text-center">
            <div className="text-2xl font-bold text-white tabular-nums">{String(value).padStart(2, "0")}</div>
            <div className="text-xs text-slate-400">{label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-400">
        <Clock className="w-3.5 h-3.5" />
        {target.type} examination · Keep studying!
      </div>
    </div>
  );
}
