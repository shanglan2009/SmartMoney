import type { RatingLevel } from "@/lib/globalScoring";

interface Props {
  rating: RatingLevel;
  size?: "sm" | "md" | "lg";
}

const styles: Record<RatingLevel, string> = {
  "强烈推荐": "bg-emerald-50 text-emerald-700 border-emerald-300",
  "买入": "bg-green-50 text-green-600 border-green-300",
  "增持": "bg-teal-50 text-teal-600 border-teal-300",
  "持有": "bg-slate-50 text-slate-600 border-slate-300",
  "中性": "bg-amber-50 text-amber-500 border-amber-300",
  "减持": "bg-orange-50 text-orange-600 border-orange-300",
  "卖出": "bg-red-50 text-red-600 border-red-300",
};

const sizeClasses = {
  sm: "px-1.5 py-0.5 text-[10px]",
  md: "px-2 py-0.5 text-xs",
  lg: "px-2.5 py-1 text-sm",
};

const icons: Record<string, string> = {
  "强烈推荐": "🟢",
  "买入": "✅",
  "增持": "📈",
  "持有": "⏸️",
  "中性": "⚖️",
  "减持": "⬇️",
  "卖出": "🔴",
};

export default function RatingBadge({ rating, size = "sm" }: Props) {
  const style = styles[rating] || styles["持有"];
  const icon = icons[rating] || "";
  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-full border ${style} ${sizeClasses[size]}`}>
      <span>{icon}</span>
      {rating}
    </span>
  );
}
