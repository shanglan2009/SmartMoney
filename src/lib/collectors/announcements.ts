/**
 * 巨潮资讯网 - A股公告采集器
 * 接口: www.cninfo.com.cn/new/disclosure/stock?stockCode=XXX
 * 可获取: 重大合同、中标、关联交易、业绩预告
 */

import type { Announcement } from "./types";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Referer": "https://www.cninfo.com.cn/",
};

// 30只股票的公告缓存
let announcementCache: Map<string, { data: Announcement[]; time: number }> = new Map();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6小时（公告不会频繁变）

function categorize(title: string): { type: Announcement["type"]; isPositive: boolean } {
  const t = title;
  if (t.includes("中标") || t.includes("重大合同") || t.includes("战略合作")) 
    return { type: "重大合同", isPositive: true };
  if (t.includes("业绩预告") || t.includes("业绩快报")) {
    const isGood = t.includes("增长") || t.includes("扭亏") || t.includes("大幅上升");
    return { type: "业绩预告", isPositive: isGood };
  }
  if (t.includes("关联交易")) return { type: "关联交易", isPositive: true };
  if (t.includes("投资") || t.includes("收购") || t.includes("扩建"))
    return { type: "对外投资", isPositive: true };
  if (t.includes("停产") || t.includes("检修") || t.includes("诉讼") || t.includes("风险"))
    return { type: "停产检修", isPositive: false };
  return { type: "重大合同", isPositive: true };
}

export async function fetchAnnouncements(code: string): Promise<Announcement[]> {
  // 检查缓存
  const cached = announcementCache.get(code);
  if (cached && Date.now() - cached.time < CACHE_TTL) return cached.data;

  try {
    const url = `https://www.cninfo.com.cn/new/disclosure/stock?stockCode=${code}&pageNum=1&pageSize=15&tabName=fulltext`;
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];

    const data = await res.json();
    const items = data?.classifiedAnnouncements?.flatMap((c: any) => c.announcements || []) || [];

    const announcements: Announcement[] = items.slice(0, 10).map((a: any) => {
      const { type, isPositive } = categorize(a.announcementTitle || "");
      // 从标题解析金额
      const amountMatch = (a.announcementTitle || "").match(/(\d+[\.\d]*)\s*亿/);
      return {
        date: (a.announcementDate || "").substring(0, 10),
        title: a.announcementTitle || "",
        type,
        stockCode: code,
        amount: amountMatch ? parseFloat(amountMatch[1]) : undefined,
        isPositive,
        source: "巨潮资讯网",
      };
    });

    announcementCache.set(code, { data: announcements, time: Date.now() });
    return announcements;
  } catch {
    return [];
  }
}

/** 批量获取多只股票的公告 */
export async function fetchBatchAnnouncements(codes: string[]): Promise<Announcement[]> {
  const results: Announcement[] = [];
  // 并发5个
  const batchSize = 5;
  for (let i = 0; i < codes.length; i += batchSize) {
    const batch = codes.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fetchAnnouncements));
    batchResults.forEach(r => results.push(...r));
    if (i + batchSize < codes.length) await new Promise(r => setTimeout(r, 500));
  }
  return results;
}

/** 从公告生成证据 */
export function announcementsToEvidences(announcements: Announcement[]): import("./types").Evidence[] {
  return announcements.map(a => ({
    date: a.date,
    source: "公告" as const,
    type: a.isPositive ? "正面" as const : "反面" as const,
    stockCode: a.stockCode,
    description: a.title.length > 40 ? a.title.substring(0, 40) + "..." : a.title,
    strength: a.amount && a.amount > 10 ? "强" as const : "中" as const,
    likelihood: a.isPositive ? 0.65 : 0.60,
    falsePositive: a.isPositive ? 0.25 : 0.30,
  }));
}
