/**
 * 大宗商品价格 + 供应链预警 实时数据 API
 * 
 * 数据来源: 东方财富期货行情
 * 缓存: 10分钟
 */

import { NextResponse } from "next/server";
import {
  getAllMaterialPrices,
  getSupplyAlerts,
  getMaterialImpactScore,
  MATERIAL_MAP,
} from "@/lib/supplyChainCollector";

export async function GET() {
  try {
    const prices = await getAllMaterialPrices();
    const alerts = getSupplyAlerts(prices);

    // 按行业汇总影响
    const industries = [...new Set(MATERIAL_MAP.flatMap((m) => m.industry))];
    const industryImpact: Record<string, number> = {};
    for (const ind of industries) {
      industryImpact[ind] = getMaterialImpactScore(ind, prices);
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      prices,
      alerts,
      industryImpact,
      summary: {
        totalMaterials: prices.length,
        alertCount: alerts.filter((a) => a.severity === "high").length,
        warningCount: alerts.filter((a) => a.severity === "medium").length,
        highestImpact: Object.entries(industryImpact).sort((a, b) => b[1] - a[1]).slice(0, 3),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
