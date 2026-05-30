"use client";

import { Bell, AlertTriangle, TrendingUp, Package } from "lucide-react";

const alerts = [
  { id: 1, type: "原材料涨价", stock: "中芯国际", code: "688981", desc: "硅片价格季度上涨8%", date: "2026-05-20", severity: "high" },
  { id: 2, type: "进口受限", stock: "寒武纪", code: "688256", desc: "美国扩大AI芯片出口管制范围", date: "2026-05-18", severity: "high" },
  { id: 3, type: "供应短缺", stock: "中际旭创", code: "300308", desc: "EML光芯片供应短缺加剧", date: "2026-05-21", severity: "high" },
  { id: 4, type: "价格波动", stock: "宁德时代", code: "300750", desc: "碳酸锂价格反弹15%", date: "2026-05-22", severity: "medium" },
  { id: 5, type: "产能紧张", stock: "中芯国际", code: "688981", desc: "28nm产能利用率达98%", date: "2026-04-28", severity: "medium" },
];

export default function AlertsPage() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Bell className="h-5 w-5 text-ink" />
        <h1 className="text-xl font-semibold text-ink">供应链预警</h1>
      </div>

      <div className="space-y-2">
        {alerts.map((alert) => (
          <div key={alert.id} className="rounded-lg border border-rule bg-panel p-4 flex items-start gap-3">
            <div className={`mt-0.5 p-1.5 rounded-full ${
              alert.severity === "high" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-400"
            }`}>
              {alert.severity === "high" ? <AlertTriangle className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                  alert.severity === "high" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-400"
                }`}>
                  {alert.type}
                </span>
                <span className="text-xs text-muted">{alert.date}</span>
              </div>
              <p className="text-sm text-ink-2">{alert.desc}</p>
              <span className="text-xs text-muted mt-1 inline-block">
                {alert.stock} ({alert.code})
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
