/**
 * A股历史月K线数据 API
 * 
 * 来源: 东方财富 push2his API
 * 缓存: 1天（历史数据不会变）
 */

import { NextResponse } from "next/server";

const ALL_CODES = [
  "688981","002371","688041","688256","300661","603986","688008","688037","688099","688200","688627","688652",
  "300308","300502","000977","603019","002230","002065","001339","000988","000725","300476","300548","002236","300088","300231",
  "300750","300274","002074","002015","002850","301358","300953","688472",
  "600900","601985","600406","600674","600163","000690","001286","000600","600930","001376","001896","601669","601868","600089","002364",
  "002594","300124","688169","601727","601138","002384","002527","002520","002048","002815","000837","002126","600673","300751","603606","688500","688698","002353","300818","301160","003007",
  "689009","002851","920978","920839","920242",
];

function secid(code: string) {
  return code.startsWith("6") || code.startsWith("9") ? `1.${code}` : `0.${code}`;
}

// ========== 缓存系统 ==========

interface MonthKline {
  date: string;      // "2026-01"
  open: number;
  close: number;
  high: number;
  low: number;
  changePercent: number; // 月涨跌幅
}

interface StockHistory {
  code: string;
  name: string;
  klines: MonthKline[];
}

let historyCache: { data: StockHistory[]; timestamp: number } | null = null;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24小时

// ========== 获取单只股票月K线 ==========

async function fetchMonthlyKline(code: string): Promise<MonthKline[] | null> {
  const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${secid(code)}&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61&klt=103&fqt=1&end=20260530&lmt=6`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", Referer: "https://quote.eastmoney.com/" },
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    if (!data?.data?.klines) return null;
    
    return data.data.klines.map((k: string) => {
      const parts = k.split(",");
      const dateStr = parts[0]; // "2026-01-30"
      const month = dateStr.substring(0, 7); // "2026-01"
      const open = parseFloat(parts[1]);
      const close = parseFloat(parts[2]);
      return {
        date: month,
        open,
        close,
        high: parseFloat(parts[3]),
        low: parseFloat(parts[4]),
        changePercent: open > 0 ? Math.round(((close - open) / open) * 10000) / 100 : 0,
      };
    });
  } catch (e) {
    return null;
  }
}

// ========== API 接口 ==========

export async function GET(request: Request) {
  const url = new URL(request.url);
  const forceRefresh = url.searchParams.has("refresh");
  const singleCode = url.searchParams.get("code");

  // 检查缓存
  if (!forceRefresh && historyCache && Date.now() - historyCache.timestamp < CACHE_TTL) {
    if (singleCode) {
      const item = historyCache.data.find((h) => h.code === singleCode);
      return NextResponse.json(item || { error: "Not found" }, { status: item ? 200 : 404 });
    }
    return NextResponse.json({
      timestamp: new Date(historyCache.timestamp).toISOString(),
      stocks: historyCache.data,
      cached: true,
    });
  }

  console.log(`[API /api/history] Fetching history for ${ALL_CODES.length} stocks...`);
  
  // 并行获取（每次最多5个并发，避免被限流）
  const results: StockHistory[] = [];
  const batchSize = 5;
  for (let i = 0; i < ALL_CODES.length; i += batchSize) {
    const batch = ALL_CODES.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (code) => {
        const klines = await fetchMonthlyKline(code);
        return { code, name: "", klines: klines || [] };
      })
    );
    results.push(...batchResults);
    if (i + batchSize < ALL_CODES.length) {
      await new Promise((r) => setTimeout(r, 200)); // 限流
    }
  }

  console.log(`[API /api/history] Done. Got data for ${results.filter(r => r.klines.length > 0).length} stocks.`);
  
  historyCache = { data: results, timestamp: Date.now() };

  if (singleCode) {
    const item = results.find((h) => h.code === singleCode);
    return NextResponse.json(item || { error: "Not found" }, { status: item ? 200 : 404 });
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    stocks: results,
    cached: false,
  });
}
