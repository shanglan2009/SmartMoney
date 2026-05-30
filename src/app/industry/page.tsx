"use client";

import { useMemo } from "react";
import Link from "next/link";
import { getStockList } from "@/lib/mockData";

const industryData = [
  { name: "芯片/半导体", color: "bg-blue-50 border-blue-200 text-blue-700", stocks: ["688981", "002371", "688041", "688256", "300661", "603986"] },
  { name: "AI/算力", color: "bg-violet-50 border-violet-200 text-violet-700", stocks: ["300308", "300502", "000977", "603019", "002230"] },
  { name: "储能/锂电池", color: "bg-emerald-50 border-emerald-200 text-emerald-800", stocks: ["300750", "300274", "002074"] },
  { name: "电力", color: "bg-amber-50 border-amber-200 text-amber-700", stocks: ["600900", "601985", "600406"] },
  { name: "机器人/高端制造", color: "bg-red-50 border-red-200 text-red-700", stocks: ["002594", "300124", "688169", "601727", "601138"] },
];

export default function IndustryPage() {
  const allStocks = useMemo(() => getStockList(), []);

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink mb-4">行业供应链风险分布</h1>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {industryData.map((ind) => {
          const stocks = allStocks.filter((s) => ind.stocks.includes(s.code));
          const avgScore = stocks.reduce((sum, s) => sum + s.score, 0) / stocks.length;
          const highRiskCount = stocks.filter((s) => s.rating === "减持" || s.rating === "卖出").length;

          return (
            <div key={ind.name} className="rounded-lg border border-rule bg-panel p-4">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-sm font-semibold px-2 py-1 rounded-md border ${ind.color}`}>
                  {ind.name}
                </span>
                <span className="text-xs text-muted">{stocks.length} 只标的</span>
              </div>

              <div className="flex items-center gap-4 mb-3">
                <div>
                  <span className="text-xs text-muted">平均稀缺度</span>
                  <p className={`text-lg font-semibold ${
                    avgScore >= 70 ? "text-red-600" : avgScore >= 40 ? "text-amber-400" : "text-green-600"
                  }`}>
                    {avgScore.toFixed(0)}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted">高风险数量</span>
                  <p className="text-lg font-semibold text-red-600">{highRiskCount}</p>
                </div>
                <div className="flex-1">
                  <div className="h-2 bg-paper-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        avgScore >= 70 ? "bg-red-500" : avgScore >= 40 ? "bg-amber-400" : "bg-green-500"
                      }`}
                      style={{ width: `${avgScore}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                {stocks.map((s) => (
                  <Link key={s.code} href={`/stock/${s.code}`} className="flex items-center justify-between py-1 hover:bg-paper-3 px-2 rounded transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-xs text-muted">{s.code}</span>
                      <span className="text-sm text-ink truncate">{s.name}</span>
                    </div>
                    <span className={`text-xs font-medium ${
                      s.score >= 70 ? "text-red-600" : s.score >= 40 ? "text-amber-400" : "text-green-600"
                    }`}>
                      {s.score}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
