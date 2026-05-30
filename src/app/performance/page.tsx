"use client";

import { useState, useEffect, useMemo } from "react";
import { TrendingUp, TrendingDown, Activity, BarChart3, RefreshCw } from "lucide-react";
import { loadPortfolio } from "@/lib/portfolioStore";

interface RatingStat {
  rating: string;
  count: number;
  avgScore: number;
}

export default function PerformancePage() {
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [portfolioStats, setPortfolioStats] = useState({ holdings: 0, totalPL: 0, totalPLPercent: 0 });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/scores", { signal: AbortSignal.timeout(10000) });
        const data = await res.json();
        const list = data.stocks || [];
        setStocks(list);

        // 读取组合数据
        const pf = loadPortfolio();
        const holdingCount = Object.keys(pf.holdings).length;
        const totalMarketValue = Object.values(pf.holdings).reduce(
          (sum: number, h: any) => sum + (list.find((s: any) => s.code === h.code)?.price || 0) * h.shares,
          0
        );
        const totalPL = (totalMarketValue + pf.cash) - pf.totalDeposited;
        const totalPLPercent = pf.totalDeposited > 0 ? (totalPL / pf.totalDeposited) * 100 : 0;
        setPortfolioStats({
          holdings: holdingCount,
          totalPL: Math.round(totalPL * 100) / 100,
          totalPLPercent: Math.round(totalPLPercent * 100) / 100,
        });
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  // 评级分布
  const ratingStats = useMemo(() => {
    const map: Record<string, { count: number; totalScore: number }> = {};
    stocks.forEach((s) => {
      if (!map[s.rating]) map[s.rating] = { count: 0, totalScore: 0 };
      map[s.rating].count++;
      map[s.rating].totalScore += s.score || 0;
    });
    const order = ["高风险观察", "高风险偏多", "观察", "积极观察", "谨慎"];
    return order
      .filter((r) => map[r])
      .map((r) => ({
        rating: r,
        count: map[r].count,
        avgScore: Math.round((map[r].totalScore / map[r].count) * 10) / 10,
      }));
  }, [stocks]);

  // 行业分布
  const industryStats = useMemo(() => {
    const map: Record<string, number> = {};
    stocks.forEach((s) => {
      const cat = s.category || "其他";
      map[cat] = (map[cat] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [stocks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted animate-pulse">
        正在加载数据...
      </div>
    );
  }

  const totalStocks = stocks.length;
  const highRisk = stocks.filter((s) => s.rating === "高风险观察" || s.rating === "高风险偏多").length;
  const positive = stocks.filter((s) => s.rating === "积极观察" || s.rating === "谨慎").length;

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink mb-4">模型战绩</h1>

      {/* 核心指标 */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <div className="rounded-lg border border-rule bg-panel p-4">
          <span className="text-xs text-muted uppercase tracking-wide font-medium">覆盖标的</span>
          <p className="text-3xl font-bold text-blue-400 mt-1">{totalStocks}</p>
          <p className="text-xs text-muted mt-1">8大行业持续跟踪</p>
        </div>
        <div className="rounded-lg border border-rule bg-panel p-4">
          <span className="text-xs text-muted uppercase tracking-wide font-medium">高风险标的</span>
          <p className="text-3xl font-bold text-red-600 mt-1">{highRisk}</p>
          <p className="text-xs text-muted mt-1">高风险偏多 / 高风险观察</p>
        </div>
        <div className="rounded-lg border border-rule bg-panel p-4">
          <span className="text-xs text-muted uppercase tracking-wide font-medium">积极观察 / 谨慎</span>
          <p className="text-3xl font-bold text-green-600 mt-1">{positive}</p>
          <p className="text-xs text-muted mt-1">供应链相对健康的标的</p>
        </div>
        <div className="rounded-lg border border-rule bg-panel p-4">
          <span className="text-xs text-muted uppercase tracking-wide font-medium">模拟组合盈亏</span>
          <p className={`text-3xl font-bold mt-1 ${portfolioStats.totalPL >= 0 ? "text-green-600" : "text-red-600"}`}>
            {portfolioStats.totalPL > 0 ? "+" : ""}{portfolioStats.totalPLPercent.toFixed(1)}%
          </p>
          <p className="text-xs text-muted mt-1">
            {portfolioStats.holdings} 只持仓 · {portfolioStats.totalPL > 0 ? "+" : ""}¥{portfolioStats.totalPL.toFixed(0)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        {/* 评级分布 */}
        <div className="rounded-lg border border-rule bg-panel p-4">
          <h3 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted" />
            评级分布（共 {totalStocks} 只）
          </h3>
          <div className="space-y-2">
            {ratingStats.map((r) => {
              const pct = (r.count / totalStocks) * 100;
              const colors: Record<string, string> = {
                "高风险观察": "bg-red-500",
                "高风险偏多": "bg-amber-400",
                "观察": "bg-blue-400",
                "积极观察": "bg-green-500",
                "谨慎": "bg-emerald-800",
              };
              const textColors: Record<string, string> = {
                "高风险观察": "text-red-700",
                "高风险偏多": "text-amber-700",
                "观察": "text-blue-700",
                "积极观察": "text-green-700",
                "谨慎": "text-emerald-800",
              };
              return (
                <div key={r.rating} className="flex items-center gap-3">
                  <span className={`text-xs font-medium w-24 ${textColors[r.rating] || "text-ink"}`}>
                    {r.rating}
                  </span>
                  <div className="flex-1 h-5 bg-paper-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colors[r.rating] || "bg-slate-400"} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-ink-2 w-16 text-right">
                    {r.count} 只
                  </span>
                  <span className="text-xs font-mono text-muted w-12 text-right">
                    {r.avgScore}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 行业分布 */}
        <div className="rounded-lg border border-rule bg-panel p-4">
          <h3 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted" />
            行业分布
          </h3>
          <div className="space-y-2">
            {industryStats.map((ind) => {
              const pct = (ind.count / totalStocks) * 100;
              const colors = ["bg-blue-400", "bg-violet-400", "bg-emerald-500", "bg-amber-400", "bg-red-400"];
              return (
                <div key={ind.name} className="flex items-center gap-3">
                  <span className="text-xs font-medium w-20 text-ink-2">{ind.name}</span>
                  <div className="flex-1 h-5 bg-paper-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colors[industryStats.indexOf(ind) % colors.length]} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-ink-2 w-12 text-right">
                    {ind.count} 只
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 评分分布明细 */}
      <div className="rounded-lg border border-rule bg-panel overflow-hidden">
        <div className="px-4 py-3 text-xs font-medium text-muted uppercase tracking-wide border-b border-rule bg-paper-2 flex items-center justify-between">
          <span>全市场评分分布</span>
          <span className="text-[10px] text-muted">实时数据 · 评分范围 0-100</span>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {[
              { range: "0-19", label: "谨慎", color: "bg-emerald-800", stocks: stocks.filter((s) => s.score < 20) },
              { range: "20-39", label: "积极观察", color: "bg-green-500", stocks: stocks.filter((s) => s.score >= 20 && s.score < 40) },
              { range: "40-69", label: "观察", color: "bg-blue-400", stocks: stocks.filter((s) => s.score >= 40 && s.score < 70) },
              { range: "70-84", label: "高风险偏多", color: "bg-amber-400", stocks: stocks.filter((s) => s.score >= 70 && s.score < 85) },
              { range: "85-100", label: "高风险观察", color: "bg-red-500", stocks: stocks.filter((s) => s.score >= 85) },
            ].map((bucket) => (
              <div key={bucket.range} className="rounded-lg border border-rule bg-paper-2 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${bucket.color}`} />
                  <span className="text-xs font-medium text-ink">{bucket.label}</span>
                  <span className="text-[10px] text-muted">({bucket.range})</span>
                </div>
                <p className="text-lg font-bold text-ink">{bucket.stocks.length} 只</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {bucket.stocks.slice(0, 5).map((s: any) => (
                    <span key={s.code} className="text-[10px] text-muted bg-panel px-1 py-0.5 rounded">
                      {s.name}
                    </span>
                  ))}
                  {bucket.stocks.length > 5 && (
                    <span className="text-[10px] text-muted">+{bucket.stocks.length - 5}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
