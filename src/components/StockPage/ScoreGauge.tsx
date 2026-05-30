import type { RatingLevel } from "@/lib/types";

interface Props {
  score: number;
  rating: RatingLevel;
}

const ratingColors: Record<RatingLevel, string> = {
  "高风险观察": "#dc2626",
  "高风险偏多": "#d97706",
  "观察": "#1d4ed8",
  "积极观察": "#16a34a",
  "谨慎": "#7c3aed",
};

export default function ScoreGauge({ score, rating }: Props) {
  const color = ratingColors[rating];
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="rounded-lg border border-rule bg-panel p-4 flex flex-col items-center">
      <span className="text-xs font-medium text-muted uppercase tracking-wide mb-2">供应链稀缺度评分</span>
      <div className="relative flex items-center justify-center">
        <svg width="120" height="120" className="-rotate-90">
          {/* Background circle */}
          <circle
            cx="60" cy="60" r="42"
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="8"
          />
          {/* Score circle */}
          <circle
            cx="60" cy="60" r="42"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-3xl font-bold" style={{ color }}>
            {score}
          </span>
          <span className="text-[10px] text-muted">/100</span>
        </div>
      </div>
      <p className="text-xs text-muted mt-2">
        {score >= 85 ? "供应风险极高" :
         score >= 70 ? "供应风险较高" :
         score >= 40 ? "供应风险中等" :
         score >= 20 ? "供应风险较低" :
         "供应链健康"}
      </p>
    </div>
  );
}
