/**
 * 巨潮资讯网 — A股公告采集器
 * ✅ 数据源: cninfo.com.cn 官方公开API（免费，无需反爬）
 * 接口: https://www.cninfo.com.cn/new/disclosure/stock?stockCode=XXX
 */

import type { Announcement, Evidence } from "./types";

const CACHE = new Map<string, { data: Announcement[]; time: number }>();
const CACHE_TTL = 6 * 60 * 60 * 1000;

export async function fetchAnnouncements(code: string): Promise<Announcement[]> {
  const cached = CACHE.get(code);
  if (cached && Date.now() - cached.time < CACHE_TTL) return cached.data;

  try {
    const url = `https://www.cninfo.com.cn/new/disclosure/stock?stockCode=${code}&pageNum=1&pageSize=10&tabName=fulltext`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", Referer: "https://www.cninfo.com.cn/" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];

    const data = await res.json();
    const items = data?.classifiedAnnouncements?.flatMap((c: any) => c.announcements || []) || [];
    const announcements = items.slice(0, 8).map((a: any) => {
      const title = a.announcementTitle || "";
      const isPositive = !title.includes("风险") && !title.includes("诉讼") && !title.includes("停产");
      return {
        date: (a.announcementDate || "").substring(0, 10),
        title,
        type: (title.includes("中标") || title.includes("合同")) ? "重大合同" as const : "业绩预告" as const,
        stockCode: code,
        amount: undefined,
        isPositive,
        source: "巨潮资讯网",
      };
    });

    CACHE.set(code, { data: announcements, time: Date.now() });
    return announcements;
  } catch { return []; }
}

export async function fetchBatchAnnouncements(codes: string[]): Promise<Announcement[]> {
  const results: Announcement[] = [];
  const batchSize = 3;
  for (let i = 0; i < codes.length; i += batchSize) {
    const batch = await Promise.all(codes.slice(i, i + batchSize).map(fetchAnnouncements));
    batch.forEach(r => results.push(...r));
  }
  return results;
}

export function announcementsToEvidences(announcements: Announcement[]): Evidence[] {
  return announcements.map(a => ({
    date: a.date, source: "公告" as const,
    type: a.isPositive ? "正面" as const : "反面" as const,
    stockCode: a.stockCode,
    description: a.title.substring(0, 40),
    strength: "中" as const,
    likelihood: 0.55, falsePositive: 0.30,
  }));
}
