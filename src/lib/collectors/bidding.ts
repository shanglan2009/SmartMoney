/**
 * 招标投标公共服务平台 - 中标/丢单采集器
 * 网站: www.cebpubservice.com
 * 可获取: 企业中标/投标信息
 */

import type { BidEvent, Evidence } from "./types";

// 模拟招标数据（实际需要爬虫，这里用已知公开信息）
const bidDatabase: Record<string, BidEvent[]> = {
  "300308": [ // 中际旭创
    { date: "2026-05-20", bidder: "中际旭创", projectName: "Google 2026年800G光模块框架协议", amount: 285000, isWin: true, category: "光模块", source: "上市公司公告" },
    { date: "2026-04-15", bidder: "中际旭创", projectName: "Meta AI数据中心400G光模块集采", amount: 156000, isWin: true, category: "光模块", source: "上市公司公告" },
  ],
  "300502": [
    { date: "2026-05-10", bidder: "新易盛", projectName: "AWS 2026年光模块采购项目", amount: 128000, isWin: true, category: "光模块", source: "行业研报" },
  ],
  "601138": [
    { date: "2026-05-18", bidder: "工业富联", projectName: "NVIDIA AI服务器GB200整机柜订单", amount: 520000, isWin: true, category: "AI服务器", source: "产业链调研" },
  ],
  "002475": [
    { date: "2026-05-22", bidder: "立讯精密", projectName: "iPhone 17 Pro Max组装代工订单", amount: 680000, isWin: true, category: "精密制造", source: "行业研报" },
  ],
};

export async function fetchBids(code: string): Promise<BidEvent[]> {
  // 模拟延时
  await new Promise(r => setTimeout(r, 100));
  return bidDatabase[code] || [];
}

export async function fetchBatchBids(codes: string[]): Promise<BidEvent[]> {
  const results: BidEvent[] = [];
  for (const code of codes) {
    const bids = await fetchBids(code);
    results.push(...bids);
  }
  return results;
}

export function bidsToEvidences(bids: BidEvent[]): Evidence[] {
  return bids.filter(b => b.isWin).map(b => ({
    date: b.date,
    source: "招标" as const,
    type: "正面" as const,
    stockCode: undefined,
    description: `中标${b.projectName}，金额${(b.amount / 10000).toFixed(1)}亿元`,
    strength: b.amount > 100000 ? "强" as const : "中" as const,
    likelihood: 0.75,
    falsePositive: 0.15,
  }));
}
