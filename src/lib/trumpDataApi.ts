// ============================================================
// Trump Stock Tracker — 数据采集与聚合 API
// ============================================================
//
// 数据源:
//   - Open Cabinet:    https://open-cabinet.org
//   - TrumpTrades:     https://trumpstrades.com
//   - Trump Tracker:   https://trumptracker.org
//   - OGE:             https://oge.gov
//   - ProPublica:      https://projects.propublica.org/trump-team-financial-disclosures/
//
// 当前阶段: 模拟数据（后续可替换为真实抓取）
// ============================================================

import type {
  Politician,
  Trade,
  Holding,
  PoliticianPortfolio,
  DashboardStats,
  StockRecommendation,
  TradeSize,
} from "./trumpData";

// ============================================================
// 政要列表
// ============================================================

const POLITICIANS: Politician[] = [
  // === 特朗普家族 ===
  {
    id: "donald-trump",
    name: "Donald J. Trump",
    title: "美国总统 (President)",
    party: "R",
    relation: "trump_admin",
    sourceUrls: [
      "https://trumpstrades.com",
      "https://open-cabinet.org",
      "https://trumptracker.org",
    ],
  },
  {
    id: "melania-trump",
    name: "Melania Trump",
    title: "第一夫人 (First Lady)",
    party: "R",
    relation: "trump_admin",
    sourceUrls: ["https://open-cabinet.org"],
  },
  {
    id: "donald-trump-jr",
    name: "Donald Trump Jr.",
    title: "特朗普长子",
    party: "R",
    relation: "trump_admin",
    sourceUrls: ["https://trumpstrades.com"],
  },
  {
    id: "eric-trump",
    name: "Eric Trump",
    title: "特朗普次子 / Trump Organization EVP",
    party: "R",
    relation: "trump_admin",
    sourceUrls: ["https://trumpstrades.com"],
  },

  // === 内阁成员 ===
  {
    id: "elon-musk",
    name: "Elon Musk",
    title: "政府效率部 (DOGE) 部长 / 特斯拉CEO",
    party: "R",
    relation: "trump_cabinet",
    sourceUrls: ["https://open-cabinet.org", "https://trumptracker.org"],
  },
  {
    id: "vivek-ramaswamy",
    name: "Vivek Ramaswamy",
    title: "政府效率部 (DOGE) 联席部长",
    party: "R",
    relation: "trump_cabinet",
    sourceUrls: ["https://open-cabinet.org"],
  },
  {
    id: "marco-rubio",
    name: "Marco Rubio",
    title: "国务卿 (Secretary of State)",
    party: "R",
    state: "FL",
    relation: "trump_cabinet",
    sourceUrls: ["https://open-cabinet.org", "https://trumptracker.org"],
  },
  {
    id: "scott-bessent",
    name: "Scott Bessent",
    title: "财政部长 (Secretary of Treasury)",
    party: "R",
    relation: "trump_cabinet",
    sourceUrls: ["https://open-cabinet.org"],
  },
  {
    id: "howard-lutnick",
    name: "Howard Lutnick",
    title: "商务部长 (Secretary of Commerce)",
    party: "R",
    relation: "trump_cabinet",
    sourceUrls: ["https://open-cabinet.org"],
  },
  {
    id: "robert-kennedy-jr",
    name: "Robert F. Kennedy Jr.",
    title: "卫生与公众服务部长 (HHS Secretary)",
    party: "R",
    relation: "trump_cabinet",
    sourceUrls: ["https://open-cabinet.org"],
  },
  {
    id: "tulsi-gabbard",
    name: "Tulsi Gabbard",
    title: "国家情报总监 (DNI)",
    party: "R",
    relation: "trump_cabinet",
    sourceUrls: ["https://open-cabinet.org"],
  },
  {
    id: "pete-hegseth",
    name: "Pete Hegseth",
    title: "国防部长 (Secretary of Defense)",
    party: "R",
    relation: "trump_cabinet",
    sourceUrls: ["https://open-cabinet.org"],
  },
  {
    id: "pam-bondi",
    name: "Pam Bondi",
    title: "司法部长 (Attorney General)",
    party: "R",
    relation: "trump_cabinet",
    sourceUrls: ["https://open-cabinet.org"],
  },

  // === 国会共和党 ===
  {
    id: "nancy-mace",
    name: "Nancy Mace",
    title: "众议员 (R-SC)",
    party: "R",
    state: "SC",
    relation: "congress",
    sourceUrls: ["https://trumpstrades.com", "https://trumptracker.org"],
  },
  {
    id: "marjorie-greene",
    name: "Marjorie Taylor Greene",
    title: "众议员 (R-GA)",
    party: "R",
    state: "GA",
    relation: "congress",
    sourceUrls: ["https://trumpstrades.com"],
  },
  {
    id: "tommy-tuberville",
    name: "Tommy Tuberville",
    title: "参议员 (R-AL)",
    party: "R",
    state: "AL",
    relation: "congress",
    sourceUrls: ["https://trumpstrades.com"],
  },
  {
    id: "jd-vance",
    name: "JD Vance",
    title: "副总统 (Vice President)",
    party: "R",
    state: "OH",
    relation: "trump_admin",
    sourceUrls: ["https://open-cabinet.org", "https://trumptracker.org"],
  },
  {
    id: "mike-johnson",
    name: "Mike Johnson",
    title: "众议院议长 (Speaker of the House)",
    party: "R",
    state: "LA",
    relation: "congress",
    sourceUrls: ["https://trumptracker.org"],
  },
];

// ============================================================
// 模拟交易数据
// ============================================================

function randomSize(): TradeSize {
  const sizes: TradeSize[] = [
    "$1K-$15K", "$15K-$50K", "$50K-$100K", "$100K-$250K",
    "$250K-$500K", "$500K-$1M", "$1M-$5M", "$5M-$25M",
  ];
  return sizes[Math.floor(Math.random() * sizes.length)];
}

function sizeToAmount(size: TradeSize): number {
  const map: Record<TradeSize, number> = {
    "$1K-$15K": 8000,
    "$15K-$50K": 32500,
    "$50K-$100K": 75000,
    "$100K-$250K": 175000,
    "$250K-$500K": 375000,
    "$500K-$1M": 750000,
    "$1M-$5M": 3000000,
    "$5M-$25M": 15000000,
    "$25M-$50M": 37500000,
    "$50M+": 75000000,
  };
  return map[size] ?? 50000;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

/** 热门美股标的 */
const POPULAR_STOCKS: { ticker: string; name: string; sector: string }[] = [
  { ticker: "TSLA", name: "Tesla Inc.", sector: "电动汽车/AI" },
  { ticker: "AAPL", name: "Apple Inc.", sector: "科技/消费电子" },
  { ticker: "MSFT", name: "Microsoft Corp.", sector: "科技/软件" },
  { ticker: "NVDA", name: "NVIDIA Corp.", sector: "半导体/AI" },
  { ticker: "AMZN", name: "Amazon.com Inc.", sector: "科技/电商" },
  { ticker: "GOOGL", name: "Alphabet Inc.", sector: "科技/搜索" },
  { ticker: "META", name: "Meta Platforms Inc.", sector: "科技/社交" },
  { ticker: "PLTR", name: "Palantir Technologies", sector: "AI/数据分析" },
  { ticker: "COIN", name: "Coinbase Global Inc.", sector: "加密货币" },
  { ticker: "MSTR", name: "MicroStrategy Inc.", sector: "加密货币/软件" },
  { ticker: "DJT", name: "Trump Media & Technology", sector: "媒体/社交" },
  { ticker: "BTC", name: "Bitcoin ETF (IBIT)", sector: "加密货币" },
  { ticker: "SPY", name: "SPDR S&P 500 ETF", sector: "ETF/指数" },
  { ticker: "QQQ", name: "Invesco QQQ Trust", sector: "ETF/科技" },
  { ticker: "JPM", name: "JPMorgan Chase & Co.", sector: "银行/金融" },
  { ticker: "V", name: "Visa Inc.", sector: "金融/支付" },
  { ticker: "UNH", name: "UnitedHealth Group", sector: "医疗健康" },
  { ticker: "LLY", name: "Eli Lilly & Co.", sector: "医药" },
  { ticker: "XOM", name: "Exxon Mobil Corp.", sector: "能源/石油" },
  { ticker: "AMD", name: "Advanced Micro Devices", sector: "半导体" },
  { ticker: "TSM", name: "Taiwan Semiconductor", sector: "半导体" },
  { ticker: "SHOP", name: "Shopify Inc.", sector: "科技/电商" },
  { ticker: "SOFI", name: "SoFi Technologies", sector: "金融科技" },
  { ticker: "RKLB", name: "Rocket Lab USA", sector: "航天" },
  { ticker: "HOOD", name: "Robinhood Markets", sector: "金融科技" },
  { ticker: "AMC", name: "AMC Entertainment", sector: "娱乐" },
  { ticker: "GME", name: "GameStop Corp.", sector: "零售" },
];

// 生成模拟交易
function generateMockTrades(): Trade[] {
  const trades: Trade[] = [];
  let id = 1;

  for (const politician of POLITICIANS) {
    // 每个政要生成 10–30 笔交易
    const count = 10 + Math.floor(Math.random() * 20);
    for (let i = 0; i < count; i++) {
      const stock = POPULAR_STOCKS[Math.floor(Math.random() * POPULAR_STOCKS.length)];
      const daysBack = Math.floor(Math.random() * 120); // 最近120天
      const isBuy = Math.random() > 0.35;
      const size = randomSize();

      trades.push({
        id: `trade-${id++}`,
        politicianId: politician.id,
        ticker: stock.ticker,
        companyName: stock.name,
        type: isBuy ? "buy" : "sell",
        size,
        amount: sizeToAmount(size) * (isBuy ? 1 : -1),
        date: daysAgo(daysBack),
        filingDate: daysAgo(Math.max(0, daysBack - 15)),
        sector: stock.sector,
        source: ["open_cabinet", "trump_trades", "trump_tracker"][Math.floor(Math.random() * 3)] as Trade["source"],
        sourceUrl: politician.sourceUrls[0],
      });
    }
  }

  return trades;
}

// 缓存
let cachedTrades: Trade[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24小时

export function getTrades(forceRefresh = false): Trade[] {
  const now = Date.now();
  if (!forceRefresh && cachedTrades && now - cacheTimestamp < CACHE_TTL) {
    return cachedTrades;
  }
  cachedTrades = generateMockTrades();
  cacheTimestamp = now;
  return cachedTrades;
}

export function getPoliticians(): Politician[] {
  return POLITICIANS;
}

export function getPoliticianById(id: string): Politician | undefined {
  return POLITICIANS.find((p) => p.id === id);
}

/** 获取单个政要的持仓画像 */
export function getPoliticianPortfolio(politicianId: string): PoliticianPortfolio | null {
  const politician = getPoliticianById(politicianId);
  if (!politician) return null;

  const trades = getTrades().filter((t) => t.politicianId === politicianId);
  const recentTrades = trades.slice(0, 20);

  // 汇总持仓
  const holdingMap = new Map<string, { ticker: string; companyName: string; sector: string; shares: number; value: number }>();
  for (const t of trades) {
    const existing = holdingMap.get(t.ticker);
    const amount = sizeToAmount(t.size);
    if (existing) {
      if (t.type === "buy" || t.type === "option_buy") {
        existing.value += amount;
        existing.shares += Math.round(amount / 100);
      } else {
        existing.value = Math.max(0, existing.value - amount);
        existing.shares = Math.max(0, existing.shares - Math.round(amount / 100));
      }
    } else {
      holdingMap.set(t.ticker, {
        ticker: t.ticker,
        companyName: t.companyName,
        sector: t.sector,
        shares: Math.round(amount / 100),
        value: amount,
      });
    }
  }

  const holdings: Holding[] = Array.from(holdingMap.values())
    .filter((h) => h.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 15)
    .map((h) => {
      const totalValue = Array.from(holdingMap.values()).reduce((s, v) => s + v.value, 0);
      return {
        ...h,
        valueRange: h.value > 1000000 ? "$1M+" : h.value > 100000 ? "$100K-$1M" : "$15K-$100K",
        pctOfPortfolio: totalValue > 0 ? Math.round((h.value / totalValue) * 100) : 0,
        asOfDate: daysAgo(0),
      };
    });

  const totalValue = holdings.reduce((s, h) => s + h.value, 0);

  return {
    politician,
    holdings,
    recentTrades,
    totalValue,
    totalValueRange: totalValue > 10000000 ? "$10M+" : totalValue > 1000000 ? "$1M-$10M" : "$100K-$1M",
    lastUpdated: new Date().toISOString(),
  };
}

/** 获取仪表盘统计 */
export function getDashboardStats(): DashboardStats {
  const trades = getTrades();
  const politicians = getPoliticians();

  // 按 ticker 统计买入/卖出
  const buyMap = new Map<string, { ticker: string; companyName: string; count: number; totalAmount: number }>();
  const sellMap = new Map<string, { ticker: string; companyName: string; count: number; totalAmount: number }>();
  const holdingCountMap = new Map<string, { ticker: string; companyName: string; count: number; sector: string }>();
  const sectorMap = new Map<string, { sector: string; totalValue: number; count: number }>();

  for (const t of trades) {
    const amount = Math.abs(sizeToAmount(t.size));
    
    // 买入统计
    if (t.type === "buy" || t.type === "option_buy") {
      const existing = buyMap.get(t.ticker) ?? {
        ticker: t.ticker, companyName: t.companyName, count: 0, totalAmount: 0,
      };
      existing.count++;
      existing.totalAmount += amount;
      buyMap.set(t.ticker, existing);
    }

    // 卖出统计
    if (t.type === "sell" || t.type === "option_sell") {
      const existing = sellMap.get(t.ticker) ?? {
        ticker: t.ticker, companyName: t.companyName, count: 0, totalAmount: 0,
      };
      existing.count++;
      existing.totalAmount += amount;
      sellMap.set(t.ticker, existing);
    }

    // 持仓人数统计
    {
      const existing = holdingCountMap.get(t.ticker) ?? {
        ticker: t.ticker, companyName: t.companyName, count: 0, sector: t.sector,
      };
      // 每个政每只股票只计一次
      const key = `${t.politicianId}-${t.ticker}`;
      if (!holdingCountMap.has(key as any)) {
        existing.count++;
        holdingCountMap.set(t.ticker, existing);
      }
    }

    // 行业分布
    {
      const existing = sectorMap.get(t.sector) ?? { sector: t.sector, totalValue: 0, count: 0 };
      existing.totalValue += amount;
      existing.count++;
      sectorMap.set(t.sector, existing);
    }
  }

  const topBuys = Array.from(buyMap.values())
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 10);

  const topSells = Array.from(sellMap.values())
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 10);

  const topHeldByCount = Array.from(holdingCountMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const sectorDistribution = Array.from(sectorMap.values())
    .sort((a, b) => b.totalValue - a.totalValue);

  const totalValue = trades.reduce((s, t) => s + Math.abs(sizeToAmount(t.size)), 0);

  return {
    totalPoliticians: politicians.length,
    totalTrades: trades.length,
    totalValue,
    topBuys,
    topSells,
    topHeldByCount,
    sectorDistribution,
    dailyRefreshTime: "UTC 06:00 (美东凌晨 1:00 / 2:00)",
    dataSources: [
      { name: "Open Cabinet", url: "https://open-cabinet.org", status: "ok", lastFetch: new Date().toISOString() },
      { name: "TrumpTrades", url: "https://trumpstrades.com", status: "ok", lastFetch: new Date().toISOString() },
      { name: "Trump Tracker", url: "https://trumptracker.org", status: "ok", lastFetch: new Date().toISOString() },
      { name: "OGE", url: "https://oge.gov", status: "stale", lastFetch: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
      { name: "ProPublica", url: "https://projects.propublica.org/trump-team-financial-disclosures/", status: "ok", lastFetch: new Date().toISOString() },
    ],
  };
}

/** 获取持仓建议 */
export function getRecommendations(): StockRecommendation[] {
  const stats = getDashboardStats();
  const trades = getTrades();

  const recommendations: StockRecommendation[] = [];

  const allTickers = new Set(trades.map((t) => t.ticker));
  for (const ticker of allTickers) {
    const tickerTrades = trades.filter((t) => t.ticker === ticker);
    const buys = tickerTrades.filter((t) => t.type === "buy" || t.type === "option_buy");
    const sells = tickerTrades.filter((t) => t.type === "sell" || t.type === "option_sell");
    const totalAmount = tickerTrades.reduce((s, t) => s + Math.abs(sizeToAmount(t.size)), 0);

    let recommendation: StockRecommendation["recommendation"] = "hold";
    let confidence = 50;
    let reason = "";

    const buyCount = buys.length;
    const sellCount = sells.length;
    const netRatio = buyCount > 0 ? (buyCount - sellCount) / buyCount : 0;

    if (netRatio > 0.5 && buyCount > 5) {
      recommendation = "strong_buy";
      confidence = 80 + Math.min(20, buyCount);
      reason = `${buyCount}位政要在买入，${sellCount}位卖出，净买入趋势强劲`;
    } else if (netRatio > 0.2 && buyCount > 3) {
      recommendation = "buy";
      confidence = 60 + Math.min(20, buyCount);
      reason = `${buyCount}位政要买入，买入信号积极`;
    } else if (netRatio < -0.5 && sellCount > 5) {
      recommendation = "strong_sell";
      confidence = 75 + Math.min(25, sellCount);
      reason = `${sellCount}位政要在卖出，抛售压力大`;
    } else if (netRatio < -0.2 && sellCount > 3) {
      recommendation = "sell";
      confidence = 55 + Math.min(20, sellCount);
      reason = `${sellCount}位政要卖出，建议减仓`;
    } else {
      recommendation = "hold";
      confidence = 50;
      reason = "买卖力量均衡，观望为宜";
    }

    recommendations.push({
      ticker,
      companyName: tickerTrades[0]?.companyName ?? ticker,
      sector: tickerTrades[0]?.sector ?? "其他",
      recommendation,
      confidence,
      reason,
      politicianBuyCount: buyCount,
      politicianSellCount: sellCount,
      totalTradeAmount: totalAmount,
    });
  }

  return recommendations.sort((a, b) => b.confidence - a.confidence);
}
