/**
 * 供应链评分自动刷新 API
 * 
 * 每次请求：
 * 1. 检查缓存是否过期（默认1小时）
 * 2. 如果过期：拉取东方财富最新行情 → 运行评分引擎 → 更新缓存
 * 3. 返回最新评分数据
 * 
 * Vercel Cron 可定时调用此接口刷新缓存
 */

import { NextResponse } from "next/server";
import { ScoringEngine } from "@/lib/scoringEngine";

// ========== 股票列表（75只） ==========

interface StockMeta {
  code: string;
  name: string;
  industry: string;
  category: string;
}

const ALL_STOCKS: StockMeta[] = [
  // 芯片/半导体
  { code: "688981", name: "中芯国际", industry: "芯片制造", category: "芯片" },
  { code: "002371", name: "北方华创", industry: "芯片设备", category: "芯片" },
  { code: "688041", name: "海光信息", industry: "芯片设计", category: "芯片" },
  { code: "688256", name: "寒武纪", industry: "AI芯片", category: "芯片" },
  { code: "300661", name: "圣邦股份", industry: "模拟芯片", category: "芯片" },
  { code: "603986", name: "兆易创新", industry: "存储芯片", category: "芯片" },
  { code: "688008", name: "澜起科技", industry: "芯片/内存接口", category: "芯片" },
  { code: "688037", name: "芯源微", industry: "芯片设备", category: "芯片" },
  { code: "688099", name: "晶晨股份", industry: "AI芯片", category: "芯片" },
  { code: "688200", name: "华峰测控", industry: "芯片测试", category: "芯片" },
  { code: "688627", name: "精智达", industry: "芯片测试设备", category: "芯片" },
  { code: "688652", name: "京仪装备", industry: "半导体设备", category: "芯片" },
  // AI/算力
  { code: "300308", name: "中际旭创", industry: "光模块/算力", category: "AI" },
  { code: "300502", name: "新易盛", industry: "光模块", category: "AI" },
  { code: "000977", name: "浪潮信息", industry: "AI服务器/算力", category: "AI" },
  { code: "603019", name: "中科曙光", industry: "算力/超算", category: "AI" },
  { code: "002230", name: "科大讯飞", industry: "AI应用", category: "AI" },
  { code: "002065", name: "东华软件", industry: "AI/算力", category: "AI" },
  { code: "001339", name: "智微智能", industry: "AI/算力", category: "AI" },
  { code: "000988", name: "华工科技", industry: "AI/光模块", category: "AI" },
  { code: "000725", name: "京东方A", industry: "AI/面板", category: "AI" },
  { code: "300476", name: "胜宏科技", industry: "PCB/AI", category: "AI" },
  { code: "300548", name: "长芯博创", industry: "光模块", category: "AI" },
  { code: "002236", name: "大华股份", industry: "AI应用", category: "AI" },
  { code: "300088", name: "长信科技", industry: "AI应用", category: "AI" },
  { code: "300231", name: "银信科技", industry: "AI应用", category: "AI" },
  // 储能
  { code: "300750", name: "宁德时代", industry: "储能/锂电池", category: "储能" },
  { code: "300274", name: "阳光电源", industry: "储能/逆变器", category: "储能" },
  { code: "002074", name: "国轩高科", industry: "储能/锂电池", category: "储能" },
  { code: "002015", name: "协鑫能科", industry: "储能/算力", category: "储能" },
  { code: "002850", name: "科达利", industry: "储能", category: "储能" },
  { code: "301358", name: "湖南裕能", industry: "储能/正极材料", category: "储能" },
  { code: "300953", name: "震裕科技", industry: "储能", category: "储能" },
  { code: "688472", name: "阿特斯", industry: "储能/光伏", category: "储能" },
  // 电力
  { code: "600900", name: "长江电力", industry: "电力", category: "电力" },
  { code: "601985", name: "中国核电", industry: "电力/核电", category: "电力" },
  { code: "600406", name: "国电南瑞", industry: "电力设备/智能电网", category: "电力" },
  { code: "600674", name: "川投能源", industry: "电力", category: "电力" },
  { code: "600163", name: "中闽能源", industry: "电力", category: "电力" },
  { code: "000690", name: "宝新能源", industry: "电力", category: "电力" },
  { code: "001286", name: "陕西能源", industry: "电力", category: "电力" },
  { code: "000600", name: "建投能源", industry: "电力", category: "电力" },
  { code: "600930", name: "华电新能", industry: "电力", category: "电力" },
  { code: "001376", name: "百通能源", industry: "电力", category: "电力" },
  { code: "001896", name: "豫能控股", industry: "电力/算力", category: "电力" },
  { code: "601669", name: "中国电建", industry: "电力工程/储能", category: "电力" },
  { code: "601868", name: "中国能建", industry: "电力工程/储能", category: "电力" },
  { code: "600089", name: "特变电工", industry: "电力设备/储能", category: "电力" },
  { code: "002364", name: "中恒电气", industry: "电力设备", category: "电力" },
  // 高端制造/机器人
  { code: "002594", name: "比亚迪", industry: "新能源车/高端制造", category: "高端制造" },
  { code: "300124", name: "汇川技术", industry: "机器人/工控", category: "机器人" },
  { code: "688169", name: "石头科技", industry: "机器人/扫地机", category: "机器人" },
  { code: "601727", name: "上海电气", industry: "高端制造/电力设备", category: "高端制造" },
  { code: "601138", name: "工业富联", industry: "高端制造/AI服务器", category: "高端制造" },
  { code: "002384", name: "东山精密", industry: "PCB/高端制造", category: "高端制造" },
  { code: "002527", name: "新时达", industry: "机器人", category: "机器人" },
  { code: "002520", name: "日发精机", industry: "高端制造", category: "高端制造" },
  { code: "002048", name: "宁波华翔", industry: "高端制造", category: "高端制造" },
  { code: "002815", name: "崇达技术", industry: "高端制造", category: "高端制造" },
  { code: "000837", name: "秦川机床", industry: "高端制造/机床", category: "高端制造" },
  { code: "002126", name: "银轮股份", industry: "高端制造", category: "高端制造" },
  { code: "600673", name: "东阳光", industry: "高端制造", category: "高端制造" },
  { code: "300751", name: "迈为股份", industry: "高端制造/光伏设备", category: "高端制造" },
  { code: "603606", name: "东方电缆", industry: "高端制造/海缆", category: "高端制造" },
  { code: "688500", name: "博众精工", industry: "高端制造", category: "高端制造" },
  { code: "688698", name: "伟创电气", industry: "高端制造/工控", category: "高端制造" },
  { code: "002353", name: "杰瑞股份", industry: "高端装备", category: "高端制造" },
  { code: "300818", name: "耐普矿机", industry: "高端装备", category: "高端制造" },
  { code: "301160", name: "翔楼新材", industry: "新材料", category: "高端制造" },
  { code: "003007", name: "直真科技", industry: "通信设备", category: "高端制造" },
  { code: "689009", name: "九号公司", industry: "机器人/储能", category: "机器人" },
  { code: "002851", name: "麦格米特", industry: "机器人/储能", category: "机器人" },
  { code: "920978", name: "开特股份", industry: "机器人/汽车电子", category: "机器人" },
  { code: "920839", name: "万通液压", industry: "机器人/减速器", category: "机器人" },
  { code: "920242", name: "建邦科技", industry: "机器人", category: "机器人" },
];

// ========== 缓存系统 ==========

interface CacheEntry {
  timestamp: number;
  data: ScoreResult[];
}

interface ScoreResult {
  code: string;
  name: string;
  industry: string;
  category: string;
  price: number | null;
  changePercent: number | null;
  pe: number | null;
  score: number;
  rating: string;
  dimensions: { name: string; score: number; weight: number }[];
  suppliers: { name: string; ratio: number; industry?: string; financialHealth?: string }[];
  action: string;
  buySignal: number;
  sellSignal: number;
  updatedAt: string;
}

let scoreCache: CacheEntry | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1小时过期

// ========== 东方财富行情获取 ==========

function secid(code: string) {
  return code.startsWith("6") || code.startsWith("9") ? `1.${code}` : `0.${code}`;
}

async function fetchQuotes(): Promise<Record<string, any>> {
  const secids = ALL_STOCKS.map(s => secid(s.code)).join(",");
  const url = `https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&fields=f2,f3,f4,f5,f12,f14,f15,f16,f17,f18,f20,f21,f115,f152&secids=${secids}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", Referer: "https://quote.eastmoney.com/" },
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json();
    const result: Record<string, any> = {};
    if (data?.data?.diff) {
      for (const item of data.data.diff) {
        const code = String(item.f12);
        result[code] = {
          price: item.f2,
          changePercent: item.f3,
          pe: item.f21,
          turnoverRate: item.f20,
        };
      }
    }
    return result;
  } catch {
    return {};
  }
}

// ========== 主计算函数 ==========

function computeAllScores(quotes: Record<string, any>): ScoreResult[] {
  const now = new Date().toISOString();
  return ALL_STOCKS.map((stock) => {
    const q = quotes[stock.code] || {};
    const price = q.price ?? null;
    const pe = q.pe ?? null;
    const changePercent = q.changePercent ?? null;

    // 使用实时数据中的换手率(f20字段)和价格计算动量
    const turnoverRate = q.turnoverRate || null;
    // 上月涨跌幅暂用本月的一半作为近似（精确值需要历史K线）
    const prevMonthChange = changePercent !== null ? changePercent * 0.6 : null;
    
    const score = ScoringEngine.calculateFullScore(
      stock.industry, price, pe, null, changePercent, stock.code,
      prevMonthChange, turnoverRate
    );
    const suppliers = ScoringEngine.getSuppliersForIndustry(stock.industry);

    return {
      code: stock.code,
      name: stock.name,
      industry: stock.industry,
      category: stock.category,
      price,
      changePercent,
      pe,
      score: score.overall,
      rating: score.rating,
      action: score.action,
      buySignal: score.buySignal,
      sellSignal: score.sellSignal,
      dimensions: score.dimensions,
      suppliers: suppliers.map(s => ({
        name: s.name,
        ratio: s.ratio,
        industry: s.industry,
        financialHealth: s.financialHealth,
      })),
      updatedAt: now,
    };
  });
}

// ========== API 端点 ==========

export async function GET(request: Request) {
  const url = new URL(request.url);
  const forceRefresh = url.searchParams.has("refresh");
  const code = url.searchParams.get("code");

  // 检查缓存
  if (!forceRefresh && scoreCache && Date.now() - scoreCache.timestamp < CACHE_TTL_MS) {
    const cacheData = scoreCache.data;
    if (code) {
      const item = cacheData.find(s => s.code === code);
      return NextResponse.json(
        item || { error: "Stock not found" },
        { status: item ? 200 : 404 }
      );
    }
    return NextResponse.json({
      timestamp: new Date(scoreCache.timestamp).toISOString(),
      count: cacheData.length,
      stocks: cacheData,
      cached: true,
    });
  }

  // 重新计算
  console.log(`[API /api/scores] Refreshing scores for ${ALL_STOCKS.length} stocks...`);
  const quotes = await fetchQuotes();
  const results = computeAllScores(quotes);
  scoreCache = { timestamp: Date.now(), data: results };
  console.log(`[API /api/scores] Done. Got ${Object.keys(quotes).length} quotes.`);

  if (code) {
    const item = results.find(s => s.code === code);
    return NextResponse.json(
      item || { error: "Stock not found" },
      { status: item ? 200 : 404 }
    );
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    count: results.length,
    stocks: results,
    cached: false,
  });
}
