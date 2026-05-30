import { NextResponse } from "next/server";

const OUR_STOCKS = [
  "688981","002371","688041","688256","300661","603986",
  "300308","300502","000977","603019","002230",
  "300750","300274","002074",
  "600900","601985","600406",
  "002594","300124","688169","601727","601138",
];

function secid(code: string) {
  return code.startsWith("6") || code.startsWith("9") ? `1.${code}` : `0.${code}`;
}

// 缓存，避免每次请求都拉取
let dataCache: any = null;
let cacheTime = 0;
const CACHE_TTL = 30_000; // 30秒

async function fetchQuotes(): Promise<Record<string, any>> {
  const secids = OUR_STOCKS.map(secid).join(",");
  const url = `https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&fields=f2,f3,f4,f5,f12,f14,f15,f16,f17,f18,f20,f21,f115,f152&secids=${secids}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", Referer: "https://quote.eastmoney.com/" },
    signal: AbortSignal.timeout(10000),
  });
  const data = await res.json();
  const result: Record<string, any> = {};
  if (data?.data?.diff) {
    for (const item of data.data.diff) {
      result[String(item.f12)] = {
        code: item.f12,
        name: item.f14,
        price: item.f2,
        changePercent: item.f3,
        high: item.f15,
        low: item.f16,
        volume: item.f5,
        turnoverRate: item.f20,
        pe: item.f21,
        totalMarketCap: item.f115,
        circulatingMarketCap: item.f152,
      };
    }
  }
  return result;
}

export async function GET() {
  const now = Date.now();
  if (dataCache && now - cacheTime < CACHE_TTL) {
    return NextResponse.json({ ...dataCache, cached: true });
  }

  try {
    const quotes = await fetchQuotes();
    dataCache = { timestamp: new Date().toISOString(), quotes, stocks: OUR_STOCKS };
    cacheTime = now;
    return NextResponse.json({ ...dataCache, cached: false });
  } catch (err: any) {
    if (dataCache) {
      return NextResponse.json({ ...dataCache, cached: true, stale: true });
    }
    return NextResponse.json({ error: "Failed to fetch data", detail: String(err) }, { status: 500 });
  }
}
