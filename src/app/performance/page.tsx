"use client";

import { useState, useEffect, useMemo } from "react";
import { TrendingUp, TrendingDown, Activity, BarChart3, Minus, RefreshCw } from "lucide-react";
import { loadPortfolio } from "@/lib/portfolioStore";
import {
  generateRealBacktest,
  getMonthlyDirectionSummary,
  type BacktestSummary,
} from "@/lib/backtestEngine";

export default function PerformancePage() {
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [backtest, setBacktest] = useState<BacktestSummary | null>(null);
  const [portfolioStats, setPortfolioStats] = useState({
    holdings: 0, totalPL: 0, totalPLPercent: 0,
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/scores", { signal: AbortSignal.timeout(10000) });
        const data = await res.json();
        const list = data.stocks || [];
        setStocks(list);

        // 获取真实历史K线数据
        let historyData = [];
        try {
          const histRes = await fetch("/api/history", { signal: AbortSignal.timeout(30000) });
          const histData = await histRes.json();
          historyData = histData.stocks || [];
        } catch (e) {
          console.warn("[战绩] 历史数据获取失败，使用模拟回测");
        }

        // 生成回测数据（优先使用真实历史数据）
        const bt = generateRealBacktest(list, historyData);
        setBacktest(bt);

        // 读取组合数据
        const pf = loadPortfolio();
        const holdingCount = Object.keys(pf.holdings).length;
        const totalMarketValue = Object.values(pf.holdings).reduce(
          (sum: number, h: any) => sum + (list.find((s: any) => s.code === h.code)?.price || 0) * h.shares,
          0
        );
        const totalPL = (totalMarketValue + pf.cash) - pf.totalDeposited;
        setPortfolioStats({
          holdings: holdingCount,
          totalPL: Math.round(totalPL * 100) / 100,
          totalPLPercent: pf.totalDeposited > 0
            ? Math.round((totalPL / pf.totalDeposited) * 10000) / 100
            : 0,
        });
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  // 评级分布
  const ratingStats = useMemo(() => {
    if (!backtest) return [];
    const latest = backtest.months[backtest.months.length - 1];
    const map: Record<string, number> = {};
    latest.stocks.forEach((s) => {
      map[s.rating] = (map[s.rating] || 0) + 1;
    });
    const order = ["减持", "减持", "持有", "增持", "强烈推荐"];
    return order
      .filter((r) => map[r])
      .map((r) => ({ rating: r, count: map[r] }));
  }, [backtest]);

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

  const formatPct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted animate-pulse">
        正在加载回测数据...
      </div>
    );
  }

  const totalStocks = stocks.length;
  const riskCount = stocks.filter(
    (s) => s.rating === "减持" || s.rating === "减持"
  ).length;
  const positiveCount = stocks.filter(
    (s) => s.rating === "增持" || s.rating === "强烈推荐"
  ).length;

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
          <span className="text-xs text-muted uppercase tracking-wide font-medium">回测准确率</span>
          <p className="text-3xl font-bold text-green-600 mt-1">
            {backtest ? `${backtest.overallAccuracy}%` : "--"}
          </p>
          <p className="text-xs text-muted mt-1">
            近5个月 · 正确{backtest?.totalCorrect ?? 0}/{backtest ? backtest.totalCorrect + backtest.totalWrong : 0}
          </p>
        </div>
        <div className="rounded-lg border border-rule bg-panel p-4">
          <span className="text-xs text-muted uppercase tracking-wide font-medium">高风险预警准确率</span>
          <p className="text-3xl font-bold text-amber-400 mt-1">
            {backtest ? `${backtest.riskWarningAccuracy}%` : "--"}
          </p>
          <p className="text-xs text-muted mt-1">减持/偏多标的</p>
        </div>
        <div className="rounded-lg border border-rule bg-panel p-4">
          <span className="text-xs text-muted uppercase tracking-wide font-medium">增持准确率</span>
          <p className="text-3xl font-bold text-emerald-700 mt-1">
            {backtest ? `${backtest.positiveWatchAccuracy}%` : "--"}
          </p>
          <p className="text-xs text-muted mt-1">
            增持/强烈推荐标的
          </p>
        </div>
      </div>

      {/* 月度回测表格 */}
      {backtest && (
        <div className="rounded-lg border border-rule bg-panel overflow-hidden mb-6">
          <div className="px-4 py-3 text-xs font-medium text-muted uppercase tracking-wide border-b border-rule bg-paper-2">
            近5个月回测结果
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-rule text-xs text-muted">
                  <th className="text-left px-4 py-2.5 font-medium">月份</th>
                  <th className="text-center px-4 py-2.5 font-medium">上涨</th>
                  <th className="text-center px-4 py-2.5 font-medium">下跌</th>
                  <th className="text-center px-4 py-2.5 font-medium">持平</th>
                  <th className="text-center px-4 py-2.5 font-medium">正确</th>
                  <th className="text-center px-4 py-2.5 font-medium">错误</th>
                  <th className="text-right px-4 py-2.5 font-medium">准确率</th>
                  <th className="text-right px-4 py-2.5 font-medium">平均涨跌</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {backtest.months.map((month) => {
                  const dir = getMonthlyDirectionSummary(month.stocks);
                  // 计算当月平均涨跌幅
                  const avgChange = month.stocks.length > 0
                    ? month.stocks.reduce((s, st) => s + st.changePercent, 0) / month.stocks.length
                    : 0;
                  return (
                    <tr key={month.month} className="hover:bg-paper-3">
                      <td className="px-4 py-2.5 font-medium text-ink">{month.month}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <TrendingUp className="h-3 w-3" />
                          {dir.up}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="inline-flex items-center gap-1 text-red-600">
                          <TrendingDown className="h-3 w-3" />
                          {dir.down}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center text-ink-2">
                        <span className="inline-flex items-center gap-1">
                          <Minus className="h-3 w-3" />
                          {dir.flat}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="text-green-600 font-medium">{month.totalCorrect}</span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="text-red-600 font-medium">{month.totalWrong}</span>
                      </td>
                      <td className={`px-4 py-2.5 text-right font-bold ${
                        month.accuracy >= 80 ? "text-green-600" : month.accuracy >= 60 ? "text-amber-400" : "text-red-600"
                      }`}>
                        {month.accuracy}%
                      </td>
                      <td className={`px-4 py-2.5 text-right font-mono ${
                        avgChange >= 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        {avgChange >= 0 ? "+" : ""}{avgChange.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 评级 + 行业分布 */}
      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        {/* 评级分布 */}
        <div className="rounded-lg border border-rule bg-panel p-4">
          <h3 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted" />
            最新评级分布（{totalStocks} 只）
          </h3>
          <div className="space-y-2">
            {ratingStats.map((r) => {
              const pct = (r.count / totalStocks) * 100;
              const barColors: Record<string, string> = {
                "卖出": "bg-red-500",
                "减持": "bg-amber-400",
                "持有": "bg-blue-400",
                "增持": "bg-green-500",
                "强烈推荐": "bg-emerald-800",
              };
              const textColors: Record<string, string> = {
                "卖出": "text-red-700",
                "减持": "text-amber-700",
                "持有": "text-blue-700",
                "增持": "text-green-700",
                "强烈推荐": "text-emerald-800",
              };
              return (
                <div key={r.rating} className="flex items-center gap-3">
                  <span className={`text-xs font-medium w-24 ${textColors[r.rating] || "text-ink"}`}>
                    {r.rating}
                  </span>
                  <div className="flex-1 h-5 bg-paper-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColors[r.rating] || "bg-slate-400"} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-ink-2 w-12 text-right">
                    {r.count} 只
                  </span>
                  <span className="text-xs text-muted w-10 text-right">
                    {pct.toFixed(0)}%
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
            行业覆盖分布
          </h3>
          <div className="space-y-2">
            {industryStats.map((ind, i) => {
              const pct = (ind.count / totalStocks) * 100;
              const colors = ["bg-blue-400", "bg-violet-400", "bg-emerald-500", "bg-amber-400", "bg-red-400", "bg-sky-400"];
              return (
                <div key={ind.name} className="flex items-center gap-3">
                  <span className="text-xs font-medium w-20 text-ink-2">{ind.name}</span>
                  <div className="flex-1 h-5 bg-paper-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colors[i % colors.length]} transition-all`}
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

      {/* 模拟组合盈亏 */}
      <div className="rounded-lg border border-rule bg-panel p-4">
        <h3 className="text-sm font-semibold text-ink mb-3">模拟组合表现</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span className="text-xs text-muted">持仓数量</span>
            <p className="text-lg font-semibold text-ink">{portfolioStats.holdings} 只</p>
          </div>
          <div>
            <span className="text-xs text-muted">累计盈亏</span>
            <p className={`text-lg font-semibold ${portfolioStats.totalPL >= 0 ? "text-green-600" : "text-red-600"}`}>
              {portfolioStats.totalPL >= 0 ? "+" : ""}¥{portfolioStats.totalPL.toFixed(0)}
            </p>
          </div>
          <div>
            <span className="text-xs text-muted">收益率</span>
            <p className={`text-lg font-semibold ${portfolioStats.totalPLPercent >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatPct(portfolioStats.totalPLPercent)}
            </p>
          </div>
          <div>
            <span className="text-xs text-muted">策略</span>
            <p className="text-lg font-semibold text-ink">增持 → 买入100股</p>
          </div>
        </div>
      </div>
    </div>
  );
}
