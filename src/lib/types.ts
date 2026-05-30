// ========== 供应链评分 & 评级 ==========

export type RatingLevel =
  | "高风险观察"
  | "高风险偏多"
  | "观察"
  | "积极观察"
  | "谨慎";

export const RATING_ORDER: RatingLevel[] = [
  "高风险观察",
  "高风险偏多",
  "观察",
  "积极观察",
  "谨慎",
];

export const RATING_COLORS: Record<RatingLevel, string> = {
  "高风险观察": "rating-high-risk-watch",
  "高风险偏多": "rating-high-risk-bullish",
  "观察": "rating-watch",
  "积极观察": "rating-positive-watch",
  "谨慎": "rating-cautious",
};

// ========== 评分维度 ==========

export interface ScoreDimension {
  name: string;
  score: number; // 0-100
  weight: number; // 0-1
  description?: string;
}

export interface SupplyChainScore {
  overall: number; // 0-100
  dimensions: ScoreDimension[];
  rating: RatingLevel;
}

// ========== 公司信息 ==========

export interface Company {
  code: string;
  name: string;
  industry: string;
  market: "SH" | "SZ" | "BJ";
  description?: string;
  revenue?: number;
  revenueYoy?: number;
  grossMargin?: number;
  rdExpense?: number;
}

// ========== 实时行情类型 ==========

export interface LiveQuote {
  code: string;
  name: string;
  price: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  turnoverRate: number;
  pe: number;
  totalMarketCap: number;
  circulatingMarketCap: number;
}

// ========== 带实时行情的列表项 ==========

export interface LiveStockItem extends StockListItem {
  price?: number;
  liveChange?: string;
}

// ========== 股票列表项 ==========

export interface StockListItem {
  code: string;
  name: string;
  industry: string;
  score: number;
  rating: RatingLevel;
  priceChange: string;
  signal: string;
  lastUpdated: string;
}

// ========== 供应商 ==========

export interface Supplier {
  id: string;
  name: string;
  ratio: number; // 采购占比 0-1
  industry?: string;
  financialHealth?: "healthy" | "normal" | "risky";
  isListed: boolean;
  listedCode?: string;
  contractAmount?: number;
}

// ========== 供应链关系 ==========

export interface SupplyEdge {
  source: string;
  target: string;
  type: "supplies_to" | "invests_in" | "competes_with";
  amount?: number;
  label?: string;
}

export interface SupplyGraph {
  nodes: { id: string; name: string; type: "company" | "supplier" | "industry"; group?: number }[];
  edges: SupplyEdge[];
}

// ========== 风险事件 ==========

export interface RiskEvent {
  date: string;
  type: "原材料涨价" | "供应商暴雷" | "合同丢失" | "进口受限" | "产能不足" | "政策变化";
  title: string;
  impact: "high" | "medium" | "low";
}

// ========== API 响应 ==========

export interface StockAnalysisResponse {
  company: Company;
  score: SupplyChainScore;
  suppliers: Supplier[];
  topCustomers: { name: string; ratio: number }[];
  graph: SupplyGraph;
  events: RiskEvent[];
  history: { date: string; rating: RatingLevel }[];
}
