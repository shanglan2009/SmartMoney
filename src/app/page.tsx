"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, AlertTriangle, BarChart3, RefreshCw } from "lucide-react";
import { getLiveStockList, forceRefresh } from "@/lib/apiService";
import type { LiveStockItem } from "@/lib/apiService";
import type { RatingLevel } from "@/lib/types";
import { RATING_ORDER } from "@/lib/types";
import RatingBadge from "@/components/RatingBadge";
import ActionBadge from "@/components/ActionBadge";

const ratingFilters: { label: string; value: string }[] = [
  { label: "全部", value: "all" },
  { label: "🟢 强烈推荐", value: "强烈推荐" },
  { label: "✅ 买入", value: "买入" },
  { label: "📈 增持", value: "增持" },
  { label: "⏸️ 持有", value: "持有" },
  { label: "⚖️ 中性", value: "中性" },
  { label: "⬇️ 减持", value: "减持" },
  { label: "🔴 卖出", value: "卖出" },
];

export default function HomePage() {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"score" | "name" | "change">("score");
  const [allStocks, setAllStocks] = useState<LiveStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (force = false) => {
    if (force) setRefreshing(true);
    const stocks = await getLiveStockList();
    setAllStocks(stocks);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
    // 每60秒自动刷新
    const interval = setInterval(() => loadData(), 60_000);
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    let list = activeFilter === "all" ? allStocks
      : allStocks.filter((s) => s.rating === activeFilter);
    return [...list].sort((a, b) => {
      if (sortBy === "score") return b.score - a.score;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return parseFloat(b.priceChange) - parseFloat(a.priceChange);
    });
  }, [allStocks, activeFilter, sortBy]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: allStocks.length,
      highRisk: allStocks.filter((s) => s.rating === "减持" || s.rating === "卖出").length,
      positive: allStocks.filter((s) => s.rating === "增持" || s.rating === "强烈推荐").length,
      watch: allStocks.filter((s) => s.rating === "持有").length,
    };
  }, [allStocks]);

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-600";
    if (score >= 70) return "text-green-600";
    if (score >= 55) return "text-teal-600";
    if (score >= 40) return "text-slate-600";
    if (score >= 25) return "text-amber-500";
    if (score >= 10) return "text-orange-500";
    return "text-red-500";
  };

  return (
    <div>
      {/* Stats Cards */}
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 mb-4">
        <div className="rounded-lg border border-rule bg-panel p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted font-medium uppercase tracking-wide">覆盖标的</span>
            <BarChart3 className="h-4 w-4 text-muted" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-ink">{stats.total}</p>
          <p className="text-xs text-muted mt-1">重点行业供应链监控</p>
        </div>
        <div className="rounded-lg border border-rule bg-panel p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted font-medium uppercase tracking-wide">高风险</span>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-red-600">{stats.highRisk}</p>
          <p className="text-xs text-muted mt-1">减持 · 减持</p>
        </div>
        <div className="rounded-lg border border-rule bg-panel p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted font-medium uppercase tracking-wide">观察中</span>
            <TrendingUp className="h-4 w-4 text-blue-400" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-blue-400">{stats.watch}</p>
          <p className="text-xs text-muted mt-1">供应链需持续关注</p>
        </div>
        <div className="rounded-lg border border-rule bg-panel p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted font-medium uppercase tracking-wide">健康/强烈推荐</span>
            <TrendingDown className="h-4 w-4 text-green-600" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-green-600">{stats.positive}</p>
          <p className="text-xs text-muted mt-1">供应链优势明显</p>
        </div>
      </section>

      {/* 刷新状态 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs text-muted">
          {refreshing ? (
            <span className="inline-flex items-center gap-1">
              <RefreshCw className="h-3 w-3 animate-spin" />
              正在刷新评分...
            </span>
          ) : allStocks.length > 0 && (
            <span>
              上次更新: {new Date(allStocks[0]?.lastUpdated || Date.now()).toLocaleTimeString("zh-CN")}
              · 共 {allStocks.length} 只
            </span>
          )}
        </div>
        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border border-rule bg-panel text-ink-2 hover:bg-paper-3 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
          刷新评分
        </button>
      </div>

      {/* Rating Filter Pills (Serenity style) */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {ratingFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              activeFilter === f.value
                ? f.value === "all"
                  ? "bg-ink text-white border-ink"
                  : `${RATING_ORDER.includes(f.value as RatingLevel) ? "bg-ink text-white border-ink" : ""}`
                : "bg-panel text-ink-2 border-rule hover:bg-paper-3"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Stock List Table (Serenity style grid) */}
      <div className="rounded-lg border border-rule bg-panel overflow-hidden"><div className="table-scroll">
        {/* Header */}
        <div className="grid grid-cols-[2rem_minmax(4rem,0.7fr)_minmax(0,1fr)_auto_auto_auto_auto_auto] gap-3 px-4 py-3 text-xs font-medium text-muted uppercase tracking-wide border-b border-rule bg-paper-2">
          <span></span>
          <span>代码</span>
          <span>名称</span>
          <span className="text-right cursor-pointer" onClick={() => setSortBy("score")}>评分</span>
          <span className="text-right">评级</span>
          <span className="text-right">建议</span>
          <span className="text-right cursor-pointer" onClick={() => setSortBy("change")}>涨跌幅</span>
          <span className="text-right">信号</span>
        </div>

        {/* Rows - Serenity style compact */}
        <div className="divide-y divide-rule">
          {filtered.map((stock) => (
            <Link
              key={stock.code}
              href={`/stock/${stock.code}`}
              className="grid grid-cols-[2rem_minmax(4rem,0.7fr)_minmax(0,1fr)_auto_auto_auto_auto_1fr] gap-3 px-4 py-2.5 items-center hover:bg-paper-3 transition-colors"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded bg-paper-3 text-[10px] font-semibold text-muted">
                {stock.industry.slice(0, 2)}
              </span>
              <span className="font-mono text-sm font-medium text-ink">{stock.code}</span>
              <div className="min-w-0">
                <span className="text-sm text-ink font-medium">{stock.name}</span>
                <span className="text-xs text-muted ml-2">{stock.industry}</span>
              </div>
              <span className={`text-sm font-semibold text-right ${getScoreColor(stock.score)}`}>
                {stock.score}
              </span>
              <div className="text-right">
                <RatingBadge rating={stock.rating} size="sm" />
              </div>
              <div className="text-right">
                <ActionBadge action={stock.action} />
              </div>
              <span className={`text-sm font-medium text-right ${
                stock.priceChange.startsWith("+") ? "text-green-600" : "text-red-600"
              }`}>
                {stock.priceChange}
              </span>
              <span className="text-xs text-muted text-right truncate">{stock.signal}</span>
            </Link>
          ))}
        </div>
      </div></div>

      {loading && (
        <div className="text-center py-12 text-muted animate-pulse">
          正在加载实时行情...
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-12 text-muted">
          该评级下暂无标的
        </div>
      )}
    </div>
  );
}
