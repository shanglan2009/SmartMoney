/**
 * 数据服务 — 实时行情 + 供应链分析
 *
 * 数据层级:
 * 1. 实时行情 → 东方财富 API (通过 Next.js API 代理)
 * 2. 财务/供应链数据 → 本地 Mock (后续接入真实API)
 */

import { getStockAnalysis, getStockList } from "./mockData";
import type { StockAnalysisResponse, StockListItem } from "./types";

// ========== 实时行情 ==========

interface QuoteData {
  code: string;
  name: string;
  price: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  turnoverRate: number;
  pe: number;
  totalMarketCap: number;
  circulatingMarketCap: number;
}

let quotesCache: Record<string, QuoteData> | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 30_000; // 30秒

async function fetchQuotes(): Promise<Record<string, QuoteData>> {
  const now = Date.now();
  if (quotesCache && now - lastFetchTime < CACHE_TTL) {
    return quotesCache;
  }

  try {
    const res = await fetch("/api/data", { signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    if (data.quotes) {
      quotesCache = data.quotes;
      lastFetchTime = now;
    }
    return data.quotes || {};
  } catch {
    return quotesCache || {};
  }
}

// ========== 对外接口 ==========

export interface LiveStockItem extends StockListItem {
  price?: number;
  liveChange?: string;
}

/** 获取带实时行情的股票列表 */
export async function getLiveStockList(): Promise<LiveStockItem[]> {
  const [mockList, quotes] = await Promise.all([
    Promise.resolve(getStockList()),
    fetchQuotes(),
  ]);

  return mockList.map((stock) => {
    const q = quotes[stock.code];
    if (!q) return stock;

    const changeStr =
      q.changePercent > 0
        ? `+${q.changePercent.toFixed(2)}%`
        : `${q.changePercent.toFixed(2)}%`;

    return {
      ...stock,
      price: q.price,
      liveChange: changeStr,
      priceChange: changeStr, // 覆盖 mock 的静态数据
    };
  });
}

/** 获取带实时行情的个股分析 */
export async function getLiveStockAnalysis(
  code: string
): Promise<(StockAnalysisResponse & { liveQuote?: QuoteData }) | null> {
  const [mockData, quotes] = await Promise.all([
    Promise.resolve(getStockAnalysis(code)),
    fetchQuotes(),
  ]);

  if (!mockData) return null;

  return {
    ...mockData,
    liveQuote: quotes[code] || undefined,
  };
}
