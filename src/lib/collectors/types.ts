/**
 * 数据采集器 - 统一类型定义
 */

export interface Announcement {
  date: string;
  title: string;
  type: "重大合同" | "中标公告" | "关联交易" | "对外投资" | "业绩预告" | "停产检修";
  stockCode: string;
  amount?: number;        // 金额(亿元)
  isPositive: boolean;    // 正面/负面
  source: string;
}

export interface TradeData {
  date: string;
  hsCode: string;         // HS编码
  exportAmount: number;   // 出口额(亿元)
  importAmount: number;   // 进口额(亿元)
  yoyChange: number;      // 同比变化%
  source: string;
}

export interface PatentData {
  patentId: string;
  title: string;
  company: string;
  type: "发明" | "实用新型" | "外观设计";
  applicationDate: string;
  status: "授权" | "审查中";
  techField: string;
  source: string;
}

export interface MaterialPrice {
  name: string;
  price: number;
  changePercent: number;
  unit: string;
  alertLevel: "正常" | "关注" | "警报";
  updatedAt: string;
  source: string;
}

export interface BidEvent {
  date: string;
  bidder: string;         // 投标方
  projectName: string;
  amount: number;         // 金额(万元)
  isWin: boolean;         // 是否中标
  category: string;
  source: string;
}

/** 统一证据结构 */
export interface Evidence {
  date: string;
  source: "公告" | "进出口" | "专利" | "大宗商品" | "招标" | "全球供应链";
  type: "正面" | "反面" | "中性";
  stockCode?: string;
  description: string;
  strength: "强" | "中" | "弱";
  likelihood: number;     // P(E|H)
  falsePositive: number;  // P(E|¬H)
  detail?: any;
}
