import type { Supplier } from "@/lib/types";

interface Props {
  suppliers: Supplier[];
}

export default function SupplierTable({ suppliers }: Props) {
  const totalRatio = suppliers.reduce((s, sup) => s + sup.ratio, 0);

  const healthColor = (health?: string) => {
    switch (health) {
      case "healthy": return "text-green-600 bg-green-50";
      case "risky": return "text-red-600 bg-red-50";
      default: return "text-amber-400 bg-amber-50";
    }
  };

  const healthLabel = (health?: string) => {
    switch (health) {
      case "healthy": return "健康";
      case "risky": return "风险";
      default: return "正常";
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-muted border-b border-rule">
            <th className="text-left py-2 pr-2 font-medium">供应商名称</th>
            <th className="text-left py-2 px-2 font-medium">行业</th>
            <th className="text-right py-2 px-2 font-medium">采购占比</th>
            <th className="text-center py-2 px-2 font-medium">财务健康</th>
            <th className="text-right py-2 pl-2 font-medium">上市代码</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-rule">
          {suppliers.map((sup) => (
            <tr key={sup.id} className="hover:bg-paper-3 transition-colors">
              <td className="py-2.5 pr-2">
                <span className="font-medium text-ink">{sup.name}</span>
              </td>
              <td className="py-2.5 px-2">
                <span className="text-ink-2">{sup.industry}</span>
              </td>
              <td className="py-2.5 px-2 text-right">
                <div className="flex items-center justify-end gap-2">
                  <div className="w-16 h-1.5 bg-paper-3 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${sup.ratio * 100}%`,
                        backgroundColor: sup.ratio > 0.2 ? "#dc2626" : sup.ratio > 0.1 ? "#d97706" : "#16a34a",
                      }}
                    />
                  </div>
                  <span className="font-mono text-xs text-ink-2">{(sup.ratio * 100).toFixed(1)}%</span>
                </div>
              </td>
              <td className="py-2.5 px-2 text-center">
                <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${healthColor(sup.financialHealth)}`}>
                  {healthLabel(sup.financialHealth)}
                </span>
              </td>
              <td className="py-2.5 pl-2 text-right">
                <span className="font-mono text-xs text-muted">
                  {sup.isListed ? (sup.listedCode || "—") : "非上市"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 text-xs text-muted flex justify-between">
        <span>前 {suppliers.length} 大供应商合计占比</span>
        <span className="font-semibold text-ink">{(totalRatio * 100).toFixed(1)}%</span>
      </div>
    </div>
  );
}
