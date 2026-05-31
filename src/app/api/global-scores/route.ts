/**
 * 贝叶斯供应链瓶颈评分 API
 * 
 * 基于P(H|E) = P(E|H)×P(H) / P(E) 的序贯更新
 */

import { NextResponse } from "next/server";
import { GLOBAL_STOCKS } from "@/lib/globalStocks";
import { getAllBayesianScores } from "@/lib/bayesianEngine";

let quotesCache: Record<string, any> = {};
let cacheTime = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 每天刷新一次

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
      `https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&fields=f2,f3,f12,f14,f20,f9&secids=${secids}`,
      { headers: { "User-Agent": "Mozilla/5.0", Referer: "https://quote.eastmoney.com/" },
        signal: AbortSignal.timeout(10000) }
    );
    const data = await res.json();
    if (data?.data?.diff) {
      quotesCache = {};
      for (const item of data.data.diff) {
        quotesCache[String(item.f12)] = {
          price: item.f2, changePercent: item.f3, pe: item.f21,
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

  const quotes = await fetchQuotes();
  const scores = getAllBayesianScores(quotes);

  const result = scores.map((s) => ({
    ...s,
    price: quotes[s.code]?.price ?? null,
    changePercent: quotes[s.code]?.changePercent ?? null,
    pe: quotes[s.code]?.pe ?? null,
    // 简化证据输出（前端不需要完整的每条证据详情）
    evidenceCount: s.evidences.length,
    positiveEvidence: s.evidences.filter(e => e.type === "正面").length,
    negativeEvidence: s.evidences.filter(e => e.type === "反面").length,
    topEvidence: s.evidences.slice(0, 2).map(e => e.description),
    evidences: undefined, // 移除详细证据
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
