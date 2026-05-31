"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import type { RatingLevel } from "@/lib/types";
import RatingBadge from "@/components/RatingBadge";
import ScoreGauge from "@/components/StockPage/ScoreGauge";
import RadarChart from "@/components/StockPage/RadarChart";
import SupplierTable from "@/components/StockPage/SupplierTable";
import SupplyGraph from "@/components/StockPage/SupplyGraph";
import RiskEvents from "@/components/StockPage/RiskEvents";

interface ApiData {
  code: string; name: string; industry: string;
  price: number | null; changePercent: number | null; pe: number | null;
  rotationScore: number; rating: string; posterior: number; prior: number;
  confidence: number; cognitiveGap: number; marketImplied: number;
  overseasRatio: number; moatLevel: string; bomInsight: string;
  supplyRelations: { customer: string; hq: string; product: string; verified: boolean }[];
  financial?: { revenue?: number; revenueYoy?: number; netProfit?: number; profitYoy?: number; grossMargin?: number; rdRatio?: number };
}

export default function StockPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/collect?code=${code}`, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const d = await res.json();
      if (!d || !d.code) throw new Error("未找到数据");
      setData(d);
      setError("");
    } catch (e: any) {
      setError(e.message || "加载失败");
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [code]);

  if (loading) return <div className="flex items-center justify-center py-20 text-muted animate-pulse">加载中...</div>;
  if (error || !data) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <AlertTriangle className="h-12 w-12 text-muted" />
      <p className="text-lg text-muted">未找到股票代码: {code}</p>
      <p className="text-xs text-muted">{error}</p>
      <div className="flex gap-2">
        <Link href="/" className="text-sm text-accent hover:underline px-3 py-1.5">返回首页</Link>
        <button onClick={loadData} className="text-sm text-accent hover:underline px-3 py-1.5 border border-rule rounded-full">重试</button>
      </div>
    </div>
  );

  const { name, industry, price, changePercent, pe, rotationScore, rating, posterior, prior, confidence, cognitiveGap, overseasRatio, bomInsight, supplyRelations, financial } = data;
  const fin = financial;

  const formatPct = (v: number | null | undefined) => v != null ? `${v >= 0 ? "+" : ""}${v.toFixed(2)}%` : "--";
  const formatMoney = (v: number | null | undefined) => v != null ? `¥${v.toFixed(2)}` : "--";

  return (
    <div>
      <div className="mb-4">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink transition-colors mb-2">
          <ArrowLeft className="h-4 w-4" /> 返回总览
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold text-ink">{name}</h1>
          <span className="font-mono text-sm text-muted bg-paper-3 px-2 py-0.5 rounded">{code}</span>
          <span className="text-sm text-muted">{industry}</span>
          <RatingBadge rating={rating as RatingLevel} size="lg" />
        </div>
      </div>

      {/* 核心指标行 */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 mb-4">
        <ScoreGauge score={rotationScore} rating={rating as RatingLevel} />

        {/* 实时行情 */}
        <div className="rounded-lg border border-rule bg-panel p-4">
          <h3 className="text-xs font-medium text-muted uppercase tracking-wide mb-2">实时行情</h3>
          <p className="text-2xl font-bold text-ink">{formatMoney(price)}</p>
          <p className={`text-sm font-medium ${(changePercent ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>{formatPct(changePercent)}</p>
          <div className="flex gap-2 mt-1 text-xs text-muted">
            <span>PE(TTM): {pe != null ? pe.toFixed(1) : "--"}</span>
            <span>海外收入: {(overseasRatio * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* 贝叶斯指标 */}
        <div className="rounded-lg border border-rule bg-panel p-4">
          <h3 className="text-xs font-medium text-muted uppercase tracking-wide mb-2">贝叶斯指标</h3>
          <div className="space-y-1.5">
            <div className="flex justify-between"><span className="text-xs text-ink-2">先验 P(H)</span><span className="text-xs font-bold text-ink">{(prior * 100).toFixed(0)}%</span></div>
            <div className="flex justify-between"><span className="text-xs text-ink-2">后验 P(H|E)</span><span className="text-xs font-bold text-ink">{(posterior * 100).toFixed(0)}%</span></div>
            <div className="flex justify-between"><span className="text-xs text-ink-2">置信度</span><span className="text-xs font-bold text-ink">{confidence}/100</span></div>
            <div className="flex justify-between">
              <span className="text-xs text-ink-2">认知差</span>
              <span className={`text-xs font-bold ${(cognitiveGap ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                {cognitiveGap != null ? `${cognitiveGap >= 0 ? "+" : ""}${(cognitiveGap * 100).toFixed(0)}%` : "--"}
              </span>
            </div>
            <div className="flex justify-between"><span className="text-xs text-ink-2">护城河</span><span className="text-xs font-bold text-ink">{data.moatLevel || "--"}</span></div>
          </div>
        </div>

        {/* 财报数据 */}
        <div className="rounded-lg border border-rule bg-panel p-4">
          <h3 className="text-xs font-medium text-muted uppercase tracking-wide mb-2">最新财报</h3>
          {fin ? (
            <div className="space-y-1.5">
              {fin.revenue != null && <div className="flex justify-between"><span className="text-xs text-ink-2">营收</span><span className="text-xs font-medium text-ink">{fin.revenue.toFixed(1)}亿</span></div>}
              {fin.revenueYoy != null && <div className="flex justify-between"><span className="text-xs text-ink-2">营收同比</span><span className={`text-xs font-medium ${fin.revenueYoy >= 0 ? "text-green-600" : "text-red-600"}`}>{fin.revenueYoy >= 0 ? "+" : ""}{fin.revenueYoy.toFixed(1)}%</span></div>}
              {fin.netProfit != null && <div className="flex justify-between"><span className="text-xs text-ink-2">净利润</span><span className="text-xs font-medium text-ink">{fin.netProfit.toFixed(1)}亿</span></div>}
              {fin.profitYoy != null && <div className="flex justify-between"><span className="text-xs text-ink-2">利润同比</span><span className={`text-xs font-medium ${fin.profitYoy >= 0 ? "text-green-600" : "text-red-600"}`}>{fin.profitYoy >= 0 ? "+" : ""}{fin.profitYoy.toFixed(1)}%</span></div>}
              {fin.grossMargin != null && <div className="flex justify-between"><span className="text-xs text-ink-2">毛利率</span><span className="text-xs font-medium text-ink">{fin.grossMargin.toFixed(1)}%</span></div>}
            </div>
          ) : <p className="text-xs text-muted">暂无财报数据</p>}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {/* BOM分析 */}
          <div className="rounded-lg border border-rule bg-panel p-4">
            <h3 className="text-sm font-semibold text-ink mb-2">BOM产业分析</h3>
            <p className="text-xs text-ink-2 leading-relaxed">{bomInsight || "暂无BOM分析数据"}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {supplyRelations && supplyRelations.map((r, i) => (
                <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded-full border ${r.verified ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-600 border-amber-200"}`}>
                  {r.customer}({r.hq}) {r.verified ? "✓" : "⚡"}
                </span>
              ))}
            </div>
          </div>

          {/* 供应链关系图谱 */}
          <div className="rounded-lg border border-rule bg-panel p-4">
            <h3 className="text-sm font-semibold text-ink mb-3">供应链关系图谱</h3>
            <SupplyGraph graph={{
              nodes: [
                { id: code, name, type: "company" as const },
                ...(supplyRelations || []).slice(0, 5).map((r, i) => ({ id: r.customer, name: r.customer, type: "supplier" as const, group: i })),
              ],
              edges: (supplyRelations || []).slice(0, 5).map((r) => ({
                source: code, target: r.customer, type: "supplies_to" as const, label: r.product,
              })),
            }} />
          </div>
        </div>

        <div className="space-y-4">
          {/* 评估说明 */}
          <div className="rounded-lg border border-rule bg-panel p-4">
            <h3 className="text-sm font-semibold text-ink mb-2">评估说明</h3>
            <div className="space-y-1.5 text-xs text-ink-2 leading-relaxed">
              <p>基于贝叶斯框架 P(H|E) = P(E|H) × P(H) / P(E)</p>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>先验 P(H)</strong>: {(prior * 100).toFixed(0)}% — BOM产业分析</li>
                <li><strong>后验 P(H|E)</strong>: {(posterior * 100).toFixed(0)}% — 证据更新后</li>
                <li><strong>认知差</strong>: {cognitiveGap != null ? `${cognitiveGap >= 0 ? "+" : ""}${(cognitiveGap * 100).toFixed(0)}%` : "--"} — 后验 vs 市场定价</li>
                <li><strong>海外收入</strong>: {(overseasRatio * 100).toFixed(0)}%</li>
              </ul>
            </div>
          </div>

          {/* 风险事件 */}
          <div className="rounded-lg border border-rule bg-panel p-4">
            <h3 className="text-sm font-semibold text-ink mb-2">风险事件</h3>
            <RiskEvents events={[
              ...(changePercent != null && Math.abs(changePercent) > 5 ? [{ date: new Date().toISOString().split("T")[0], type: "产能不足" as const, title: `当日涨跌幅 ${changePercent.toFixed(1)}%`, impact: "high" as const }] : []),
              ...(pe != null && pe > 80 ? [{ date: new Date().toISOString().split("T")[0], type: "产能不足" as const, title: `PE ${pe.toFixed(0)}倍，估值偏高`, impact: "medium" as const }] : []),
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}
