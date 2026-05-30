import type { RatingLevel } from "@/lib/types";
import { RATING_COLORS } from "@/lib/types";

interface Props {
  rating: RatingLevel;
  size?: "sm" | "md" | "lg";
}

export default function RatingBadge({ rating, size = "sm" }: Props) {
  const colorClass = RATING_COLORS[rating];

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${colorClass} ${sizeClasses[size]}`}
    >
      {rating}
    </span>
  );
}
