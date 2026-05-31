/**
 * 贝叶斯供应链评分 API v6（简化版）
 * 
 * 数据源:
 * ✅ 东方财富实时行情 — 免费公开API
 * ✅ 全球供应链关系数据库 — 结构化数据
 * ✅ BOM行业先验 — 内置知识库
 */

import { NextResponse } from "next/server";
import { GLOBAL_STOCKS } from "@/lib/globalStocks";
import { collectAllEvidences, getEvidencesForStock } from "@/lib/collectors";
import { sequentialUpdate as sequentialBayesian, bomPrior, marketImpliedProb as marketImplied, calcConfidence, getRating } from "@/lib/bayesianEngine";
import { getSupplyRelations, getRegionBreakdown, getRegionSummary } from "@/lib/collectors/globalTrade";
import { fetchBatchFinancial } from "@/lib/collectors/financial";

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
      `https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&fields=f2,f3,f12,f14,f20,f9&secids=${secids}`,
      { headers: { "User-Agent": "Mozilla/5.0", Referer: "https://quote.eastmoney.com/" }, signal: AbortSignal.timeout(10000) }
    );
    const data = await res.json();
    if (data?.data?.diff) {
      quotesCache = {};
      for (const item of data.data.diff) {
        quotesCache[String(item.f12)] = { price: item.f2, changePercent: item.f3, pe: item.f21 };
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
  const { evidences, sourceStats } = await collectAllEvidences();
  const financialData = await fetchBatchFinancial(GLOBAL_STOCKS.map(s => s.code));

  const results = GLOBAL_STOCKS.map((stock) => {
    const q = quotes[stock.code] || {};
    const changePercent = q.changePercent ?? null;
    const pe = q.pe ?? null;
    const { prior, breakdown } = bomPrior(stock);
    const stockEvidences = getEvidencesForStock(stock.code, changePercent, pe);
    const posterior = sequentialBayesian(prior, stockEvidences);
    const confidence = calcConfidence(stockEvidences.length);
    const mktImplied = marketImplied(pe, prior);
    const cognitiveGap = Math.round((posterior - mktImplied) * 10000) / 10000;
    const rotationScore = Math.min(100, Math.round(posterior * 35 + (confidence / 100) * 30 + Math.abs(cognitiveGap) * 35));
    const rating = getRating(posterior);
    const relations = getSupplyRelations(stock.code);

    return {
      code: stock.code, name: stock.name, industry: stock.industry,
      overseasRatio: stock.overseasRatio, moatLevel: stock.moatLevel,
      prior, bomInsight: breakdown.bomInsight, posterior, confidence,
      cognitiveGap, marketImplied: mktImplied, rotationScore, rating,
      price: q.price ?? null, changePercent, pe,
      evidenceCount: stockEvidences.length,
      supplyRelations: relations.map(r => ({ customer: r.customer, hq: r.customerHQ, product: r.product, verified: r.isVerified })),
      financial: financialData[stock.code] || null,
    };
  }).sort((a, b) => b.rotationScore - a.rotationScore);

  if (code) {
    const item = results.find(r => r.code === code);
    return NextResponse.json(item || { error: "Not found" }, { status: item ? 200 : 404 });
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    count: results.length,
    sourceStats,
    regionSummary: getRegionSummary(),
    stocks: results,
  });
}
