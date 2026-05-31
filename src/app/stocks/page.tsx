"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";

interface StockRow {
  code: string; name: string; industry: string;
  rotationScore: number; rating: string; price: number | null;
  changePercent: number | null; pe: number | null;
  financial?: { revenueYoy?: number };
}

export default function StocksPage() {
  const [stocks, setStocks] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/collect", { signal: AbortSignal.timeout(10000) })
      .then(r => r.json())
      .then(d => {
        setStocks((d.stocks || []).map((s: any) => ({
          code: s.code, name: s.name, industry: s.industry,
          rotationScore: s.rotationScore || 0, rating: s.rating || "中性",
          price: s.price, changePercent: s.changePercent, pe: s.pe,
          financial: s.financial,
        })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return stocks;
    const q = search.toLowerCase();
    return stocks.filter(s => s.code.includes(q) || s.name.toLowerCase().includes(q) || s.industry.toLowerCase().includes(q));
  }, [stocks, search]);

  const getScoreColor = (s: number) => s >= 70 ? "text-emerald-600" : s >= 55 ? "text-green-600" : s >= 40 ? "text-teal-600" : s >= 25 ? "text-amber-500" : "text-slate-500";

  if (loading) return <div className="text-center py-20 text-muted animate-pulse">加载中...</div>;

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-ink mb-2">股票列表（{stocks.length}只）</h1>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="搜索股票代码/名称/行业..."
          className="w-full max-w-md min-h-10 rounded-md border border-rule bg-panel px-3 text-sm outline-none focus:ring-2 focus:ring-blue-200" />
      </div>
      <div className="rounded-lg border border-rule bg-panel overflow-hidden">
        <div className="table-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-rule text-xs text-muted bg-paper-2">
                <th className="text-left px-3 py-2.5 font-medium">代码</th>
                <th className="text-left px-3 py-2.5 font-medium">名称</th>
                <th className="text-right px-3 py-2.5 font-medium">评分</th>
                <th className="text-right px-3 py-2.5 font-medium">评级</th>
                <th className="text-right px-3 py-2.5 font-medium">现价</th>
                <th className="text-right px-3 py-2.5 font-medium">涨跌幅</th>
                <th className="text-right px-3 py-2.5 font-medium">PE(TTM)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {filtered.map(s => (
                <tr key={s.code} className="hover:bg-paper-3 cursor-pointer" onClick={() => window.location.href = `/stock/${s.code}`}>
                  <td className="px-3 py-2 font-mono text-xs text-muted">{s.code}</td>
                  <td className="px-3 py-2"><span className="font-medium text-ink">{s.name}</span><span className="text-xs text-muted ml-2">{s.industry}</span></td>
                  <td className={`px-3 py-2 text-right font-semibold ${getScoreColor(s.rotationScore)}`}>{s.rotationScore}</td>
                  <td className="px-3 py-2 text-right">
                    <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded-full border ${
                      s.rating === "强烈推荐" ? "bg-emerald-50 text-emerald-700 border-emerald-300" :
                      s.rating === "买入" ? "bg-green-50 text-green-600 border-green-300" :
                      s.rating === "增持" ? "bg-teal-50 text-teal-600 border-teal-300" :
                      s.rating === "持有" ? "bg-slate-50 text-slate-600 border-slate-300" :
                      s.rating === "中性" ? "bg-amber-50 text-amber-500 border-amber-300" :
                      s.rating === "减持" ? "bg-orange-50 text-orange-600 border-orange-300" :
                      "bg-red-50 text-red-600 border-red-300"
                    }`}>{s.rating}</span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{s.price != null ? `¥${s.price.toFixed(2)}` : "--"}</td>
                  <td className={`px-3 py-2 text-right font-mono ${(s.changePercent ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>{s.changePercent != null ? `${s.changePercent >= 0 ? "+" : ""}${s.changePercent.toFixed(2)}%` : "--"}</td>
                  <td className="px-3 py-2 text-right font-mono text-ink-2">{s.pe != null ? s.pe.toFixed(1) : "--"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
