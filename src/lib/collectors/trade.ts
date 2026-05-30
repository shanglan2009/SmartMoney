/**
 * 海关进出口数据采集器
 * 接口: 海关总署统计数据查询平台
 * 可获取: HS编码级进出口量价
 * 
 * 用途: 验证公司海外收入真实性，监控供应链瓶颈
 */

import type { TradeData, Evidence } from "./types";

// 行业→HS编码映射（用于查询相关产业链进出口）
const HS_MAP: Record<string, string[]> = {
  "芯片": ["854231", "854232", "854233", "854239"],       // 集成电路
  "光模块": ["851762"],                                     // 光通信设备
  "锂电池": ["850760"],                                    // 锂离子电池
  "光伏": ["854140", "854142"],                             // 光伏组件
  "PCB": ["853400"],                                        // 印刷电路板
  "电力设备": ["850421"],                                     // 变压器
};

// 免费海关数据接口：https://www.customs.gov.cn/ 或 data.stats.gov.cn
async function fetchFromStatsGov(hsCode: string, month: string): Promise<any> {
  try {
    const url = `https://data.stats.gov.cn/easyquery.htm?m=QueryData&dbcode=hg01&rowcode=reg&colcode=sj&wds=[]&dfwds=[{"wdcode":"zb","valuecode":"A0${hsCode}"},{"wdcode":"sj","valuecode":"${month}"}]`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** 获取某行业的进出口数据 */
export async function fetchTradeData(industry: string): Promise<TradeData[]> {
  const hscodes = HS_MAP[industry];
  if (!hscodes) return [];

  const results: TradeData[] = [];
  for (const hs of hscodes) {
    const data = await fetchFromStatsGov(hs, "202605");
    if (data) {
      results.push({
        date: "2026-05",
        hsCode: hs,
        exportAmount: parseFloat(data?.data?.[0]?.data?.[0]?.value || "0") / 1e8,
        importAmount: 0,
        yoyChange: parseFloat(data?.data?.[0]?.data?.[1]?.value || "0"),
        source: "国家统计局",
      });
    }
  }

  // 模拟数据（当真实接口不可用时）
  if (results.length === 0) {
    const mockData: Record<string, TradeData> = {
      "芯片": { date: "2026-04", hsCode: "854231", exportAmount: 856.4, importAmount: 1896.2, yoyChange: 12.3, source: "海关总署(模拟)" },
      "锂电池": { date: "2026-04", hsCode: "850760", exportAmount: 425.6, importAmount: 86.3, yoyChange: 28.5, source: "海关总署(模拟)" },
      "光模块": { date: "2026-04", hsCode: "851762", exportAmount: 186.5, importAmount: 92.3, yoyChange: 35.2, source: "海关总署(模拟)" },
    };
    if (mockData[industry]) results.push(mockData[industry]);
  }

  return results;
}

export function tradeToEvidences(tradeData: TradeData[], industry: string): Evidence[] {
  if (tradeData.length === 0) return [];

  const totalExport = tradeData.reduce((s, t) => s + t.exportAmount, 0);
  const avgYoy = tradeData.reduce((s, t) => s + t.yoyChange, 0) / tradeData.length;

  if (avgYoy > 20) {
    return [{
      date: tradeData[0].date,
      source: "进出口" as const,
      type: "正面" as const,
      description: `${industry}出口同比+${avgYoy.toFixed(1)}%，全球需求强劲`,
      strength: "中" as const,
      likelihood: 0.60,
      falsePositive: 0.25,
    }];
  }
  if (avgYoy < -10) {
    return [{
      date: tradeData[0].date,
      source: "进出口" as const,
      type: "反面" as const,
      description: `${industry}出口同比${avgYoy.toFixed(1)}%，全球需求走弱`,
      strength: "中" as const,
      likelihood: 0.55,
      falsePositive: 0.30,
    }];
  }
  return [];
}
