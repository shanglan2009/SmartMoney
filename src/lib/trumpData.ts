// ============================================================
// Trump Stock Tracker — 数据模型
// ============================================================

/** 交易类型 */
export type TradeType = "buy" | "sell" | "option_buy" | "option_sell";

/** 交易金额范围 */
export type TradeSize =
  | "$1K-$15K"
  | "$15K-$50K"
  | "$50K-$100K"
  | "$100K-$250K"
  | "$250K-$500K"
  | "$500K-$1M"
  | "$1M-$5M"
  | "$5M-$25M"
  | "$25M-$50M"
  | "$50M+";

/** 政要身份 */
export interface Politician {
  id: string;
  name: string;
  title: string;         // 职务
  party: "R" | "D" | "I";
  imageUrl?: string;
  state?: string;
  /** 关联到 Trump 的级别: admin=特朗普政府成员, congress=国会, cabinet=内阁 */
  relation: "trump_admin" | "trump_cabinet" | "congress" | "other";
  /** 数据源URL */
  sourceUrls: string[];
}

/** 单笔交易 */
export interface Trade {
  id: string;
  politicianId: string;
  ticker: string;
  companyName: string;
  type: TradeType;
  size: TradeSize;
  amount?: number;         // 估算金额(美元)
  date: string;            // ISO date string
  filingDate: string;      // 披露日期
  sector: string;
  /** 交易后持仓 */
  afterTradeHoldings?: string;
  source: "open_cabinet" | "trump_trades" | "trump_tracker" | "oge" | "propublica";
  sourceUrl: string;
}

/** 持仓汇总 */
export interface Holding {
  ticker: string;
  companyName: string;
  sector: string;
  shares: number;
  value: number;
  valueRange: string;
  pctOfPortfolio: number;
  asOfDate: string;
}

/** 政要持仓画像 */
export interface PoliticianPortfolio {
  politician: Politician;
  holdings: Holding[];
  recentTrades: Trade[];
  totalValue: number;
  totalValueRange: string;
  lastUpdated: string;
}

/** 仪表盘统计 */
export interface DashboardStats {
  totalPoliticians: number;
  totalTrades: number;
  totalValue: number;
  topBuys: { ticker: string; companyName: string; count: number; totalAmount: number }[];
  topSells: { ticker: string; companyName: string; count: number; totalAmount: number }[];
  topHeldByCount: { ticker: string; companyName: string; count: number; sector: string }[];
  sectorDistribution: { sector: string; totalValue: number; count: number }[];
  dailyRefreshTime: string;
  dataSources: { name: string; url: string; status: "ok" | "stale" | "error"; lastFetch: string }[];
}

/** 买入建议等级 */
export type RecommendationLevel = "strong_buy" | "buy" | "hold" | "sell" | "strong_sell";

export interface StockRecommendation {
  ticker: string;
  companyName: string;
  sector: string;
  recommendation: RecommendationLevel;
  confidence: number;       // 0–100
  reason: string;
  politicianBuyCount: number;
  politicianSellCount: number;
  totalTradeAmount: number;
}
