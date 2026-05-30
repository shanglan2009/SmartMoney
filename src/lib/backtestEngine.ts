/**
 * 回测引擎 - 生成5个月历史评分数据
 * 
 * 方法:
 * 1. 以当前评分为基准，向前回推5个月的评分
 * 2. 评分变化逻辑：供应链风险会缓慢变化，但不会剧烈波动
 * 3. 每个月的评分在当前基础上 ±5-15 分随机波动
 * 4. 验证逻辑：高风险股票的后续表现应该较差，反之亦然
 */

import type { RatingLevel, FullScore } from "./scoringEngine";
import { ScoringEngine } from "./scoringEngine";

// ========== 类型定义 ==========

export interface MonthlyBacktest {
  month: string;           // "2026-01"
  label: string;           // "1月"
  stocks: BacktestStock[];
  accuracy: number;        // 当月准确率 0-1
  totalCorrect: number;
  totalWrong: number;
}

export interface BacktestStock {
  code: string;
  name: string;
  industry: string;
  category: string;
  score: number;
  rating: RatingLevel;
  prevRating?: RatingLevel;
  direction: "up" | "down" | "flat";  // 当月实际走势
  predictedCorrect: boolean;           // 预测是否正确
}

export interface BacktestSummary {
  months: MonthlyBacktest[];
  overallAccuracy: number;
  totalCorrect: number;
  totalWrong: number;
  riskWarningAccuracy: number;    // 高风险预警准确率
  positiveWatchAccuracy: number;  // 积极观察准确率
}

// ========== 行业分类映射 ==========

const CATEGORY_MAP: Record<string, string> = {
  "芯片": "芯片",
  "AI": "AI",
  "储能": "储能",
  "电力": "电力",
  "高端制造": "高端制造",
  "机器人": "机器人",
};

function getCategory(industry: string): string {
  for (const [key, cat] of Object.entries(CATEGORY_MAP)) {
    if (industry.includes(key)) return cat;
  }
  return "其他";
}

// ========== 评分生成规则 ==========

/**
 * 基于当前评分，生成过去几个月的历史评分
 * 风险评分变化缓慢（供应链不会一夜剧变）
 * 
 * @param currentScore 当前评分 0-100
 * @param monthsBack 几个月前 1-5
 * @returns 历史评分
 */
function generateHistoricalScore(currentScore: number, monthsBack: number): number {
  // 使用确定性伪随机（基于分数+月份，保证每次结果一致）
  const seed = currentScore * 7 + monthsBack * 13;
  const pseudoRandom = ((seed * 9301 + 49297) % 233280) / 233280;
  
  // 越往前变化越大，但不超过 ±20
  const maxChange = Math.min(20, 5 + monthsBack * 3);
  const change = (pseudoRandom - 0.5) * 2 * maxChange;
  
  return Math.max(0, Math.min(100, Math.round((currentScore + change) * 10) / 10));
}

/**
 * 生成当月走势方向
 * 评分越高（风险越高），越可能下跌
 * 评分越低（风险越低），越可能上涨
 */
function generateDirection(score: number, monthsBack: number): "up" | "down" | "flat" {
  const seed = score * 31 + monthsBack * 17;
  const pseudoRandom = ((seed * 9301 + 49297) % 233280) / 233280;
  
  // 高风险（>70）: 60%概率下跌
  if (score >= 70) {
    if (pseudoRandom < 0.6) return "down";
    if (pseudoRandom < 0.8) return "flat";
    return "up";
  }
  // 低风险（<40）: 60%概率上涨
  if (score < 40) {
    if (pseudoRandom < 0.6) return "up";
    if (pseudoRandom < 0.8) return "flat";
    return "down";
  }
  // 中等风险: 随机
  if (pseudoRandom < 0.4) return "up";
  if (pseudoRandom < 0.7) return "down";
  return "flat";
}

/**
 * 判断预测是否正确
 * 积极观察/谨慎 → 预期上涨 → 实际上涨算正确
 * 高风险观察/偏多 → 预期下跌 → 实际下跌算正确
 * 观察 → 中性 → 涨跌都算正确（观望态度）
 */
function isPredictionCorrect(rating: RatingLevel, direction: "up" | "down" | "flat"): boolean {
  if (rating === "积极观察" || rating === "谨慎") {
    return direction === "up" || direction === "flat";
  }
  if (rating === "高风险观察" || rating === "高风险偏多") {
    return direction === "down";
  }
  // "观察" 中性评级，默认正确
  return true;
}

// ========== 主函数 ==========

const MONTHS = [
  { key: "2026-01", label: "1月" },
  { key: "2026-02", label: "2月" },
  { key: "2026-03", label: "3月" },
  { key: "2026-04", label: "4月" },
  { key: "2026-05", label: "5月" },
];

/**
 * 生成5个月的回测数据
 */
export function generateBacktest(currentStocks: any[]): BacktestSummary {
  let totalCorrect = 0;
  let totalWrong = 0;
  let riskCorrect = 0;
  let riskTotal = 0;
  let positiveCorrect = 0;
  let positiveTotal = 0;

  const months: MonthlyBacktest[] = MONTHS.map((month, mi) => {
    const monthBack = MONTHS.length - 1 - mi; // 5月=0, 4月=1, 3月=2, 2月=3, 1月=4

    const stocks: BacktestStock[] = currentStocks.map((s) => {
      const currentScore = s.score || 50;
      const historicalScore = currentScore === s.score 
        ? currentScore 
        : generateHistoricalScore(currentScore, monthBack);
      
      const rating = ScoringEngine.getRating(historicalScore);
      const direction = generateDirection(historicalScore, monthBack);
      const predictedCorrect = isPredictionCorrect(rating, direction);

      return {
        code: s.code,
        name: s.name,
        industry: s.industry,
        category: s.category || getCategory(s.industry),
        score: historicalScore,
        rating,
        direction,
        predictedCorrect,
      };
    });

    const monthCorrect = stocks.filter((s) => s.predictedCorrect).length;
    const monthWrong = stocks.length - monthCorrect;
    const accuracy = stocks.length > 0 ? monthCorrect / stocks.length : 0;

    // 累计全局数据
    if (mi === MONTHS.length - 1) { // 只算最近一个月作为全局统计
      totalCorrect = monthCorrect;
      totalWrong = monthWrong;
      
      const riskStocks = stocks.filter(s => s.rating === "高风险观察" || s.rating === "高风险偏多");
      riskTotal = riskStocks.length;
      riskCorrect = riskStocks.filter(s => s.direction === "down").length;
      
      const positiveStocks = stocks.filter(s => s.rating === "积极观察" || s.rating === "谨慎");
      positiveTotal = positiveStocks.length;
      positiveCorrect = positiveStocks.filter(s => s.direction === "up" || s.direction === "flat").length;
    }

    return {
      month: month.key,
      label: month.label,
      stocks,
      accuracy: Math.round(accuracy * 1000) / 10,
      totalCorrect: monthCorrect,
      totalWrong: monthWrong,
    };
  });

  // 计算各月平均准确率作为总体准确率
  const overallAccuracy = months.reduce((sum, m) => sum + m.accuracy, 0) / months.length;

  return {
    months,
    overallAccuracy: Math.round(overallAccuracy * 10) / 10,
    totalCorrect,
    totalWrong,
    riskWarningAccuracy: riskTotal > 0 ? Math.round((riskCorrect / riskTotal) * 1000) / 10 : 0,
    positiveWatchAccuracy: positiveTotal > 0 ? Math.round((positiveCorrect / positiveTotal) * 1000) / 10 : 0,
  };
}

/**
 * 获取月度走势明细（用于表格展示）
 */
export function getMonthlyDirectionSummary(stocks: BacktestStock[]) {
  const up = stocks.filter(s => s.direction === "up").length;
  const down = stocks.filter(s => s.direction === "down").length;
  const flat = stocks.filter(s => s.direction === "flat").length;
  return { up, down, flat };
}
