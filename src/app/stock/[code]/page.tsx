"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, Info } from "lucide-react";
import { getStockAnalysis } from "@/lib/mockData";
import type { StockAnalysisResponse } from "@/lib/types";
import RatingBadge from "@/components/RatingBadge";
import ScoreGauge from "@/components/StockPage/ScoreGauge";
import RadarChart from "@/components/StockPage/RadarChart";
import SupplierTable from "@/components/StockPage/SupplierTable";
import SupplyGraph from "@/components/StockPage/SupplyGraph";
import RiskEvents from "@/components/StockPage/RiskEvents";
import RatingHistory from "@/components/StockPage/RatingHistory";

export default function StockPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const data: StockAnalysisResponse | null = getStockAnalysis(code);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="h-12 w-12 text-muted" />
        <p className="text-lg text-muted">未找到股票代码: {code}</p>
        <Link href="/" className="text-sm text-accent hover:underline">
          返回首页
        </Link>
      </div>
    );
  }

  const { company, score, suppliers, topCustomers, graph, events, history } = data;

  return (
    <div>
      {/* Back & Header */}
      <div className="mb-4">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink transition-colors mb-2">
          <ArrowLeft className="h-4 w-4" />
          返回总览
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold text-ink">{company.name}</h1>
          <span className="font-mono text-sm text-muted bg-paper-3 px-2 py-0.5 rounded">{company.code}</span>
          <span className="text-sm text-muted">{company.industry}</span>
          <span className="text-xs text-muted bg-paper-3 px-2 py-0.5 rounded">{company.market}</span>
          <RatingBadge rating={score.rating} size="lg" />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left Column - Score + Dimensions */}
        <div className="lg:col-span-2 space-y-4">
          {/* Score Gauge + Key Metrics Row */}
          <div className="grid sm:grid-cols-2 gap-4">
            <ScoreGauge score={score.overall} rating={score.rating} />
            <div className="rounded-lg border border-rule bg-panel p-4">
              <h3 className="text-xs font-medium text-muted uppercase tracking-wide mb-3">关键财务指标</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-ink-2">营收</span>
                  <span className="text-sm font-medium text-ink">¥{company.revenue?.toFixed(1)}亿</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-ink-2">营收同比</span>
                  <span className={`text-sm font-medium ${(company.revenueYoy ?? 0) > 0 ? "text-green-600" : "text-red-600"}`}>
                    {((company.revenueYoy ?? 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-ink-2">毛利率</span>
                  <span className="text-sm font-medium text-ink">{((company.grossMargin ?? 0) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-ink-2">研发费用</span>
                  <span className="text-sm font-medium text-ink">¥{company.rdExpense?.toFixed(1)}亿</span>
                </div>
              </div>
            </div>
          </div>

          {/* Radar Chart - 6 Dimensions */}
          <div className="rounded-lg border border-rule bg-panel p-4">
            <h3 className="text-sm font-semibold text-ink mb-3">供应链评分维度</h3>
            <RadarChart dimensions={score.dimensions} />
          </div>

          {/* Supplier Table */}
          <div className="rounded-lg border border-rule bg-panel p-4">
            <h3 className="text-sm font-semibold text-ink mb-3">核心供应商</h3>
            <SupplierTable suppliers={suppliers} />
          </div>

          {/* Supply Chain Graph */}
          <div className="rounded-lg border border-rule bg-panel p-4">
            <h3 className="text-sm font-semibold text-ink mb-3">供应链关系图谱</h3>
            <p className="text-xs text-muted mb-3">节点大小表示交易金额，连线粗细表示依赖程度</p>
            <SupplyGraph graph={graph} />
          </div>
        </div>

        {/* Right Column - Events + History + Customers */}
        <div className="space-y-4">
          {/* Risk Events */}
          <div className="rounded-lg border border-rule bg-panel p-4">
            <h3 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              近期风险事件
            </h3>
            <RiskEvents events={events} />
          </div>

          {/* Rating History */}
          <div className="rounded-lg border border-rule bg-panel p-4">
            <h3 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted" />
              评级变化历史
            </h3>
            <RatingHistory history={history} />
          </div>

          {/* Customer Concentration */}
          <div className="rounded-lg border border-rule bg-panel p-4">
            <h3 className="text-sm font-semibold text-ink mb-3">下游客户集中度</h3>
            <div className="space-y-2">
              {topCustomers.map((c, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-sm text-ink-2">{c.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-paper-3 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full"
                        style={{ width: `${c.ratio * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted font-mono">{(c.ratio * 100).toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assessment Detail */}
          <div className="rounded-lg border border-rule bg-panel p-4">
            <h3 className="text-sm font-semibold text-ink mb-2 flex items-center gap-2">
              <Info className="h-4 w-4 text-muted" />
              评估说明
            </h3>
            <p className="text-xs text-ink-2 leading-relaxed">
              本评级基于供应链六维度模型：供应商集中度(25%)、可替代性(20%)、财务健康度(15%)、进口依赖度(15%)、议价能力(15%)、下游客户集中度(10%)。
              综合评分 <strong className="text-ink">{score.overall}</strong> 分，评级为 <strong>{score.rating}</strong>。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
