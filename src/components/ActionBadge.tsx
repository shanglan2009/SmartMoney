const actionColors: Record<string, string> = {
  "全球龙头·强烈推荐": "bg-emerald-50 text-emerald-700 border-emerald-300",
  "强烈推荐": "bg-emerald-50 text-emerald-700 border-emerald-300",
  "建议买入·重点配置": "bg-green-50 text-green-600 border-green-300",
  "建议增持·逐步加仓": "bg-teal-50 text-teal-600 border-teal-300",
  "建议持有·观望等待": "bg-slate-50 text-slate-600 border-slate-300",
  "中性·等待催化剂": "bg-amber-50 text-amber-500 border-amber-300",
  "建议减持·降低仓位": "bg-orange-50 text-orange-600 border-orange-300",
  "建议卖出·清仓回避": "bg-red-50 text-red-600 border-red-300",
};

export default function ActionBadge({ action }: { action: string }) {
  if (!action) return null;
  const style = actionColors[action] || actionColors["建议持有·观望等待"];
  const color = action.includes("强烈") ? "text-emerald-700" 
    : action.includes("买入") || action.includes("增持") ? "text-green-600"
    : action.includes("减持") || action.includes("卖出") ? "text-red-600"
    : action.includes("中性") ? "text-amber-500"
    : "text-slate-600";

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded-full border ${style}`}>
      {action}
    </span>
  );
}
