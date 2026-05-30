/**
 * 统一证据收集器 v2（简化版）
 * 
 * ✅ 所有数据源: 免费公开API，无反爬虫
 * ❌ 已删除: 招标平台爬虫、海关官网爬虫
 * 
 * 策略:
 * - 价格证据: 每次请求实时（1分钟缓存）
 * - 结构性证据: 首次加载后缓存（全球供应链关系、BOM先验）
 */

import type { Evidence } from "./types";
import { GLOBAL_STOCKS } from "../globalStocks";
import { getSupplyRelations, supplyRelationsToEvidences } from "./globalTrade";

let cache: { evidences: Evidence[]; timestamp: number } | null = null;
const CACHE_TTL = 60_000; // 1分钟

/** 价格证据（实时生成，不依赖外部API） */
function generatePriceEvidence(changePercent: number | null, pe: number | null): Evidence[] {
  const evs: Evidence[] = [];
  if (changePercent !== null) {
    if (changePercent > 8) evs.push({ date: "", source: "价格动量" as any, type: "正面" as any, strength: "强" as any, description: `月涨${changePercent.toFixed(1)}%`, likelihood: 0.65, falsePositive: 0.25 });
    else if (changePercent < -8) evs.push({ date: "", source: "价格动量" as any, type: "反面" as any, strength: "强" as any, description: `月跌${Math.abs(changePercent).toFixed(1)}%`, likelihood: 0.60, falsePositive: 0.25 });
  }
  return evs;
}

/** 获取所有证据（包含结构化+实时） */
export async function collectAllEvidences(): Promise<{
  evidences: Evidence[]; sourceStats: Record<string, number>
}> {
  const allEvidences: Evidence[] = [];
  const stats: Record<string, number> = {};

  // 1. 全球供应链关系（结构化数据，无外部调用）
  for (const stock of GLOBAL_STOCKS) {
    const rels = getSupplyRelations(stock.code);
    if (rels.length > 0) {
      allEvidences.push(...supplyRelationsToEvidences(rels));
    }
  }
  stats["全球供应链"] = allEvidences.filter(e => e.source === "全球供应链").length;

  return { evidences: allEvidences, sourceStats: stats };
}

/** 获取某只股票的聚合证据 */
export function getEvidencesForStock(
  code: string, changePercent: number | null, pe: number | null
): Evidence[] {
  // 结构化证据 + 价格证据
  const rels = getSupplyRelations(code);
  const structEvs = supplyRelationsToEvidences(rels);
  const priceEvs = generatePriceEvidence(changePercent, pe);
  return [...structEvs, ...priceEvs];
}
