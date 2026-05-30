"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { getStockList } from "@/lib/mockData";
import type { RatingLevel } from "@/lib/types";
import RatingBadge from "@/components/RatingBadge";

export default function StocksPage() {
  const allStocks = useMemo(() => getStockList(), []);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return allStocks;
    const q = search.toLowerCase();
    return allStocks.filter(
      (s) =>
        s.code.includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.industry.toLowerCase().includes(q)
    );
  }, [allStocks, search]);

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-ink mb-2">股票列表</h1>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索股票代码/名称/行业..."
          className="w-full max-w-md min-h-10 rounded-md border border-rule bg-panel px-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      <div className="rounded-lg border border-rule bg-panel overflow-hidden">
        <div className="grid grid-cols-[2rem_minmax(4rem,0.7fr)_minmax(0,1fr)_auto_auto_auto] gap-3 px-4 py-3 text-xs font-medium text-muted uppercase tracking-wide border-b border-rule bg-paper-2">
          <span></span>
          <span>代码</span>
          <span>名称</span>
          <span className="text-right">评分</span>
          <span className="text-right">评级</span>
          <span className="text-right">涨跌幅</span>
        </div>
        <div className="divide-y divide-rule">
          {filtered.map((stock) => (
            <Link
              key={stock.code}
              href={`/stock/${stock.code}`}
              className="grid grid-cols-[2rem_minmax(4rem,0.7fr)_minmax(0,1fr)_auto_auto_auto] gap-3 px-4 py-2.5 items-center hover:bg-paper-3 transition-colors"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded bg-paper-3 text-[10px] font-semibold text-muted">
                {stock.industry.slice(0, 2)}
              </span>
              <span className="font-mono text-sm font-medium text-ink">{stock.code}</span>
              <div className="min-w-0">
                <span className="text-sm text-ink font-medium">{stock.name}</span>
                <span className="text-xs text-muted ml-2">{stock.industry}</span>
              </div>
              <span className={`text-sm font-semibold text-right ${
                stock.score >= 85 ? "text-red-600" : stock.score >= 70 ? "text-amber-400" : stock.score >= 40 ? "text-blue-400" : stock.score >= 20 ? "text-green-600" : "text-emerald-800"
              }`}>
                {stock.score}
              </span>
              <div className="text-right">
                <RatingBadge rating={stock.rating} size="sm" />
              </div>
              <span className={`text-sm font-medium text-right ${
                stock.priceChange.startsWith("+") ? "text-green-600" : "text-red-600"
              }`}>
                {stock.priceChange}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
