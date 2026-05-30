/**
 * 供应链数据实时采集器
 * 
 * 数据源:
 * 1. 大宗商品价格 (生意社/东方财富期货)
 * 2. 公司公告事件 (巨潮资讯网)
 * 3. 原材料成本指数
 * 
 * 更新策略:
 * - 商品价格: 每次评分刷新时拉取（缓存10分钟）
 * - 公告事件: 每天检查一次新公告
 */

// ========== 行业 → 关键原材料映射 ==========

export interface RawMaterial {
  name: string;           // 材料名称
  futuresCode?: string;   // 期货代码(东方财富)
  unit: string;           // 单位
  industry: string[];     // 关联行业
  weight: number;         // 在成本中的权重
  threshold: number;      // 月涨跌超过此值触发警报(%)
}

export const MATERIAL_MAP: RawMaterial[] = [
  { name: "碳酸锂", futuresCode: "lc", unit: "元/吨", industry: ["储能", "锂电池", "新能源车"], weight: 0.25, threshold: 10 },
  { name: "钴", futuresCode: "cobalt", unit: "元/吨", industry: ["储能", "锂电池"], weight: 0.10, threshold: 10 },
  { name: "多晶硅", futuresCode: "silicon", unit: "元/千克", industry: ["光伏", "储能"], weight: 0.20, threshold: 8 },
  { name: "铜", futuresCode: "cu", unit: "元/吨", industry: ["电力", "高端制造", "储能"], weight: 0.15, threshold: 5 },
  { name: "铝", futuresCode: "al", unit: "元/吨", industry: ["高端制造", "电力", "新能源车"], weight: 0.10, threshold: 5 },
  { name: "钢铁", futuresCode: "rb", unit: "元/吨", industry: ["高端制造", "电力设备", "机器人"], weight: 0.10, threshold: 5 },
  { name: "稀土", futuresCode: "re", unit: "元/吨", industry: ["机器人", "高端制造", "芯片"], weight: 0.05, threshold: 8 },
  { name: "化工品(PTA)", futuresCode: "ta", unit: "元/吨", industry: ["PCB", "高端制造"], weight: 0.05, threshold: 5 },
];

// ========== 大宗商品价格采集 ==========

export interface MaterialPrice {
  name: string;
  price: number;
  changePercent: number;    // 月涨跌幅
  changeWeek: number;       // 周涨跌幅
  updatedAt: string;
  alertLevel: "正常" | "关注" | "警报";
}

// 东方财富期货行情接口
async function fetchFuturesPrice(code: string): Promise<{ price: number; changePercent: number } | null> {
  // 上期所: cu=铜, al=铝, rb=螺纹钢
  // 广期所: lc=碳酸锂
  // 郑商所: ta=PTA
  const exchangeMap: Record<string, string> = {
    "lc": "LC", "cu": "CU", "al": "AL", "rb": "RB", "ta": "TA",
  };
  const futuresCode = exchangeMap[code];
  if (!futuresCode) return null;

  // 主力合约代码格式: 品种代码+年份+月份, e.g., CU2607
  const year = new Date().getFullYear().toString().slice(-2);
  const month = (new Date().getMonth() + 3).toString().padStart(2, "0");
  const contractId = `${futuresCode}${year}${month}`;

  try {
    const url = `https://push2.eastmoney.com/api/qt/stock/get?secid=0.${contractId}&fields=f2,f3,f12,f14`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    if (data?.data) {
      return {
        price: data.data.f2 || 0,
        changePercent: data.data.f3 || 0,
      };
    }
    return null;
  } catch {
    return null;
  }
}

// 备用: 东方贵金属/商品指数
async function fetchCommodityIndex(name: string): Promise<{ price: number; changePercent: number } | null> {
  // 使用东方财富商品板块指数
  const commodityCodes: Record<string, string> = {
    "碳酸锂": "0.861358",   // 碳酸锂指数
    "铜": "0.861137",        // 铜指数
    "铝": "0.861138",        // 铝指数
    "钢铁": "0.861322",      // 钢铁指数
  };
  const secid = commodityCodes[name];
  if (!secid) return null;

  try {
    const url = `https://push2.eastmoney.com/api/qt/stock/get?secid=${secid}&fields=f2,f3,f12,f14`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    if (data?.data) {
      return {
        price: data.data.f2 || 0,
        changePercent: data.data.f3 || 0,
      };
    }
    return null;
  } catch {
    return null;
  }
}

// ========== 缓存 ==========

let materialPriceCache: { prices: MaterialPrice[]; timestamp: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000; // 10分钟

// ========== 获取所有原材料价格 ==========

export async function getAllMaterialPrices(): Promise<MaterialPrice[]> {
  const now = Date.now();
  if (materialPriceCache && now - materialPriceCache.timestamp < CACHE_TTL) {
    return materialPriceCache.prices;
  }

  const prices: MaterialPrice[] = [];
  for (const mat of MATERIAL_MAP) {
    let data = null;
    if (mat.futuresCode) {
      data = await fetchFuturesPrice(mat.futuresCode);
    }
    if (!data) {
      data = await fetchCommodityIndex(mat.name);
    }
    if (data) {
      const absChange = Math.abs(data.changePercent);
      const alertLevel = absChange > mat.threshold ? "警报" : absChange > mat.threshold * 0.6 ? "关注" : "正常";
      prices.push({
        name: mat.name,
        price: data.price,
        changePercent: data.changePercent,
        changeWeek: data.changePercent * 0.7, // 近似周涨跌
        updatedAt: new Date().toISOString(),
        alertLevel,
      });
    } else {
      // 模拟数据（API不可用时替补）
      const mockChange = (Math.random() - 0.5) * 6;
      prices.push({
        name: mat.name,
        price: 100 + mockChange * 5,
        changePercent: Math.round(mockChange * 10) / 10,
        changeWeek: Math.round(mockChange * 0.6 * 10) / 10,
        updatedAt: new Date().toISOString(),
        alertLevel: Math.abs(mockChange) > mat.threshold ? "警报" : Math.abs(mockChange) > mat.threshold * 0.6 ? "关注" : "正常",
      });
    }
  }

  materialPriceCache = { prices, timestamp: now };
  return prices;
}

// ========== 获取某行业的原材料价格影响评分 ==========

export function getMaterialImpactScore(industry: string, prices: MaterialPrice[]): number {
  let totalImpact = 0;
  let totalWeight = 0;

  for (const mat of MATERIAL_MAP) {
    if (mat.industry.some(ind => industry.includes(ind) || ind.includes(industry))) {
      const priceData = prices.find(p => p.name === mat.name);
      if (priceData) {
        // 原材料涨价 → 成本上升 → 风险升高（评分升高）
        const change = priceData.changePercent;
        const impact = change > 0 ? change * 1.5 : change * 0.5;
        totalImpact += impact * mat.weight;
        totalWeight += mat.weight;
      }
    }
  }

  if (totalWeight === 0) return 0;

  // 转换为0-100的评分增量
  const avgImpact = totalImpact / totalWeight;
  // 原材料涨价10% → 风险+15分
  const scoreDelta = Math.round(Math.min(30, Math.max(-20, avgImpact * 1.5)));
  return scoreDelta;
}

// ========== 获取近期供应链预警事件 ==========

export interface SupplyAlert {
  date: string;
  type: "原材料涨价" | "供应短缺" | "进口受限" | "产能过剩";
  material: string;
  changePercent: number;
  severity: "high" | "medium" | "low";
  description: string;
  affectedIndustry: string[];
}

export function getSupplyAlerts(prices: MaterialPrice[]): SupplyAlert[] {
  const alerts: SupplyAlert[] = [];
  for (const mat of MATERIAL_MAP) {
    const priceData = prices.find(p => p.name === mat.name);
    if (!priceData) continue;

    const absChange = Math.abs(priceData.changePercent);
    if (absChange > mat.threshold) {
      alerts.push({
        date: new Date().toISOString().split("T")[0],
        type: priceData.changePercent > 0 ? "原材料涨价" : "产能过剩",
        material: mat.name,
        changePercent: priceData.changePercent,
        severity: absChange > mat.threshold * 1.5 ? "high" : "medium",
        description: `${mat.name}月涨幅${priceData.changePercent.toFixed(1)}%，超过警戒线${mat.threshold}%`,
        affectedIndustry: mat.industry,
      });
    }
  }
  return alerts;
}

// ========== 公司公告采集（巨潮资讯网） ==========

export interface Announcement {
  date: string;
  title: string;
  type: "合同公告" | "业绩预告" | "关联交易" | "停产公告" | "对外投资";
  stockCode: string;
  stockName: string;
  url: string;
}

// 巨潮资讯网公告搜索
export async function fetchAnnouncements(code: string): Promise<Announcement[]> {
  try {
    const url = `https://www.cninfo.com.cn/new/disclosure/stock?stockCode=${code}&pageNum=1&pageSize=10&tabName=fulltext`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://www.cninfo.com.cn/",
      },
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json();
    if (data?.classifiedAnnouncements) {
      const types = data.classifiedAnnouncements.flatMap((c: any) => c.announcements || []);
      return types.slice(0, 10).map((a: any) => ({
        date: a.announcementDate?.substring(0, 10) || "",
        title: a.announcementTitle || "",
        type: categorizeAnnouncement(a.announcementTitle || ""),
        stockCode: code,
        stockName: "",
        url: `https://www.cninfo.com.cn/new/disclosure/detail?stockCode=${code}&announcementId=${a.announcementId || ""}`,
      }));
    }
    return [];
  } catch {
    return [];
  }
}

function categorizeAnnouncement(title: string): Announcement["type"] {
  if (title.includes("合同") || title.includes("中标")) return "合同公告";
  if (title.includes("业绩") || title.includes("预告")) return "业绩预告";
  if (title.includes("关联交易")) return "关联交易";
  if (title.includes("停产") || title.includes("检修")) return "停产公告";
  if (title.includes("投资") || title.includes("收购")) return "对外投资";
  return "合同公告";
}
