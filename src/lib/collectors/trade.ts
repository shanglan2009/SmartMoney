/**
 * 海关进出口数据采集器
 * ✅ 数据源: data.stats.gov.cn 国家统计局免费API
 * ❌ 删除: customs.gov.cn（需要反爬虫）
 */

import type { TradeData, Evidence } from "./types";

const HS_MAP: Record<string, string[]> = {
  "芯片": ["854231", "854232", "854233"],
  "光模块": ["851762"],
  "锂电池": ["850760"],
  "光伏": ["854140"],
  "PCB": ["853400"],
};

export async function fetchTradeData(industry: string): Promise<TradeData[]> {
  const hscodes = HS_MAP[industry];
  if (!hscodes) return [];

  const results: TradeData[] = [];
  for (const hs of hscodes) {
    try {
      const url = `https://data.stats.gov.cn/easyquery.htm?m=QueryData&dbcode=hg01&rowcode=reg&colcode=sj&wds=[]&dfwds=[{"wdcode":"zb","valuecode":"A0${hs}"},{"wdcode":"sj","valuecode":"202605"}]`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        results.push({
          date: "2026-05", hsCode: hs,
          exportAmount: parseFloat(data?.data?.[0]?.data?.[0]?.value || "0") / 1e8,
          importAmount: 0, yoyChange: parseFloat(data?.data?.[0]?.data?.[1]?.value || "0"),
          source: "国家统计局",
        });
      }
    } catch {}
  }
  return results;
}

export function tradeToEvidences(tradeData: TradeData[]): Evidence[] {
  if (tradeData.length === 0) return [];
  const avgYoy = tradeData.reduce((s, t) => s + t.yoyChange, 0) / tradeData.length;
  if (avgYoy > 20) return [{ date: tradeData[0].date, source: "进出口" as const, type: "正面" as const, description: `出口同比+${avgYoy.toFixed(1)}%，需求强劲`, strength: "中" as const, likelihood: 0.55, falsePositive: 0.30 }];
  return [];
}
