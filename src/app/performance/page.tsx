"use client";

import { useState, useEffect, useMemo } from "react";
import { TrendingUp, TrendingDown, Activity, BarChart3, Minus } from "lucide-react";
import { generateRealBacktest, getMonthlyDirectionSummary } from "@/lib/backtestEngine";

export default function PerformancePage() {
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [scoresRes, histRes] = await Promise.all([
          fetch("/api/collect", { signal: AbortSignal.timeout(10000) }),
          fetch("/api/history", { signal: AbortSignal.timeout(15000) }).catch(() => null),
        ]);
        const scoresData = await scoresRes.json();
        const list = scoresData.stocks || [];
        setStocks(list);

        if (histRes && histRes.ok) {
          const histData = await histRes.json();
          setHistoryData(histData.stocks || []);
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  const backtest = useMemo(() => {
    if (stocks.length === 0) return null;
    return generateRealBacktest(stocks, historyData);
  }, [stocks, historyData]);

  const total = stocks.length;
  const buy = stocks.filter(s => s.rating === "强烈推荐" || s.rating === "买入").length;
  const hold = stocks.filter(s => s.rating === "增持" || s.rating === "持有").length;
  const watch = stocks.filter(s => s.rating === "中性").length;

  const industryStats = useMemo(() => {
    const map: Record<string, number> = {};
    stocks.forEach((s: any) => {
      const cat = (s.industry || "").split("/")[0] || "其他";
      map[cat] = (map[cat] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  }, [stocks]);

  if (loading) return <div className="text-center py-20 text-muted animate-pulse">加载中...</div>;

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink mb-4">模型战绩</h1>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <div className="rounded-lg border border-rule bg-panel p-4">
          <span className="text-xs text-muted uppercase font-medium">覆盖标的</span>
          <p className="text-3xl font-bold text-blue-400 mt-1">{total}</p>
          <p className="text-xs text-muted mt-1">全球供应链分工A股</p>
        </div>
        <div className="rounded-lg border border-rule bg-panel p-4">
          <span className="text-xs text-muted uppercase font-medium">回测准确率</span>
          <p className="text-3xl font-bold text-green-600 mt-1">{backtest ? `${backtest.overallAccuracy}%` : "--"}</p>
          <p className="text-xs text-muted mt-1">近5个月历史数据</p>
        </div>
        <div className="rounded-lg border border-rule bg-panel p-4">
          <span className="text-xs text-muted uppercase font-medium">强烈推荐/买入</span>
          <p className="text-3xl font-bold text-emerald-600 mt-1">{buy}</p>
          <p className="text-xs text-muted mt-1">建议重点配置</p>
        </div>
        <div className="rounded-lg border border-rule bg-panel p-4">
          <span className="text-xs text-muted uppercase font-medium">持有/中性</span>
          <p className="text-3xl font-bold text-amber-500 mt-1">{hold + watch}</p>
          <p className="text-xs text-muted mt-1">等待催化剂</p>
        </div>
      </div>

      {backtest && (
        <div className="rounded-lg border border-rule bg-panel overflow-hidden mb-6">
          <div className="px-4 py-3 text-xs font-medium text-muted uppercase tracking-wide border-b border-rule bg-paper-2">近5个月回测结果</div>
          <div className="table-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-rule text-xs text-muted">
                  <th className="text-left px-4 py-2.5 font-medium">月份</th>
                  <th className="text-center px-4 py-2.5 font-medium">上涨</th>
                  <th className="text-center px-4 py-2.5 font-medium">下跌</th>
                  <th className="text-center px-4 py-2.5 font-medium">正确</th>
                  <th className="text-center px-4 py-2.5 font-medium">错误</th>
                  <th className="text-right px-4 py-2.5 font-medium">准确率</th>
                  <th className="text-right px-4 py-2.5 font-medium">平均涨跌</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {backtest.months.map(m => {
                  const dir = getMonthlyDirectionSummary(m.stocks);
                  const avgChange = m.stocks.length > 0 ? m.stocks.reduce((s, st) => s + st.changePercent, 0) / m.stocks.length : 0;
                  return (
                    <tr key={m.month} className="hover:bg-paper-3">
                      <td className="px-4 py-2.5 font-medium text-ink">{m.month}</td>
                      <td className="px-4 py-2.5 text-center"><span className="inline-flex items-center gap-1 text-green-600"><TrendingUp className="h-3 w-3" />{dir.up}</span></td>
                      <td className="px-4 py-2.5 text-center"><span className="inline-flex items-center gap-1 text-red-600"><TrendingDown className="h-3 w-3" />{dir.down}</span></td>
                      <td className="px-4 py-2.5 text-center text-green-600 font-medium">{m.totalCorrect}</td>
                      <td className="px-4 py-2.5 text-center text-red-600 font-medium">{m.totalWrong}</td>
                      <td className={`px-4 py-2.5 text-right font-bold ${m.accuracy >= 80 ? "text-green-600" : m.accuracy >= 60 ? "text-amber-400" : "text-red-600"}`}>{m.accuracy}%</td>
                      <td className={`px-4 py-2.5 text-right font-mono ${avgChange >= 0 ? "text-green-600" : "text-red-600"}`}>{avgChange >= 0 ? "+" : ""}{avgChange.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        <div className="rounded-lg border border-rule bg-panel p-4">
          <h3 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2"><Activity className="h-4 w-4 text-muted" />评级分布（{total}只）</h3>
          <div className="space-y-2">
            {[
              { r: "强烈推荐", c: "bg-emerald-500", t: "text-emerald-700" },
              { r: "买入", c: "bg-green-500", t: "text-green-700" },
              { r: "增持", c: "bg-teal-500", t: "text-teal-700" },
              { r: "持有", c: "bg-slate-400", t: "text-slate-600" },
              { r: "中性", c: "bg-amber-400", t: "text-amber-700" },
            ].map(({ r, c, t }) => {
              const count = stocks.filter((s: any) => s.rating === r).length;
              if (count === 0) return null;
              return (
                <div key={r} className="flex items-center gap-3">
                  <span className={`text-xs font-medium w-16 ${t}`}>{r}</span>
                  <div className="flex-1 h-5 bg-paper-3 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${c}`} style={{ width: `${(count / total) * 100}%` }} />
                  </div>
                  <span className="text-xs font-mono text-ink-2 w-12 text-right">{count}只</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-rule bg-panel p-4">
          <h3 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-muted" />行业分布</h3>
          <div className="space-y-2">
            {industryStats.map((ind, i) => {
              const colors = ["bg-blue-400", "bg-violet-400", "bg-emerald-500", "bg-amber-400", "bg-red-400", "bg-sky-400"];
              return (
                <div key={ind.name} className="flex items-center gap-3">
                  <span className="text-xs font-medium w-16 text-ink-2 truncate">{ind.name}</span>
                  <div className="flex-1 h-5 bg-paper-3 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${colors[i % colors.length]}`} style={{ width: `${(ind.count / total) * 100}%` }} />
                  </div>
                  <span className="text-xs font-mono text-ink-2 w-12 text-right">{ind.count}只</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-rule bg-panel p-4">
        <h3 className="text-sm font-semibold text-ink mb-3">评分分布明细</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {[
            { range: "70+", label: "强烈推荐", c: "bg-emerald-500", stocks: stocks.filter((s: any) => (s.rotationScore || 0) >= 70) },
            { range: "55-69", label: "买入", c: "bg-green-500", stocks: stocks.filter((s: any) => (s.rotationScore || 0) >= 55 && (s.rotationScore || 0) < 70) },
            { range: "40-54", label: "增持", c: "bg-teal-500", stocks: stocks.filter((s: any) => (s.rotationScore || 0) >= 40 && (s.rotationScore || 0) < 55) },
            { range: "25-39", label: "持有", c: "bg-slate-400", stocks: stocks.filter((s: any) => (s.rotationScore || 0) >= 25 && (s.rotationScore || 0) < 40) },
            { range: "0-24", label: "中性/减持", c: "bg-amber-400", stocks: stocks.filter((s: any) => (s.rotationScore || 0) < 25) },
          ].map(b => (
            <div key={b.range} className="rounded-lg border border-rule bg-paper-2 p-3">
              <div className="flex items-center gap-2 mb-1"><span className={`w-2.5 h-2.5 rounded-full ${b.c}`} /><span className="text-xs font-medium">{b.label}</span><span className="text-[10px] text-muted">({b.range})</span></div>
              <p className="text-lg font-bold text-ink">{b.stocks.length}只</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {b.stocks.slice(0, 3).map((s: any) => <span key={s.code} className="text-[10px] text-muted bg-panel px-1 py-0.5 rounded">{s.name}</span>)}
                {b.stocks.length > 3 && <span className="text-[10px] text-muted">+{b.stocks.length - 3}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
