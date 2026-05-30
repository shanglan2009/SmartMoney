import type { RatingLevel } from "@/lib/types";

interface Props {
  score: number;
  rating: RatingLevel;
}

const ratingColors: Record<string, string> = {
  "强烈推荐": "#047857",
  "买入": "#16a34a",
  "增持": "#0d9488",
  "持有": "#64748b",
  "中性": "#d97706",
  "减持": "#ea580c",
  "卖出": "#dc2626",
};

export default function ScoreGauge({ score, rating }: Props) {
  const color = ratingColors[rating] || "#64748b";
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (score / 100) * circumference;

  const getLabel = (s: number) => {
    if (s >= 85) return "全球供应链核心节点";
    if (s >= 70) return "国际分工深入参与";
    if (s >= 55) return "供应链地位较强";
    if (s >= 40) return "国际业务发展中";
    if (s >= 25) return "国际化程度偏低";
    if (s >= 10) return "国内业务为主";
    return "需关注转型进展";
  };

  return (
    <div className="rounded-lg border border-rule bg-panel p-4 flex flex-col items-center">
      <span className="text-xs font-medium text-muted uppercase tracking-wide mb-2">国际供应链评分</span>
      <div className="relative flex items-center justify-center">
        <svg width="120" height="120" className="-rotate-90">
          <circle cx="60" cy="60" r="42" fill="none" stroke="#f1f5f9" strokeWidth="8" />
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
          <span className="text-3xl font-bold" style={{ color }}>{score}</span>
          <span className="text-[10px] text-muted">/100</span>
        </div>
      </div>
      <p className="text-xs text-muted mt-2">{getLabel(score)}</p>
    </div>
  );
}
