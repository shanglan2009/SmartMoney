/**
 * 统一证据收集器 - 聚合5大数据源
 * 
 * 数据流:
 *   各数据源 → 独立采集器 → 统一Evidence格式 → 贝叶斯引擎
 * 
 * 调用策略:
 *   - 高频(每次请求): 价格动量 + 大宗商品
 *   - 中频(每6小时): 公告 + 招标
 *   - 低频(每天): 专利 + 进出口
 */

import type { Evidence } from "./types";
import { fetchBatchAnnouncements, announcementsToEvidences } from "./announcements";
import { fetchPatents, patentsToEvidences } from "./patents";
import { fetchTradeData, tradeToEvidences } from "./trade";
import { fetchBatchBids, bidsToEvidences } from "./bidding";
import { getAllMaterialPrices, getMaterialImpactScore } from "../supplyChainCollector";
import { GLOBAL_STOCKS } from "../globalStocks";
import { getSupplyRelations, supplyRelationsToEvidences, getRegionSummary } from "./globalTrade";

// ========== 缓存系统 ==========

interface CacheEntry {
  timestamp: number;
  data: Evidence[];
}

const CACHE: Record<string, CacheEntry> = {};
const CACHE_TTL = {
  price: 60_000,          // 1分钟
  materials: 10 * 60_000, // 10分钟
  announcements: 6 * 60 * 60_000, // 6小时
  patents: 24 * 60 * 60_000,      // 24小时
  trade: 24 * 60 * 60_000,         // 24小时
  bidding: 6 * 60 * 60_000,        // 6小时
};

// ========== 价格证据（实时） ==========

function generatePriceEvidence(
  code: string,
  changePercent: number | null,
  pe: number | null
): Evidence[] {
  const evidences: Evidence[] = [];

  if (changePercent !== null) {
    if (changePercent > 8) {
      evidences.push({
        date: new Date().toISOString().split("T")[0],
        source: "公告", type: "正面", strength: "强",
        description: `股价月涨幅${changePercent.toFixed(1)}%，需求信号强烈`,
        likelihood: 0.75, falsePositive: 0.15,
      });
    } else if (changePercent > 3) {
      evidences.push({
        date: new Date().toISOString().split("T")[0],
        source: "公告", type: "正面", strength: "中",
        description: `股价月涨幅${changePercent.toFixed(1)}%，需求温和增长`,
        likelihood: 0.60, falsePositive: 0.30,
      });
    } else if (changePercent < -8) {
      evidences.push({
        date: new Date().toISOString().split("T")[0],
        source: "公告", type: "反面", strength: "强",
        description: `股价月跌幅${Math.abs(changePercent).toFixed(1)}%，需求走弱`,
        likelihood: 0.70, falsePositive: 0.20,
      });
    }
  }

  if (pe !== null && pe > 100) {
    evidences.push({
      date: new Date().toISOString().split("T")[0],
      source: "公告", type: "正面", strength: "中",
      description: `PE ${pe.toFixed(0)}倍，市场给予稀缺性溢价`,
      likelihood: 0.55, falsePositive: 0.35,
    });
  }

  return evidences;
}

// ========== 主函数：获取全部证据 ==========

let allEvidencesCache: CacheEntry | null = null;

export async function collectAllEvidences(
  forceRefresh: boolean = false
): Promise<{ evidences: Evidence[]; sourceStats: Record<string, number> }> {
  const now = Date.now();
  
  // 检查缓存
  if (!forceRefresh && allEvidencesCache && now - allEvidencesCache.timestamp < 60_000) {
    return { evidences: allEvidencesCache.data, sourceStats: {} };
  }

  const allCodes = GLOBAL_STOCKS.map(s => s.code);
  const allEvidences: Evidence[] = [];
  const stats: Record<string, number> = {};
  const errors: string[] = [];

  // 1. 大宗商品证据（已有缓存机制）
  try {
    const materialPrices = await getAllMaterialPrices();
    for (const stock of GLOBAL_STOCKS) {
      const impact = getMaterialImpactScore(stock.industry, materialPrices);
      if (Math.abs(impact) > 5) {
        allEvidences.push({
          date: new Date().toISOString().split("T")[0],
          source: "大宗商品", type: impact > 0 ? "反面" : "正面", strength: "中",
          description: impact > 0
            ? `原材料涨价影响${stock.industry}，成本压力+${impact}分`
            : `原材料降价利好${stock.industry}，成本压力${impact}分`,
          likelihood: 0.50, falsePositive: 0.30,
        });
      }
    }
    stats["大宗商品"] = allEvidences.filter(e => e.source === "大宗商品").length;
  } catch (e) { errors.push(`大宗商品: ${e}`); }

  // 2. 公告证据
  try {
    const announcements = await fetchBatchAnnouncements(allCodes);
    const annEvidences = announcementsToEvidences(announcements);
    allEvidences.push(...annEvidences);
    stats["公告"] = annEvidences.length;
  } catch (e) { errors.push(`公告: ${e}`); }

  // 3. 专利证据
  try {
    const techAreas: Record<string, string> = {
      "澜起科技": "内存接口", "韦尔股份": "图像传感器", "中微公司": "刻蚀设备",
      "中际旭创": "光模块", "工业富联": "AI服务器",
    };
    for (const stock of GLOBAL_STOCKS) {
      const area = techAreas[stock.name];
      if (area) {
        const patents = await fetchPatents(stock.name, area);
        const patEvidences = patentsToEvidences(patents);
        allEvidences.push(...patEvidences);
      }
    }
    stats["专利"] = allEvidences.filter(e => e.source === "专利").length;
  } catch (e) { errors.push(`专利: ${e}`); }

  // 4. 招标证据
  try {
    const bids = await fetchBatchBids(allCodes);
    const bidEvidences = bidsToEvidences(bids);
    allEvidences.push(...bidEvidences);
    stats["招标"] = bidEvidences.length;
  } catch (e) { errors.push(`招标: ${e}`); }

  // 5. 全球供应链关系证据
  try {
    for (const stock of GLOBAL_STOCKS) {
      const relations = getSupplyRelations(stock.code);
      if (relations.length > 0) {
        const relEvidences = supplyRelationsToEvidences(relations);
        allEvidences.push(...relEvidences);
      }
    }
    stats["全球供应链"] = allEvidences.filter(e => e.source === "全球供应链").length;
  } catch (e) { errors.push(`全球供应链: ${e}`); }

  // 6. 进出口证据
  try {
    const industries = [...new Set(GLOBAL_STOCKS.map(s => s.industry))];
    for (const ind of industries) {
      const tradeData = await fetchTradeData(ind);
      const tradeEvidences = tradeToEvidences(tradeData, ind);
      allEvidences.push(...tradeEvidences);
    }
    stats["进出口"] = allEvidences.filter(e => e.source === "进出口").length;
  } catch (e) { errors.push(`进出口: ${e}`); }

  allEvidencesCache = { timestamp: now, data: allEvidences };

  console.log(`[采集器] 共${allEvidences.length}条证据:`, stats, errors.length ? `错误:${errors.join(",")}` : "");
  return { evidences: allEvidences, sourceStats: stats };
}

/** 获取某只股票的聚合证据 */
export function getEvidencesForStock(
  allEvidences: Evidence[],
  code: string,
  changePercent: number | null,
  pe: number | null,
): Evidence[] {
  const stockEvs = allEvidences.filter(e => !e.stockCode || e.stockCode === code);
  const priceEvs = generatePriceEvidence(code, changePercent, pe);
  return [...stockEvs, ...priceEvs];
}
