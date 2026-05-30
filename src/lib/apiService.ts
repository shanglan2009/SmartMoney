/**
 * 数据服务 — 实时行情 + 供应链评分（自动刷新）
 * 
 * 数据流:
 * 1. 前端请求 /api/scores
 * 2. API 检查缓存（1小时过期）
 * 3. 过期则拉取东方财富 → 评分引擎 → 更新缓存
 * 4. 返回最新评分 + 行情数据
 */

import type { RatingLevel } from "./types";

// ========== 类型定义 ==========

export interface LiveStockItem {
  code: string;
  name: string;
  industry: string;
  category: string;
  score: number;
  rating: RatingLevel;
  action: string;
  buySignal: number;
  sellSignal: number;
  price: number | null;
  changePercent: number | null;
  priceChange: string;
  signal: string;
  lastUpdated: string;
}

export interface LiveStockDetail extends LiveStockItem {
  pe: number | null;
  dimensions: { name: string; score: number; weight: number }[];
  suppliers: { name: string; ratio: number; industry?: string; financialHealth?: string }[];
  updatedAt: string;
}

// ========== 信号描述生成 ==========

function generateSignal(score: number, industry: string, changePercent: number | null): string {
  if (score >= 85) return "供应链极其脆弱，建议高度警惕";
  if (score >= 70) return "供应链风险显著，上游依赖度高";
  if (score >= 55) return "供应商结构需关注，替代选择有限";
  if (changePercent !== null && changePercent > 5) return "价格强势，关注供应链支撑";
  if (score >= 20) return "供应链整体健康，风险可控";
  return "供应链优势明显，供应商竞争充分";
}

// ========== 缓存系统 ==========

let scoreCache: LiveStockItem[] | null = null;
interface DetailCache {
  [code: string]: LiveStockDetail;
}
let detailCache: DetailCache = {};
let lastFetchTime = 0;
const CACHE_TTL = 60_000; // 前端缓存60秒（API层已有1小时缓存）

// ========== 获取全部股票列表 ==========

export async function getLiveStockList(): Promise<LiveStockItem[]> {
  const now = Date.now();
  if (scoreCache && now - lastFetchTime < CACHE_TTL) {
    return scoreCache;
  }

  try {
    const res = await fetch("/api/scores", { signal: AbortSignal.timeout(10000) });
    const data = await res.json();

    if (data.stocks && Array.isArray(data.stocks)) {
      scoreCache = data.stocks.map((s: any) => ({
        code: s.code,
        name: s.name,
        industry: s.industry,
        category: s.category,
        score: s.score,
        rating: s.rating as RatingLevel,
        action: s.action || "",
        buySignal: s.buySignal || 0,
        sellSignal: s.sellSignal || 0,
        price: s.price,
        changePercent: s.changePercent,
        priceChange: s.changePercent !== null
          ? `${s.changePercent > 0 ? "+" : ""}${s.changePercent.toFixed(2)}%`
          : "--",
        signal: generateSignal(s.score, s.industry, s.changePercent),
        lastUpdated: s.updatedAt,
      }));
      lastFetchTime = now;
      // 同时缓存详情
      data.stocks.forEach((s: any) => {
        detailCache[s.code] = s;
      });
    }
    return scoreCache || [];
  } catch {
    return scoreCache || [];
  }
}

// ========== 获取个股详情 ==========

export async function getLiveStockAnalysis(code: string): Promise<LiveStockDetail | null> {
  // 先尝试从缓存取
  if (detailCache[code]) return detailCache[code];

  try {
    const res = await fetch(`/api/scores?code=${code}`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code) {
      detailCache[code] = data;
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

// ========== 手动刷新 ==========

export async function forceRefresh(): Promise<void> {
  scoreCache = null;
  detailCache = {};
  lastFetchTime = 0;
  await getLiveStockList();
}
