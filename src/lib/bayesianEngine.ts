/**
 * 贝叶斯供应链瓶颈评分引擎 v5
 * 
 * 核心公式: P(H|E) = P(E|H) × P(H) / [P(E|H)×P(H) + P(E|¬H)×(1-P(H))]
 * 
 * H: "该公司是供应链关键瓶颈节点"
 * P(H): 先验概率 — 基于BOM拆解+技术壁垒+产能稀缺性
 * P(E|H): 似然度 — 证据在H为真时出现的概率
 * P(H|E): 后验概率 — 更新后的瓶颈信念
 * 
 * 四个层次:
 * 1. 先验估计 ← BOM物料清单分析 (物理现实建模)
 * 2. 下注决策 ← 认知差 = 后验 - 市场隐含概率
 * 3. 证据更新 ← 序贯贝叶斯 (每新增一条证据更新一次)
 * 4. 动态轮动 ← 全概率框架下的最优配置
 */

import { GLOBAL_STOCKS, type GlobalStock } from "./globalStocks";

// ========== 评级 ==========

export type RatingLevel = "强烈推荐" | "买入" | "增持" | "持有" | "中性" | "减持" | "卖出";

export function getRating(posterior: number): RatingLevel {
  if (posterior >= 0.70) return "强烈推荐";
  if (posterior >= 0.55) return "买入";
  if (posterior >= 0.40) return "增持";
  if (posterior >= 0.25) return "持有";
  if (posterior >= 0.15) return "中性";
  if (posterior >= 0.08) return "减持";
  return "卖出";
}

// ========== 1️⃣ 先验概率 P(H) — BOM物料清单分析 ==========

export interface PriorBreakdown {
  /** 技术垄断性: 是否有独家专利/工艺 */
  techMoat: number;      // 0-100
  /** 产能稀缺性: 扩产周期/资本壁垒 */
  capacityScarcity: number;
  /** 认证壁垒: 客户认证周期 */
  certBarrier: number;
  /** 替代难度: 客户能否切换供应商 */
  substCost: number;
  /** 产业链位置: 是否是单点故障 */
  chainPosition: number;
  /** BOM分析结论: 直接描述 */
  bomInsight: string;
}

/**
 * 基于行业知识生成BOM分析结论
 * 模拟"拆解BOM表、研读学术论文"后的先验估计
 */
export function bomPrior(stock: GlobalStock): { prior: number; breakdown: PriorBreakdown } {
  // 行业基础先验（基于全球供应链研究）
  const industryBase: Record<string, { prior: number; insight: string }> = {
    "芯片制造":     { prior: 0.65, insight: "先进制程产能全球紧缺，EUV光刻机被ASML垄断" },
    "芯片/内存接口":  { prior: 0.70, insight: "DDR5内存接口芯片只有2家供应商，澜起是龙头" },
    "存储芯片":     { prior: 0.55, insight: "NOR Flash市场寡头格局，兆易创新全球前三" },
    "图像传感器":    { prior: 0.72, insight: "CIS图像传感器全球前三，手机/汽车双轮驱动" },
    "芯片封装测试":   { prior: 0.60, insight: "先进封装产能紧缺，CoWoS供不应求" },
    "芯片设备":     { prior: 0.55, insight: "刻蚀/沉积设备国产替代空间巨大" },
    "芯片刻蚀设备":   { prior: 0.75, insight: "中微刻蚀机打入台积电5nm，全球仅3家供应商" },
    "模拟芯片":     { prior: 0.35, insight: "模拟芯片品类多单品类市场规模小，不易形成垄断" },
    "AI音视频芯片":  { prior: 0.55, insight: "智能终端SoC认证周期长，晶晨份额持续提升" },
    "芯片设计":     { prior: 0.20, insight: "x86授权受限，主要服务国内市场" },
    "AI芯片":      { prior: 0.40, insight: "AI训练芯片需求暴增，但生态壁垒被CUDA锁定" },
    "AI服务器":     { prior: 0.65, insight: "AI服务器全球需求爆发，工业富联全球最大制造商" },
    "光模块":      { prior: 0.68, insight: "AI数据中心带动800G光模块供不应求" },
    "算力/超算":    { prior: 0.30, insight: "超算市场以国内为主，国际竞争力有限" },
    "精密制造":     { prior: 0.70, insight: "苹果核心代工商，精密制造能力全球顶尖" },
    "声学/VR":     { prior: 0.55, insight: "VR/声学组件全球龙头，Meta核心供应商" },
    "显示面板":     { prior: 0.50, insight: "面板周期性强，京东方产能全球第一但技术跟随" },
    "PCB/精密制造":  { prior: 0.55, insight: "PCB/FPC是电子产品基石，东山精密深度绑定苹果" },
    "PCB/AI":     { prior: 0.55, insight: "AI服务器高多层PCB需求暴增，胜宏受益" },
    "储能/锂电池":   { prior: 0.65, insight: "全球动力电池双寡头格局，宁德时代技术领先" },
    "储能/逆变器":   { prior: 0.55, insight: "全球逆变器龙头，但竞争加剧" },
    "电池结构件":    { prior: 0.45, insight: "电池结构件跟随电池厂扩张，壁垒中等" },
    "储能/光伏":    { prior: 0.40, insight: "光伏组件全球需求稳定，但竞争格局较分散" },
    "电力设备":     { prior: 0.35, insight: "变压器/电力设备全球需求稳定，技术壁垒中等" },
    "高端制造/电力":  { prior: 0.30, insight: "大型电力设备国际竞争激烈" },
    "新能源车/电池":  { prior: 0.50, insight: "全球EV龙头，垂直整合壁垒高" },
    "高端制造/光伏":  { prior: 0.50, insight: "HJT设备技术领先，HJT产业化加速" },
    "高端制造/海缆":  { prior: 0.40, insight: "海缆认证周期长，全球海风装机增长稳定" },
  };
  
  const base = industryBase[stock.industry] || { prior: 0.40, insight: "行业地位有待进一步研究" };

  // 叠加海外收入调整（海外收入越高 = 全球竞争力的实证）
  const overseasAdjust = (stock.overseasRatio - 0.30) * 0.3;
  
  // 叠加研发强度调整（高强度研发 = 护城河在拓宽）
  const rdAdjust = Math.min(0.15, stock.rdRatio * 0.3);
  
  // 叠加护城河调整
  const moatMap: Record<string, number> = { "极高": 0.15, "高": 0.08, "中": 0, "低": -0.10 };
  const moatAdjust = moatMap[stock.moatLevel] || 0;

  const prior = Math.min(0.95, Math.max(0.05, base.prior + overseasAdjust + rdAdjust + moatAdjust));

  // BOM分析各维度得分 (0-100)
  const techMoat = Math.min(100, Math.round((base.prior * 50 + (stock.moatLevel === "极高" ? 40 : stock.moatLevel === "高" ? 25 : stock.moatLevel === "中" ? 10 : 0))));
  const capacityScarcity = Math.min(100, Math.round(50 + stock.overseasRatio * 30 + (stock.rdRatio > 0.12 ? 15 : 0)));
  const certBarrier = Math.min(100, Math.round(40 + (stock.moatLevel === "极高" ? 35 : stock.moatLevel === "高" ? 20 : 5)));
  const substCost = Math.min(100, Math.round(45 + stock.overseasRatio * 25 + (stock.moatLevel === "极高" ? 20 : 0)));
  const chainPosition = Math.min(100, Math.round(50 + (stock.overseasRatio > 0.4 ? 20 : 0) + (stock.moatLevel === "极高" ? 20 : 5)));

  return {
    prior: Math.round(prior * 100) / 100,
    breakdown: { techMoat, capacityScarcity, certBarrier, substCost, chainPosition, bomInsight: base.insight },
  };
}

// ========== 2️⃣ 证据收集与似然度 ==========

export interface Evidence {
  type: string;
  source: string;
  strength: string;
  description: string;
  likelihood: number;     // P(E|H)
  falsePositive: number;  // P(E|¬H)
}

/**
 * 从实时数据生成证据
 */
function generateEvidences(
  changePercent: number | null,
  pe: number | null,
  stock: GlobalStock
): Evidence[] {
  const evidences: Evidence[] = [];
  
  // 价格动量证据
  if (changePercent !== null) {
    if (changePercent > 8) {
      evidences.push({
        type: "正面", source: "价格动量", strength: "强",
        description: `月涨幅${changePercent.toFixed(1)}%，需求信号强烈`,
        likelihood: 0.75, falsePositive: 0.15,
      });
    } else if (changePercent > 3) {
      evidences.push({
        type: "正面", source: "价格动量", strength: "中",
        description: `月涨幅${changePercent.toFixed(1)}%，需求温和增长`,
        likelihood: 0.60, falsePositive: 0.30,
      });
    } else if (changePercent < -8) {
      evidences.push({
        type: "反面", source: "价格动量", strength: "强",
        description: `月跌幅${Math.abs(changePercent).toFixed(1)}%，需求走弱信号`,
        likelihood: 0.70, falsePositive: 0.20,
      });
    } else if (changePercent < -3) {
      evidences.push({
        type: "反面", source: "价格动量", strength: "中",
        description: `月跌幅${Math.abs(changePercent).toFixed(1)}%，短期承压`,
        likelihood: 0.55, falsePositive: 0.35,
      });
    }
  }

  // 估值证据 （高PE = 市场认可其稀缺性 = 正面证据）
  if (pe !== null && pe > 0) {
    if (pe > 100) {
      evidences.push({
        type: "正面", source: "估值信号", strength: "中",
        description: `PE ${pe.toFixed(0)}倍，市场给予稀缺性溢价`,
        likelihood: 0.55, falsePositive: 0.35,
      });
    } else if (pe < 20) {
      evidences.push({
        type: "反面", source: "估值信号", strength: "弱",
        description: `PE ${pe.toFixed(0)}倍，市场未识别其稀缺性`,
        likelihood: 0.40, falsePositive: 0.50,
      });
    }
  }

  // 海外收入作为结构性证据
  if (stock.overseasRatio > 0.5) {
    evidences.push({
      type: "正面", source: "财报信号", strength: "弱",
      description: `海外收入占比${(stock.overseasRatio * 100).toFixed(0)}%，全球竞争力已兑现`,
      likelihood: 0.65, falsePositive: 0.25,
    });
  }

  // 研发强度作为结构性证据
  if (stock.rdRatio > 0.15) {
    evidences.push({
      type: "正面", source: "技术进展", strength: "弱",
      description: `研发费用率${(stock.rdRatio * 100).toFixed(1)}%，护城河在拓宽`,
      likelihood: 0.60, falsePositive: 0.25,
    });
  }

  return evidences;
}

// ========== 3️⃣ 贝叶斯更新 ==========

export interface BayesianResult {
  prior: number;           // P(H) 先验
  posterior: number;       // P(H|E) 后验
  confidence: number;      // 置信度
  evidences: Evidence[];
  cognitiveGap: number;    // 认知差 = posterior - marketImplied
  marketImplied: number;   // 市场隐含概率
}

/**
 * 核心贝叶斯更新: P(H|E) = P(E|H)×P(H) / [P(E|H)×P(H) + P(E|¬H)×(1-P(H))]
 */
function bayesianUpdate(prior: number, likelihood: number, falsePositive: number): number {
  const pE = likelihood * prior + falsePositive * (1 - prior);
  if (pE === 0) return prior;
  return (likelihood * prior) / pE;
}

/**
 * 序贯贝叶斯更新：逐条处理证据
 */
export function sequentialUpdate(prior: number, evidences: Evidence[]): number {
  let posterior = prior;
  for (const ev of evidences) {
    if (ev.type === "正面") {
      posterior = bayesianUpdate(posterior, ev.likelihood, ev.falsePositive);
    } else if (ev.type === "反面") {
      // 反面证据: P(E|H) = 1 - likelihood, P(E|¬H) = 1 - falsePositive
      posterior = bayesianUpdate(posterior, 1 - ev.likelihood, 1 - ev.falsePositive);
    }
    // 中性证据不更新
  }
  return Math.round(posterior * 10000) / 10000;
}

/**
 * 市场隐含概率：从PE反推市场对"瓶颈"的定价
 */
export function marketImpliedProb(pe: number | null, prior: number): number {
  if (pe === null || pe <= 0) return prior * 0.5;  // 亏损股 = 市场不认可
  
  // PE越高, 市场隐含的瓶颈概率越高
  // PE: 10=低(0.2)  30=中(0.4)  60=高(0.6)  100+=极高(0.8)
  const base = Math.min(0.8, Math.max(0.1, pe / 150));
  // 叠加行业先验
  return (base + prior) / 2;
}

/**
 * 置信度：基于证据数量和强度
 */
export function calcConfidence(evidenceCount: number): number {
  return Math.min(95, Math.round(15 + evidenceCount * 18));
}

// ========== 4️⃣ 主计算函数 ==========

export interface FullBayesianScore {
  code: string;
  name: string;
  industry: string;
  prior: number;
  priorQuality: string;
  bomInsight: string;
  breakdown: PriorBreakdown;
  posterior: number;
  confidence: number;
  evidences: Evidence[];
  cognitiveGap: number;
  marketImplied: number;
  rotationScore: number;
  rating: RatingLevel;
  action: string;
  overseasRatio: number;
  moatLevel: string;
}

export function calculateBayesianScore(
  stock: GlobalStock,
  changePercent: number | null,
  pe: number | null,
): FullBayesianScore {
  // 1️⃣ 先验 — BOM分析
  const { prior, breakdown } = bomPrior(stock);

  // 2️⃣ 证据收集
  const evidences = generateEvidences(changePercent, pe, stock);

  // 3️⃣ 后验更新
  const posterior = sequentialUpdate(prior, evidences);
  const confidence = calcConfidence(evidences.length);

  // 4️⃣ 市场隐含概率 & 认知差
  const marketImplied = marketImpliedProb(pe, prior);
  const cognitiveGap = Math.round((posterior - marketImplied) * 10000) / 10000;

  // 5️⃣ 轮动分数 = 后验 × 置信度 × |认知差|
  const rotationScore = Math.min(100, Math.round(
    posterior * 35 + (confidence / 100) * 30 + Math.abs(cognitiveGap) * 35
  ));

  // 6️⃣ 评级和操作建议
  const rating = getRating(posterior);
  const action = getActionDesc(rating, stock.overseasRatio);

  const priorQuality = prior >= 0.6 ? "极高" : prior >= 0.4 ? "高" : "中等";

  return {
    code: stock.code,
    name: stock.name,
    industry: stock.industry,
    prior,
    priorQuality,
    bomInsight: breakdown.bomInsight,
    breakdown,
    posterior,
    confidence,
    evidences,
    cognitiveGap,
    marketImplied,
    rotationScore,
    rating,
    action,
    overseasRatio: stock.overseasRatio,
    moatLevel: stock.moatLevel,
  };
}

function getActionDesc(rating: RatingLevel, overseasRatio: number): string {
  if (rating === "强烈推荐" && overseasRatio > 0.5) return "全球瓶颈·强烈推荐·核心持仓";
  if (rating === "强烈推荐") return "强烈推荐·核心持仓";
  if (rating === "买入") return "建议买入·重点配置";
  if (rating === "增持") return "建议增持·逐步加仓";
  if (rating === "持有") return "持有观望·等待更多证据";
  if (rating === "中性") return "中性·等待催化剂出现";
  if (rating === "减持") return "建议减持·证据弱化";
  return "建议卖出·逻辑破坏";
}

/** 批量计算所有股票 */
export function getAllBayesianScores(
  quotes: Record<string, { changePercent: number | null; pe: number | null }>
): FullBayesianScore[] {
  return GLOBAL_STOCKS.map((stock) => {
    const q = quotes[stock.code] || {};
    return calculateBayesianScore(stock, q.changePercent ?? null, q.pe ?? null);
  }).sort((a, b) => b.rotationScore - a.rotationScore);
}
