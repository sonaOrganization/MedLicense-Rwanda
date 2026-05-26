import { Trophy, Medal } from "lucide-react";

interface Performer {
  rank: number;
  name: string;
  score: number;
  exams: number;
  isCurrentUser?: boolean;
}

interface TopPerformersProps {
  performers: Performer[];
  currentUserRank?: number;
}

export function TopPerformers({ performers, currentUserRank }: TopPerformersProps) {
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-2.5">
      {performers.length === 0 ? (
        <div className="text-center py-6">
          <Trophy className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Be the first to top the leaderboard!</p>
        </div>
      ) : (
        performers.map(({ rank, name, score, exams, isCurrentUser }) => (
          <div
            key={rank}
            className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
              isCurrentUser
                ? "bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800"
                : "hover:bg-gray-50 dark:hover:bg-gray-800/40"
            }`}
          >
            <div className="w-7 text-center flex-shrink-0">
              {rank <= 3 ? (
                <span className="text-lg">{medals[rank - 1]}</span>
              ) : (
                <span className="text-sm font-bold text-gray-400">#{rank}</span>
              )}
            </div>

            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
              {name[0].toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${isCurrentUser ? "text-indigo-700 dark:text-indigo-300" : "text-gray-900 dark:text-white"}`}>
                {isCurrentUser ? `${name} (You)` : name}
              </p>
              <p className="text-xs text-gray-400">{exams} exams</p>
            </div>

            <div className="text-right flex-shrink-0">
              <span className="text-sm font-bold text-gray-900 dark:text-white">{score}%</span>
            </div>
          </div>
        ))
      )}

      {currentUserRank && currentUserRank > 5 && (
        <div className="pt-1 border-t border-dashed border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-400 text-center">Your rank: <span className="font-bold text-indigo-600 dark:text-indigo-400">#{currentUserRank}</span></p>
        </div>
      )}
    </div>
  );
}
