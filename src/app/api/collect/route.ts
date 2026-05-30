/**
 * 5源数据采集 + 贝叶斯评分 统一API
 */

import { NextResponse } from "next/server";
import { GLOBAL_STOCKS } from "@/lib/globalStocks";
import { collectAllEvidences, getEvidencesForStock } from "@/lib/collectors";
import { sequentialUpdate as sequentialBayesian, bomPrior, marketImpliedProb as marketImplied, calcConfidence, getRating } from "@/lib/bayesianEngine";

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
  const force = url.searchParams.has("refresh");

  // 1. 获取实时行情
  const quotes = await fetchQuotes();

  // 2. 采集5源证据
  const { evidences, sourceStats } = await collectAllEvidences(force);

  // 3. 计算每只股票的贝叶斯评分
  const results = GLOBAL_STOCKS.map((stock) => {
    const q = quotes[stock.code] || {};
    const changePercent = q.changePercent ?? null;
    const pe = q.pe ?? null;

    // 先验 P(H) - BOM分析
    const priorResult = bomPrior(stock);
    
    // 证据 - 合并5源数据+价格信号
    const stockEvidences = getEvidencesForStock(evidences, stock.code, changePercent, pe);
    
    // 后验更新
    const posterior = sequentialBayesian(priorResult.prior, stockEvidences);
    const confidence = calcConfidence(stockEvidences.length);
    const mktImplied = marketImplied(pe, priorResult.prior);
    const cognitiveGap = Math.round((posterior - mktImplied) * 10000) / 10000;
    const rotationScore = Math.min(100, Math.round(posterior * 35 + (confidence / 100) * 30 + Math.abs(cognitiveGap) * 35));
    const rating = getRating(posterior);

    return {
      code: stock.code,
      name: stock.name,
      industry: stock.industry,
      overseasRatio: stock.overseasRatio,
      moatLevel: stock.moatLevel,
      prior: priorResult.prior,
      bomInsight: priorResult.breakdown.bomInsight,
      posterior,
      confidence,
      cognitiveGap,
      marketImplied: mktImplied,
      rotationScore,
      rating,
      price: q.price ?? null,
      changePercent,
      pe,
      evidenceCount: stockEvidences.length,
      evidenceBreakdown: {
        公告: stockEvidences.filter(e => e.source === "公告").length,
        专利: stockEvidences.filter(e => e.source === "专利").length,
        招标: stockEvidences.filter(e => e.source === "招标").length,
        进出口: stockEvidences.filter(e => e.source === "进出口").length,
        大宗商品: stockEvidences.filter(e => e.source === "大宗商品").length,
      },
    };
  }).sort((a, b) => b.rotationScore - a.rotationScore);

  if (code) {
    const item = results.find(r => r.code === code);
    return NextResponse.json(item || { error: "Not found" }, { status: item ? 200 : 404 });
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    count: results.length,
    evidenceCount: evidences.length,
    sourceStats,
    stocks: results,
  });
}
