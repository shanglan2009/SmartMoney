"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  BarChart3,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Shield,
  AlertTriangle,
  Star,
} from "lucide-react";
import type {
  DashboardStats,
  StockRecommendation,
  Trade,
  Politician,
} from "@/lib/trumpData";

// ============================================================
// Trump Stock Tracker — 主仪表盘
// ============================================================

/** 格式化美元 */
function formatUSD(amount: number): string {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

/** 建议徽章 */
function RecBadge({ rec }: { rec: StockRecommendation["recommendation"] }) {
  const styles: Record<string, string> = {
    strong_buy: "bg-emerald-100 text-emerald-800 border-emerald-300",
    buy: "bg-green-100 text-green-800 border-green-300",
    hold: "bg-slate-100 text-slate-700 border-slate-300",
    sell: "bg-orange-100 text-orange-800 border-orange-300",
    strong_sell: "bg-red-100 text-red-800 border-red-300",
  };
  const labels: Record<string, string> = {
    strong_buy: "🟢 强烈买入",
    buy: "✅ 买入",
    hold: "⏸️ 持有/观望",
    sell: "⬇️ 减仓",
    strong_sell: "🔴 卖出",
  };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[rec] || styles.hold}`}>
      {labels[rec] || rec}
    </span>
  );
}

/** 信心条 */
function ConfidenceBar({ confidence }: { confidence: number }) {
  const color = confidence >= 70 ? "bg-emerald-500" : confidence >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${confidence}%` }} />
      </div>
      <span className="text-xs font-medium text-slate-600">{confidence}%</span>
    </div>
  );
}

export default function TrumpDashboard() {
  const [data, setData] = useState<{
    stats: DashboardStats;
    politicians: Politician[];
    recommendations: StockRecommendation[];
  } | null>(null);
  const [allTrades, setAllTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [activeTab, setActiveTab] = useState<"buys" | "sells" | "held">("buys");

  const loadData = async (force = false) => {
    if (force) setRefreshing(true);
    try {
      const [dashRes, tradesRes] = await Promise.all([
        fetch(`/api/trump${force ? "?refresh=true" : ""}`, { signal: AbortSignal.timeout(15000) }),
        fetch("/api/trump?section=trades&limit=100", { signal: AbortSignal.timeout(15000) }),
      ]);
      const dash = await dashRes.json();
      const trades = await tradesRes.json();
      setData(dash);
      setAllTrades(trades.trades || []);
    } catch (err) {
      console.error("Failed to load Trump data:", err);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // 记忆化计算
  const sortedTrades = useMemo(() => {
    if (!allTrades.length) return [];
    const sorted = [...allTrades];
    if (sortBy === "date") {
      sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else {
      sorted.sort((a, b) => (b.amount || 0) - (a.amount || 0));
    }
    return sorted.slice(0, 30);
  }, [allTrades, sortBy]);

  const stats = data?.stats;

  // ============ 顶部 Hero 区域 ============
  return (
    <div>
      {/* ===== Hero / 品牌区 ===== */}
      <div className="relative overflow-hidden rounded-2xl border border-rule bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900 mb-6">
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative px-6 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-amber-500 text-white font-black text-lg">
                  TP
                </span>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    TrumpPump <span className="text-amber-400">Tracker</span>
                  </h1>
                  <p className="text-sm text-slate-300 mt-0.5">
                    特朗普及美国政要美股持仓追踪 · 每日更新
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full text-xs text-slate-300">
                <RefreshCw className="h-3 w-3" />
                <span>
                  {stats?.dataSources.find(s => s.name === "Open Cabinet")?.status === "ok"
                    ? "数据源在线"
                    : "数据更新中..."}
                </span>
              </div>
              <button
                onClick={() => loadData(true)}
                disabled={refreshing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-amber-500 hover:bg-amber-400 text-slate-900 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "刷新中..." : "刷新数据"}
              </button>
            </div>
          </div>

          {/* 数据来源条 */}
          <div className="mt-4 flex flex-wrap gap-2">
            {stats?.dataSources.map((src) => (
              <a
                key={src.name}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-white/10 text-slate-300 hover:bg-white/20 transition-colors"
              >
                <span className={`h-1.5 w-1.5 rounded-full ${
                  src.status === "ok" ? "bg-emerald-400" : src.status === "stale" ? "bg-amber-400" : "bg-red-400"
                }`} />
                {src.name}
                <ExternalLink className="h-3 w-3 opacity-50" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ===== 状态统计卡 ===== */}
      <section className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="rounded-xl border border-rule bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">追踪政要</span>
            <Users className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats?.totalPoliticians || 0}</p>
          <p className="text-xs text-slate-400 mt-0.5">特朗普家族 + 内阁 + 国会</p>
        </div>

        <div className="rounded-xl border border-rule bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">交易记录</span>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats?.totalTrades.toLocaleString() || 0}</p>
          <p className="text-xs text-slate-400 mt-0.5">近120天内披露</p>
        </div>

        <div className="rounded-xl border border-rule bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">总交易额</span>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatUSD(stats?.totalValue || 0)}</p>
          <p className="text-xs text-slate-400 mt-0.5">交易总额</p>
        </div>

        <div className="rounded-xl border border-rule bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">每日刷新</span>
            <RefreshCw className="h-4 w-4 text-sky-500" />
          </div>
          <p className="text-sm font-semibold text-slate-900">UTC 06:00</p>
          <p className="text-xs text-slate-400 mt-0.5">美东凌晨自动更新</p>
        </div>
      </section>

      {/* ===== 持仓建议 & 热门标的 ===== */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* 左侧：持仓建议 */}
        <div className="rounded-xl border border-rule bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              政要跟单建议
            </h2>
            <span className="text-xs text-slate-400">按买入政要数量排序</span>
          </div>

          <div className="space-y-2">
            {data?.recommendations.slice(0, 8).map((rec) => (
              <div
                key={rec.ticker}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-900">{rec.ticker}</span>
                    <span className="text-xs text-slate-400 truncate">{rec.companyName}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-emerald-600">
                      <TrendingUp className="h-3 w-3 inline mr-0.5" />
                      {rec.politicianBuyCount}人买入
                    </span>
                    {rec.politicianSellCount > 0 && (
                      <span className="text-xs text-red-500">
                        <TrendingDown className="h-3 w-3 inline mr-0.5" />
                        {rec.politicianSellCount}人卖出
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <RecBadge rec={rec.recommendation} />
                  <div className="mt-1">
                    <ConfidenceBar confidence={rec.confidence} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {data?.recommendations.length === 0 && (
            <p className="text-center py-8 text-slate-400 text-sm">暂无建议数据</p>
          )}
        </div>

        {/* 右侧：热门持仓排行 */}
        <div className="rounded-xl border border-rule bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              政要最热门持仓
            </h2>
          </div>

          <div className="flex gap-1 mb-4">
            {(["buys", "sells", "held"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                {tab === "buys" && "最多买入"}
                {tab === "sells" && "最多卖出"}
                {tab === "held" && "最受欢迎"}
              </button>
            ))}
          </div>

          {/* Top Buys */}
          {activeTab === "buys" && (
            <div className="space-y-2">
              {stats?.topBuys?.slice(0, 6).map((item, i) => (
                <div
                  key={item.ticker}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      i < 3 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-500"
                    }`}>
                      {i + 1}
                    </span>
                    <div>
                      <span className="font-mono font-semibold text-sm text-slate-900">{item.ticker}</span>
                      <span className="text-xs text-slate-400 ml-2">{item.companyName}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-slate-900">{formatUSD(item.totalAmount)}</span>
                    <p className="text-[10px] text-slate-400">{item.count}笔交易</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Top Sells */}
          {activeTab === "sells" && (
            <div className="space-y-2">
              {stats?.topSells?.slice(0, 6).map((item, i) => (
                <div
                  key={item.ticker}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      i < 3 ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-500"
                    }`}>
                      {i + 1}
                    </span>
                    <div>
                      <span className="font-mono font-semibold text-sm text-slate-900">{item.ticker}</span>
                      <span className="text-xs text-slate-400 ml-2">{item.companyName}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-slate-900">{formatUSD(item.totalAmount)}</span>
                    <p className="text-[10px] text-slate-400">{item.count}笔交易</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Top Held */}
          {activeTab === "held" && (
            <div className="space-y-2">
              {stats?.topHeldByCount?.slice(0, 6).map((item, i) => (
                <div
                  key={item.ticker}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      i < 3 ? "bg-sky-100 text-sky-800" : "bg-slate-100 text-slate-500"
                    }`}>
                      {i + 1}
                    </span>
                    <div>
                      <span className="font-mono font-semibold text-sm text-slate-900">{item.ticker}</span>
                      <span className="text-xs text-slate-400 ml-2">{item.companyName}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-slate-900">{item.count}人持有</span>
                    <p className="text-[10px] text-slate-400">{item.sector}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== 行业分布 ===== */}
      <div className="rounded-xl border border-rule bg-white p-5 shadow-sm mb-6">
        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <BarChart3 className="h-4 w-4 text-sky-500" />
          政要持仓行业分布
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {stats?.sectorDistribution.slice(0, 9).map((sector) => {
            const maxVal = Math.max(...(stats?.sectorDistribution.map(s => s.totalValue) || [1]));
            const pct = (sector.totalValue / maxVal) * 100;
            const totalPct = stats?.totalValue ? (sector.totalValue / stats.totalValue * 100) : 0;
            return (
              <div key={sector.sector} className="p-3 rounded-lg bg-slate-50">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-medium text-slate-800">{sector.sector}</span>
                  <span className="text-xs text-slate-500">{totalPct.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-slate-400">{sector.count}笔交易</span>
                  <span className="text-[10px] text-slate-400">{formatUSD(sector.totalValue)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== 政要列表 ===== */}
      <div className="rounded-xl border border-rule bg-white p-5 shadow-sm mb-6">
        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <Users className="h-4 w-4 text-indigo-500" />
          追踪政要
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data?.politicians.map((p) => (
            <div
              key={p.id}
              className="p-3 rounded-lg border border-slate-100 hover:border-amber-200 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                  p.relation === "trump_admin" ? "bg-amber-600" :
                  p.relation === "trump_cabinet" ? "bg-blue-600" : "bg-slate-600"
                }`}>
                  {p.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">{p.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{p.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                      p.party === "R" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {p.party === "R" ? "R" : p.party === "D" ? "D" : "I"}
                    </span>
                    <span className="text-[9px] text-slate-400">
                      {p.relation === "trump_admin" ? "👑 特朗普家族" :
                       p.relation === "trump_cabinet" ? "🏛️ 内阁" : "🏛️ 国会"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== 最新交易记录 ===== */}
      <div className="rounded-xl border border-rule bg-white shadow-sm overflow-hidden">
        <div className="p-5 pb-0 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-amber-500" />
            最新交易记录
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortBy("date")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                sortBy === "date" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              按日期
            </button>
            <button
              onClick={() => setSortBy("amount")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                sortBy === "amount" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              按金额
            </button>
          </div>
        </div>

        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-slate-100 bg-slate-50/50">
                <th className="text-left px-5 py-3 text-[10px] font-medium text-slate-400 uppercase tracking-wider">日期</th>
                <th className="text-left px-5 py-3 text-[10px] font-medium text-slate-400 uppercase tracking-wider">政要</th>
                <th className="text-left px-5 py-3 text-[10px] font-medium text-slate-400 uppercase tracking-wider">标的</th>
                <th className="text-left px-5 py-3 text-[10px] font-medium text-slate-400 uppercase tracking-wider">类型</th>
                <th className="text-right px-5 py-3 text-[10px] font-medium text-slate-400 uppercase tracking-wider">金额</th>
                <th className="text-right px-5 py-3 text-[10px] font-medium text-slate-400 uppercase tracking-wider">行业</th>
                <th className="text-right px-5 py-3 text-[10px] font-medium text-slate-400 uppercase tracking-wider">来源</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedTrades.map((trade) => {
                const politician = data?.politicians.find(p => p.id === trade.politicianId);
                return (
                  <tr key={trade.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {trade.date}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="text-sm font-medium text-slate-800">{politician?.name || trade.politicianId}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-mono font-bold text-sm text-slate-900">{trade.ticker}</span>
                      <span className="text-xs text-slate-400 ml-1.5">{trade.companyName}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        trade.type === "buy" || trade.type === "option_buy"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {trade.type === "buy" ? "买入" :
                         trade.type === "sell" ? "卖出" :
                         trade.type === "option_buy" ? "买入期权" : "卖出期权"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-sm font-medium text-slate-800">
                      {trade.amount && trade.amount > 0
                        ? formatUSD(trade.amount)
                        : trade.amount && trade.amount < 0
                        ? `-${formatUSD(Math.abs(trade.amount))}`
                        : trade.size}
                    </td>
                    <td className="px-5 py-3 text-right text-xs text-slate-400">
                      {trade.sector}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-[10px] text-slate-400">{trade.source}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {sortedTrades.length === 0 && !loading && (
          <div className="text-center py-12 text-slate-400 text-sm">
            暂无交易记录
          </div>
        )}

        {loading && (
          <div className="text-center py-12 text-slate-400 animate-pulse text-sm">
            加载交易数据...
          </div>
        )}
      </div>

      {/* ===== Footer ===== */}
      <div className="mt-8 text-center text-xs text-slate-400 pb-8">
        <p className="mb-1">
          数据来源:{" "}
          <a href="https://open-cabinet.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">Open Cabinet</a>
          {" · "}
          <a href="https://trumpstrades.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">TrumpTrades</a>
          {" · "}
          <a href="https://trumptracker.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">Trump Tracker</a>
          {" · "}
          <a href="https://oge.gov" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">OGE</a>
          {" · "}
          <a href="https://projects.propublica.org/trump-team-financial-disclosures/" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">ProPublica</a>
        </p>
        <p>
          SmartMoney · 本平台不构成投资建议 · 数据仅供参考
        </p>
      </div>
    </div>
  );
}
