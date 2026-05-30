/**
 * 全球供应链分工评分 API v4
 * 
 * 评分维度: 海外收入(30%) | 国际供应链地位(25%) | 护城河(20%) | 研发强度(15%) | 客户分散度(10%)
 */

import { NextResponse } from "next/server";
import { getAllScores } from "@/lib/globalScoring";
import { GLOBAL_STOCKS } from "@/lib/globalStocks";

// 东方财富实时行情缓存
let quotesCache: Record<string, any> = {};
let cacheTime = 0;
const CACHE_TTL = 60_000;

function secid(code: string) {
  return code.startsWith("6") || code.startsWith("9") ? `1.${code}` : `0.${code}`;
}

async function fetchQuotes(): Promise<Record<string, any>> {
  const now = Date.now();
  if (now - cacheTime < CACHE_TTL) return quotesCache;

  const codes = GLOBAL_STOCKS.map(s => s.code);
  const secids = codes.map(secid).join(",");
  try {
    const res = await fetch(
      `https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&fields=f2,f3,f12,f14,f20,f21&secids=${secids}`,
      { headers: { "User-Agent": "Mozilla/5.0", Referer: "https://quote.eastmoney.com/" },
        signal: AbortSignal.timeout(10000) }
    );
    const data = await res.json();
    if (data?.data?.diff) {
      quotesCache = {};
      for (const item of data.data.diff) {
        quotesCache[String(item.f12)] = {
          price: item.f2, changePercent: item.f3, pe: item.f21, turnoverRate: item.f20,
        };
      }
      cacheTime = now;
    }
  } catch {}
  return quotesCache;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  await fetchQuotes();
  const scores = getAllScores();

  const result = scores.map((s) => ({
    ...s,
    price: quotesCache[s.code]?.price ?? null,
    changePercent: quotesCache[s.code]?.changePercent ?? null,
    pe: quotesCache[s.code]?.pe ?? null,
  }));

  if (code) {
    const item = result.find((r) => r.code === code);
    return NextResponse.json(item || { error: "Not found" }, { status: item ? 200 : 404 });
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    count: result.length,
    stocks: result,
  });
}
