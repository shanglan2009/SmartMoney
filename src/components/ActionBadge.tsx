interface Props {
  action: string;
}

const actionStyles: Record<string, string> = {
  "积极加仓": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "适合买入": "bg-green-50 text-green-600 border-green-200",
  "持有观望": "bg-slate-50 text-slate-500 border-slate-200",
  "减仓": "bg-amber-50 text-amber-600 border-amber-200",
  "强烈卖出": "bg-red-50 text-red-600 border-red-200",
};

const actionIcons: Record<string, string> = {
  "积极加仓": "🚀",
  "适合买入": "✅",
  "持有观望": "⏸️",
  "减仓": "⚠️",
  "强烈卖出": "🔴",
};

export default function ActionBadge({ action }: Props) {
  if (!action) return null;

  const style = actionStyles[action] || "bg-slate-50 text-slate-500 border-slate-200";
  const icon = actionIcons[action] || "";

  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded-full border ${style}`}>
      {icon && <span>{icon}</span>}
      {action}
    </span>
  );
}
