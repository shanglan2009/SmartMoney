/**
 * 全球供应链分工评分引擎 v4
 * 
 * 评分维度:
 * 1. 海外收入占比 (30%) - 国际分工参与广度
 * 2. 国际供应链地位 (25%) - 在巨头供应链中的不可替代性
 * 3. 供应链护城河 (20%) - 技术壁垒/替代难度
 * 4. 研发强度 (15%) - R&D投入
 * 5. 客户集中度 (10%) - 单一客户依赖风险
 */

import { GLOBAL_STOCKS, type GlobalStock } from "./globalStocks";

export type RatingLevel = "高风险观察" | "高风险偏多" | "观察" | "积极观察" | "谨慎";

export function getRating(score: number): RatingLevel {
  if (score >= 85) return "高风险观察";
  if (score >= 70) return "高风险偏多";
  if (score >= 40) return "观察";
  if (score >= 20) return "积极观察";
  return "谨慎";
}

export function getAction(score: number): string {
  if (score >= 85) return "警惕";
  if (score >= 70) return "减仓";
  if (score >= 40) return "持有";
  if (score >= 20) return "买入";
  return "积极加仓";
}

// 护城河评分映射
const MOAT_SCORES: Record<string, number> = {
  "极高": 85, "高": 65, "中": 40, "低": 20,
};

export interface GlobalScore {
  score: number;
  rating: RatingLevel;
  action: string;
  overseasScore: number;
  positionScore: number;
  moatScore: number;
  rdScore: number;
  concentrationScore: number;
  dimensions: { name: string; score: number; weight: number }[];
}

export function calculateScore(stock: GlobalStock): GlobalScore {
  // ===== 1. 海外收入占比 (30%) =====
  const overseasScore = Math.min(100, stock.overseasRatio * 120); // 80%海外 → 96分

  // ===== 2. 国际供应链地位 (25%) =====
  // 按客户重要性: NVIDIA/Apple/TSMC = 顶级, 其他巨头=高级, 国内=低
  const topClients = ["NVIDIA", "苹果", "台积电", "特斯拉", "AMD"];
  const majorClients = ["三星", "微软", "亚马逊", "Google", "Meta", "英特尔", "SK海力士"];
  const hasTop = stock.globalCustomers.some(c => topClients.some(t => c.includes(t)));
  const hasMajor = stock.globalCustomers.some(c => majorClients.some(m => c.includes(m)));
  const clientCount = stock.globalCustomers.length;
  
  let positionScore = 30; // 基础分
  if (hasTop) positionScore += 35; // 有顶级客户
  if (hasMajor) positionScore += 20;
  if (clientCount >= 4) positionScore += 10;
  else if (clientCount >= 2) positionScore += 5;
  if (stock.role.includes("全球") || stock.role.includes("龙头")) positionScore += 10;

  // ===== 3. 供应链护城河 (20%) =====
  const moatScore = MOAT_SCORES[stock.moatLevel] || 40;

  // ===== 4. 研发强度 (15%) =====
  const rdScore = Math.min(100, stock.rdRatio * 200); // 35%研发 → 70分

  // ===== 5. 客户集中度 (10%) =====
  // 客户越多越分散 → 风险越低 → 分数越高
  const concentrationScore = Math.min(100, 20 + stock.globalCustomers.length * 15);

  // ===== 综合加权 =====
  const total =
    overseasScore * 0.30 +
    positionScore * 0.25 +
    moatScore * 0.20 +
    rdScore * 0.15 +
    concentrationScore * 0.10;

  const score = Math.round(total * 10) / 10;
  const rating = getRating(score);
  const action = getAction(score);

  return {
    score,
    rating,
    action,
    overseasScore: Math.round(overseasScore),
    positionScore: Math.round(positionScore),
    moatScore,
    rdScore: Math.round(rdScore),
    concentrationScore: Math.round(concentrationScore),
    dimensions: [
      { name: "🌐 海外收入占比", score: Math.round(overseasScore), weight: 0.30 },
      { name: "🏭 国际供应链地位", score: Math.round(positionScore), weight: 0.25 },
      { name: "🛡️ 供应链护城河", score: moatScore, weight: 0.20 },
      { name: "🔬 研发强度", score: Math.round(rdScore), weight: 0.15 },
      { name: "📊 客户分散度", score: Math.round(concentrationScore), weight: 0.10 },
    ],
  };
}

/** 获取所有国际分工股票的评分 */
export function getAllScores() {
  return GLOBAL_STOCKS.map((stock) => {
    const s = calculateScore(stock);
    return {
      code: stock.code,
      name: stock.name,
      industry: stock.industry,
      overseasRatio: stock.overseasRatio,
      rdRatio: stock.rdRatio,
      moatLevel: stock.moatLevel,
      globalCustomers: stock.globalCustomers,
      ...s,
    };
  }).sort((a, b) => b.score - a.score);
}

/** 检查海外收入是否达标 */
export function hasOverseasBusiness(overseasRatio: number): boolean {
  return overseasRatio >= 0.10;
}
