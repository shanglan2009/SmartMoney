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

interface LiveData {
  code: string;
  name: string;
  industry: string;
  price: number | null;
  changePercent: number | null;
  pe: number | null;
  score: number;
  rating: string;
  action: string;
  buySignal: number;
  sellSignal: number;
  dimensions: { name: string; score: number; weight: number }[];
  suppliers: { name: string; ratio: number; industry?: string; financialHealth?: string }[];
  prior: number;
  posterior: number;
  confidence: number;
  bottleneckType: string[];
  mispricing: number;
  mispricingSignal: string;
  rotationScore: number;
  marketImpliedProb?: number;
}

export default function StockPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [data, setData] = useState<LiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async (force = false) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/scores?code=${code}${force ? "&refresh=true" : ""}`, {
        signal: AbortSignal.timeout(10000),
      });
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

  useEffect(() => {
    loadData();
  }, [code]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 animate-pulse">
        <div className="h-8 w-48 rounded bg-paper-3" />
        <div className="h-4 w-32 rounded bg-paper-3" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="h-12 w-12 text-muted" />
        <p className="text-lg text-muted">未找到股票代码: {code}</p>
        <p className="text-xs text-muted">{error}</p>
        <div className="flex gap-2">
          <Link href="/" className="text-sm text-accent hover:underline px-3 py-1.5">返回首页</Link>
          <button onClick={() => loadData(true)} className="text-sm text-accent hover:underline px-3 py-1.5 border border-rule rounded-full">
            重试
          </button>
        </div>
      </div>
    );
  }

  const { name, industry, price, changePercent, score, rating, action, buySignal, sellSignal } = data;
  const dimensions = data.dimensions || [];
  const suppliers = data.suppliers || [];

  // Mock data for graph and events (these aren't in the live API yet)
  const mockGraph = {
    nodes: [
      { id: code, name, type: "company" as const },
      ...suppliers.slice(0, 5).map((s, i) => ({ id: s.name, name: s.name, type: "supplier" as const, group: i })),
    ],
    edges: suppliers.slice(0, 5).map((s) => ({
      source: s.name, target: code, type: "supplies_to" as const, amount: s.ratio,
    })),
  };

  const formatPct = (v: number | null) => {
    if (v === null || v === undefined) return "--";
    return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
  };

  const formatMoney = (v: number | null) => {
    if (v === null) return "--";
    return `¥${v.toFixed(2)}`;
  };

  const actionColors: Record<string, string> = {
    "强烈买入": "bg-emerald-50 text-emerald-700 border-emerald-300",
    "买入": "bg-green-50 text-green-600 border-green-300",
    "持有": "bg-slate-50 text-slate-600 border-slate-300",
    "减仓": "bg-amber-50 text-amber-600 border-amber-300",
    "卖出": "bg-red-50 text-red-600 border-red-300",
  };

  return (
    <div>
      {/* Back & Header */}
      <div className="mb-4">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink transition-colors mb-2">
          <ArrowLeft className="h-4 w-4" />
          返回总览
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold text-ink">{name}</h1>
          <span className="font-mono text-sm text-muted bg-paper-3 px-2 py-0.5 rounded">{code}</span>
          <span className="text-sm text-muted">{industry}</span>
          <RatingBadge rating={rating as RatingLevel} size="lg" />
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 mb-4">
        <ScoreGauge score={score} rating={rating as RatingLevel} />
        
        <div className="rounded-lg border border-rule bg-panel p-4">
          <h3 className="text-xs font-medium text-muted uppercase tracking-wide mb-2">实时行情</h3>
          <p className="text-2xl font-bold text-ink">{formatMoney(price)}</p>
          <p className={`text-sm font-medium ${(changePercent ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
            {formatPct(changePercent)}
          </p>
          {data.pe && <p className="text-xs text-muted mt-1">PE: {data.pe.toFixed(1)}</p>}
        </div>

        <div className="rounded-lg border border-rule bg-panel p-4">
          <h3 className="text-xs font-medium text-muted uppercase tracking-wide mb-2">贝叶斯指标</h3>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-xs text-ink-2">后验 P(H|E)</span>
              <span className="text-xs font-bold text-ink">{(data.posterior * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-ink-2">置信度</span>
              <span className="text-xs font-bold text-ink">{data.confidence}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-ink-2">认知差</span>
              <span className={`text-xs font-bold ${(data.mispricing ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                {(data.mispricing ?? 0) >= 0 ? "+" : ""}{(data.mispricing ?? 0) * 100 > 1 ? ">" : ""}
                {((data.mispricing ?? 0) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-rule bg-panel p-4">
          <h3 className="text-xs font-medium text-muted uppercase tracking-wide mb-2">操作建议</h3>
          <p className={`text-lg font-bold ${action.includes("买入") ? "text-green-600" : action.includes("卖") ? "text-red-600" : "text-ink"}`}>
            {action}
          </p>
          <div className="flex gap-2 mt-1">
            <span className="text-[10px] text-muted bg-paper-3 px-1.5 py-0.5 rounded">
              买入信号 {buySignal}
            </span>
            <span className="text-[10px] text-muted bg-paper-3 px-1.5 py-0.5 rounded">
              卖出信号 {sellSignal}
            </span>
          </div>
          {data.bottleneckType && data.bottleneckType.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {data.bottleneckType.map((b: string) => (
                <span key={b} className="text-[9px] text-amber-600 bg-amber-50 px-1 py-0.5 rounded">
                  {b}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {dimensions.length > 0 && (
            <div className="rounded-lg border border-rule bg-panel p-4">
              <h3 className="text-sm font-semibold text-ink mb-3">评分维度</h3>
              <RadarChart dimensions={dimensions} />
            </div>
          )}

          {suppliers.length > 0 && (
            <div className="rounded-lg border border-rule bg-panel p-4">
              <h3 className="text-sm font-semibold text-ink mb-3">核心供应商</h3>
              <SupplierTable suppliers={suppliers.map(s => ({ ...s, id: s.name, isListed: false, financialHealth: (s.financialHealth || "normal") as "healthy" | "normal" | "risky" }))} />
            </div>
          )}

          <div className="rounded-lg border border-rule bg-panel p-4">
            <h3 className="text-sm font-semibold text-ink mb-3">供应链关系图谱</h3>
            <SupplyGraph graph={mockGraph} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-rule bg-panel p-4">
            <h3 className="text-sm font-semibold text-ink mb-2">评估说明</h3>
            <div className="space-y-2 text-xs text-ink-2 leading-relaxed">
              <p>本评分基于贝叶斯框架：</p>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>先验概率 P(H)</strong>: {(data.prior * 100).toFixed(0)}% — 基于BOM拆解和供应商结构</li>
                <li><strong>后验概率 P(H|E)</strong>: {(data.posterior * 100).toFixed(0)}% — 更新后信念</li>
                <li><strong>置信度</strong>: {data.confidence}/100 — 证据越充分越自信</li>
                <li><strong>市场隐含概率</strong>: {data.marketImpliedProb !== undefined ? (data.marketImpliedProb * 100).toFixed(0) : "--"}% — 从PE反推</li>
                <li><strong>认知差</strong>: {data.mispricing !== undefined ? `${(data.mispricing > 0 ? "+" : "")}${(data.mispricing * 100).toFixed(0)}%` : "--"}</li>
                <li><strong>轮动分数</strong>: {data.rotationScore ?? "--"}/100</li>
              </ul>
            </div>
          </div>

          <div className="rounded-lg border border-rule bg-panel p-4">
            <h3 className="text-sm font-semibold text-ink mb-2">风险事件</h3>
            <RiskEvents events={[
              ...(data.changePercent !== null && Math.abs(data.changePercent) > 5
                ? [{ date: new Date().toISOString().split("T")[0], type: "原材料涨价" as const, title: `当日涨跌幅 ${data.changePercent.toFixed(1)}%`, impact: "high" as const }]
                : []),
              ...(data.pe && data.pe > 80
                ? [{ date: new Date().toISOString().split("T")[0], type: "产能不足" as const, title: `市盈率 ${data.pe.toFixed(0)}倍，高于行业平均`, impact: "medium" as const }]
                : []),
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}
