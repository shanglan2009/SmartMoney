import type { RatingLevel } from "@/lib/types";
import { RATING_ORDER } from "@/lib/types";

interface Props {
  history: { date: string; rating: RatingLevel }[];
}

const ratingDotColors: Record<string, string> = {
  "强烈推荐": "#047857",
  "买入": "#16a34a",
  "增持": "#0d9488",
  "持有": "#64748b",
  "中性": "#d97706",
  "减持": "#ea580c",
  "卖出": "#dc2626",
};

export default function RatingHistory({ history }: Props) {
  if (!history || history.length === 0) {
    return <p className="text-sm text-muted text-center py-4">暂无评级历史</p>;
  }

  const sorted = [...history].reverse();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1 text-[10px] text-muted mb-1 flex-wrap">
        {RATING_ORDER.map((r) => (
          <span key={r} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ratingDotColors[r] || "#94a3b8" }} />
            {r}
          </span>
        ))}
      </div>

      <div className="relative">
        <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-rule" />

        <div className="space-y-3">
          {sorted.map((item, i) => (
            <div key={i} className="flex items-center gap-3 relative">
              <div
                className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm shrink-0 z-10"
                style={{ backgroundColor: ratingDotColors[item.rating] || "#94a3b8" }}
              />
              <div className="flex-1 flex justify-between items-center min-w-0">
                <span className="text-sm text-ink font-medium">{item.rating}</span>
                <span className="text-xs text-muted">{item.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
