import type { RiskEvent } from "@/lib/types";

interface Props {
  events: RiskEvent[];
}

const impactColors: Record<string, string> = {
  high: "border-l-red-500 bg-red-50",
  medium: "border-l-amber-400 bg-amber-50",
  low: "border-l-blue-400 bg-blue-50",
};

const impactLabel: Record<string, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

export default function RiskEvents({ events }: Props) {
  if (events.length === 0) {
    return <p className="text-sm text-muted text-center py-4">暂无近期风险事件</p>;
  }

  return (
    <div className="space-y-2">
      {events.map((evt, i) => (
        <div
          key={i}
          className={`border-l-2 pl-3 py-2 rounded-r-md ${impactColors[evt.impact]}`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted">{evt.date}</span>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
              evt.impact === "high" ? "bg-red-200 text-red-700" :
              evt.impact === "medium" ? "bg-amber-200 text-amber-700" :
              "bg-blue-200 text-blue-700"
            }`}>
              {impactLabel[evt.impact]} {evt.type}
            </span>
          </div>
          <p className="text-sm text-ink-2">{evt.title}</p>
        </div>
      ))}
    </div>
  );
}
