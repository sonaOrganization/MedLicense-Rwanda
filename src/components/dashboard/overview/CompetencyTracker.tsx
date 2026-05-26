import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface CompetencyItem {
  name: string;
  nameFr: string;
  score: number;
  attempts: number;
  trend: "up" | "down" | "neutral";
  icon: string;
}

interface CompetencyTrackerProps {
  data: CompetencyItem[];
}

// Rwanda RMDC core competency areas
const CORE_COMPETENCIES = [
  { slug: "anatomy", name: "Anatomy", nameFr: "Anatomie", icon: "🫀" },
  { slug: "physiology", name: "Physiology", nameFr: "Physiologie", icon: "🧬" },
  { slug: "pharmacology", name: "Pharmacology", nameFr: "Pharmacologie", icon: "💊" },
  { slug: "pathology", name: "Pathology", nameFr: "Pathologie", icon: "🔬" },
  { slug: "clinical-medicine", name: "Clinical Medicine", nameFr: "Médecine Clinique", icon: "🏥" },
  { slug: "public-health", name: "Public Health", nameFr: "Santé Publique", icon: "🌍" },
];

export function CompetencyTracker({ data }: CompetencyTrackerProps) {
  const getBar = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 65) return "bg-yellow-400";
    if (score >= 50) return "bg-orange-400";
    return "bg-red-400";
  };

  const getStatus = (score: number) => {
    if (score >= 80) return { label: "Strong", color: "text-emerald-600 dark:text-emerald-400" };
    if (score >= 65) return { label: "Good", color: "text-yellow-600 dark:text-yellow-400" };
    if (score >= 50) return { label: "Fair", color: "text-orange-600 dark:text-orange-400" };
    return { label: "Needs Work", color: "text-red-500" };
  };

  // Merge with core competencies to show all (even unstudied ones)
  const merged = CORE_COMPETENCIES.map((comp) => {
    const found = data.find((d) => d.name.toLowerCase().includes(comp.slug.replace("-", " ")) ||
      comp.name.toLowerCase().includes(d.name.toLowerCase().split(" ")[0]));
    return {
      ...comp,
      score: found?.score ?? 0,
      attempts: found?.attempts ?? 0,
      trend: found?.trend ?? "neutral" as const,
    };
  });

  return (
    <div className="space-y-3">
      {merged.map(({ name, nameFr, icon, score, attempts, trend }) => {
        const { label, color } = getStatus(score);
        return (
          <div key={name} className="flex items-center gap-3 group">
            <span className="text-xl w-7 flex-shrink-0">{icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{name}</span>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  {trend === "up" && <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />}
                  {trend === "down" && <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
                  {trend === "neutral" && attempts > 0 && <Minus className="w-3.5 h-3.5 text-gray-400" />}
                  <span className={cn("text-xs font-semibold", score > 0 ? color : "text-gray-400")}>
                    {score > 0 ? `${score}%` : "Not started"}
                  </span>
                </div>
              </div>
              <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-700", score > 0 ? getBar(score) : "bg-gray-200 dark:bg-gray-700")}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
