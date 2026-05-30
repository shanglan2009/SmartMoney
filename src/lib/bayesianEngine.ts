/**
 * 贝叶斯供应链评分引擎 v3.0
 * 
 * 核心哲学: P(H|E) = P(E|H) × P(H) / P(E)
 * 
 * H = "该公司是供应链关键瓶颈节点"
 * P(H) = 先验概率（基于BOM分析、产业物理结构）
 * P(E|H) = 似然度（证据在H为真时出现的概率）
 * P(H|E) = 后验概率（更新后的信念）
 * 
 * 四大模块：
 * 1. 先验估计器 — BOM拆解、供应商结构 → P(H)
 * 2. 证据收集器 — 公告、价格、新闻 → P(E|H), P(E|¬H)
 * 3. 后验更新器 — 贝叶斯公式 → P(H|E)
 * 4. 轮动决策器 — 全概率框架 → 最优持仓分配
 */

export type BottleneckType = 
  | "技术垄断"     // 独家专利/配方/工艺
  | "资源锁定"     // 矿产/原材料产地控制
  | "产能瓶颈"     // 扩产周期长、资本门槛高
  | "认证壁垒"     // 客户认证周期长、不可替代
  | "地理卡位"     // 关键运输通道/港口
  | "规模成本";     // 规模效应带来的成本优势

export interface BayesianScore {
  // ===== 先验 =====
  prior: number;           // P(H) 先验概率 0-1
  priorQuality: "极高" | "高" | "中等" | "低";  // 先验信息来源质量
  bottleneckType: BottleneckType[];
  bottleneckStrength: number;  // 瓶颈强度 0-100
  
  // ===== 证据 =====
  evidenceCount: number;     // 累计证据条数
  positiveEvidence: number;  // 正面证据
  negativeEvidence: number;  // 反面证据
  latestEvidence: EvidenceItem | null;
  
  // ===== 后验 =====
  posterior: number;         // P(H|E) 后验概率 0-1
  confidence: number;        // 置信度 0-100 (证据越多越高)
  credibilityInterval: [number, number];  // 95%置信区间
  
  // ===== 市场偏差 =====
  marketImpliedProb: number;  // 市场隐含概率（通过PE/市值倒推）
  mispricing: number;         // 认知差 = posterior - marketImpliedProb
  mispricingSignal: "严重低估" | "低估" | "合理" | "高估" | "严重高估";
  
  // ===== 轮动决策 =====
  rotationScore: number;      // 轮动优先级 0-100
  action: "强烈买入" | "买入" | "持有" | "减仓" | "卖出";
  positionSize: number;       // 建议仓位比例 0-1
}

export interface EvidenceItem {
  date: string;
  type: "正面" | "反面" | "中性";
  category: "技术" | "订单" | "产能" | "管理" | "政策" | "竞争";
  description: string;
  likelihood: number;     // P(E|H) 似然度 0-1
  source: string;
}

// ========== 贝叶斯评分引擎 ==========

export class BayesianEngine {
  
  // ===== 1. 先验估计 =====
  
  /**
   * 计算先验概率 P(H)
   * 基于：供应商集中度、进口依赖度、技术壁垒、认证壁垒
   */
  static estimatePrior(
    industry: string,
    suppliers: any[],
    specialRisk: number,
  ): { prior: number; quality: BayesianScore["priorQuality"]; bottleneckType: BottleneckType[] } {
    let prior = 0.3;  // 基础先验30%
    const types: BottleneckType[] = [];

    // 供应商集中度 → 单一供应商占比越高 → 瓶颈概率越高
    const ratios = suppliers.map(s => s.ratio).sort((a, b) => b - a);
    const cr1 = ratios[0] || 0;
    if (cr1 > 0.4) { prior += 0.25; types.push("资源锁定"); }
    else if (cr1 > 0.25) { prior += 0.15; types.push("资源锁定"); }
    else if (cr1 > 0.15) { prior += 0.08; }

    // 进口依赖 → 海外供应商越多 → 地缘瓶颈概率越高
    const foreignRatio = suppliers
      .filter(s => /ASML|Lumentum|台积电|英伟达|NVIDIA|应用材料|东京电子/i.test(s.name))
      .reduce((sum, s) => sum + s.ratio, 0);
    if (foreignRatio > 0.5) { prior += 0.20; types.push("地理卡位"); }
    else if (foreignRatio > 0.3) { prior += 0.12; }

    // 特殊风险 → 已知瓶颈
    if (specialRisk > 25) { prior += 0.15; types.push("技术垄断"); }
    else if (specialRisk > 15) { prior += 0.10; }

    // 技术壁垒（行业相关）
    if (industry.includes("芯片")) { prior += 0.10; types.push("技术垄断"); types.push("认证壁垒"); }
    if (industry.includes("光模块")) { prior += 0.08; types.push("技术垄断"); }
    if (industry.includes("机器人")) { prior += 0.05; types.push("认证壁垒"); }
    if (industry.includes("储能")) { prior += 0.05; types.push("产能瓶颈"); }

    // 质量评级
    let quality: BayesianScore["priorQuality"] = "中等";
    if (prior > 0.7) quality = "极高";
    else if (prior > 0.5) quality = "高";
    else if (prior > 0.3) quality = "中等";
    else quality = "低";

    return {
      prior: Math.min(0.95, Math.round(prior * 100) / 100),
      quality,
      bottleneckType: [...new Set(types)],
    };
  }

  // ===== 2. 后验更新 =====

  /**
   * 贝叶斯更新: P(H|E) = P(E|H) × P(H) / [P(E|H)×P(H) + P(E|¬H)×(1-P(H))]
   */
  static bayesianUpdate(
    prior: number,
    likelihoodPositive: number,   // P(E|H) — 证据在H为真时出现的概率
    likelihoodNegative: number,   // P(E|¬H) — 证据在H为假时出现的概率
    evidenceStrength: "强" | "中" | "弱"
  ): number {
    // 证据强度调整
    const strengthMap = { "强": 1.0, "中": 0.6, "弱": 0.3 };
    const adj = strengthMap[evidenceStrength];
    
    // P(E) = P(E|H)×P(H) + P(E|¬H)×(1-P(H))
    const probE = (likelihoodPositive * prior + likelihoodNegative * (1 - prior)) * adj + (1 - adj) * 0.5;
    
    if (probE === 0) return prior;
    
    // P(H|E) = P(E|H) × P(H) / P(E)
    const posterior = (likelihoodPositive * prior) / probE;
    return Math.min(0.99, Math.max(0.01, Math.round(posterior * 100) / 100));
  }

  /**
   * 累计证据更新（序贯贝叶斯）
   */
  static sequentialUpdate(
    prior: number,
    evidences: { type: "正面" | "反面" | "中性"; likelihood: number }[]
  ): number {
    let posterior = prior;
    for (const ev of evidences) {
      if (ev.type === "正面") {
        posterior = this.bayesianUpdate(posterior, ev.likelihood, 1 - ev.likelihood, "中");
      } else if (ev.type === "反面") {
        posterior = this.bayesianUpdate(posterior, 1 - ev.likelihood, ev.likelihood, "中");
      }
      // 中性证据不改变后验
    }
    return posterior;
  }

  // ===== 3. 置信度计算 =====

  /**
   * 置信度：证据越多、证据越强 → 置信度越高
   */
  static calculateConfidence(
    evidenceCount: number,
    positiveRatio: number,
    likelihoodStrength: number
  ): number {
    // 至少需要3条证据才有基本置信度
    if (evidenceCount < 3) return Math.min(40, evidenceCount * 13);
    
    const baseConfidence = Math.min(60, evidenceCount * 5);
    const ratioBonus = Math.abs(positiveRatio - 0.5) * 40;  // 证据越偏向一侧越自信
    const strengthBonus = likelihoodStrength * 20;
    
    return Math.min(95, Math.round(baseConfidence + ratioBonus + strengthBonus));
  }

  // ===== 4. 市场定价偏差 =====

  /**
   * 市场隐含概率：从PE比率反推市场对瓶颈的定价
   * 高PE → 市场已经price in了增长→隐含概率高
   * 低PE → 市场没看到瓶颈价值→隐含概率低
   */
  static marketImpliedProbability(pe: number | null, industry: string): number {
    if (pe === null || pe <= 0) return 0.3;
    
    const industryPEs: Record<string, number> = {
      "芯片": 55, "AI": 45, "储能": 25, "电力": 18, "高端制造": 28, "机器人": 35,
    };
    let basePE = 25;
    for (const [key, val] of Object.entries(industryPEs)) {
      if (industry.includes(key)) { basePE = val; break; }
    }
    
    const ratio = pe / basePE;
    // PE远高于行业 → 市场已price in → 隐含概率高
    // PE远低于行业 → 市场没看到价值 → 隐含概率低
    return Math.min(0.9, Math.max(0.1, Math.round(ratio * 0.3 * 100) / 100));
  }

  static getMispricingSignal(diff: number): BayesianScore["mispricingSignal"] {
    if (diff > 0.3) return "严重低估";
    if (diff > 0.15) return "低估";
    if (diff > -0.15) return "合理";
    if (diff > -0.3) return "高估";
    return "严重高估";
  }

  // ===== 5. 轮动决策 =====

  /**
   * 轮动分数 = 后验概率 × 置信度 × |认知差|
   * 分数越高 → 越应该配置该标的
   */
  static calculateRotationScore(
    posterior: number,
    confidence: number,
    mispricing: number
  ): number {
    return Math.round(
      posterior * 40 +           // 瓶颈确定性
      (confidence / 100) * 30 +  // 置信度
      Math.abs(mispricing) * 30   // 认知差幅度
    );
  }

  static getAction(
    posterior: number,
    mispricing: number,
    confidence: number
  ): BayesianScore["action"] {
    if (posterior > 0.6 && mispricing > 0.2 && confidence > 50) return "强烈买入";
    if (posterior > 0.4 && mispricing > 0.1) return "买入";
    if (posterior > 0.2) return "持有";
    if (mispricing < -0.15 && confidence > 40) return "减仓";
    return "卖出";
  }

  static getPositionSize(action: BayesianScore["action"], confidence: number): number {
    const map: Record<string, number> = {
      "强烈买入": 0.15, "买入": 0.10, "持有": 0.05, "减仓": 0.02, "卖出": 0,
    };
    const base = map[action] || 0.05;
    return Math.round(base * (confidence / 50) * 100) / 100;
  }

  // ===== 6. 主计算函数 =====

  static calculate(
    industry: string,
    suppliers: any[],
    specialRisk: number,
    pe: number | null,
    changePercent: number | null,
    code?: string,
  ): BayesianScore {
    // 1. 先验概率
    const { prior, quality, bottleneckType } = this.estimatePrior(industry, suppliers, specialRisk);
    
    // 2. 生成模拟证据
    const evidences: { type: "正面" | "反面" | "中性"; likelihood: number }[] = [];
    // 价格变化作为证据
    if (changePercent !== null) {
      if (changePercent > 5) {
        evidences.push({ type: "正面", likelihood: 0.7 });
      } else if (changePercent < -5) {
        evidences.push({ type: "反面", likelihood: 0.6 });
      } else {
        evidences.push({ type: "中性", likelihood: 0.5 });
      }
    }
    // PE作为证据
    if (pe !== null && pe > 0) {
      if (pe > 80) evidences.push({ type: "正面", likelihood: 0.6 }); // 高PE = 市场认可
      else if (pe < 15) evidences.push({ type: "反面", likelihood: 0.5 });
    }
    // 特殊风险作为证据
    if (specialRisk > 20) evidences.push({ type: "正面", likelihood: 0.75 });
    
    // 3. 后验更新
    const posterior = this.sequentialUpdate(prior, evidences);
    
    // 4. 置信度
    const positiveCount = evidences.filter(e => e.type === "正面").length;
    const totalCount = evidences.length;
    const confidence = this.calculateConfidence(
      totalCount,
      totalCount > 0 ? positiveCount / totalCount : 0.5,
      0.6
    );
    
    // 5. 市场偏差
    const marketProb = this.marketImpliedProbability(pe, industry);
    const mispricing = Math.round((posterior - marketProb) * 100) / 100;
    
    // 6. 轮动决策
    const rotationScore = this.calculateRotationScore(posterior, confidence, mispricing);
    const action = this.getAction(posterior, mispricing, confidence);
    const positionSize = this.getPositionSize(action, confidence);

    // 95%置信区间
    const intervalHalf = (1 - confidence / 100) * 0.3;
    const lo = Math.max(0, Math.round((posterior - intervalHalf) * 100) / 100);
    const hi = Math.min(1, Math.round((posterior + intervalHalf) * 100) / 100);

    return {
      prior,
      priorQuality: quality,
      bottleneckType,
      bottleneckStrength: Math.round(prior * 100),
      evidenceCount: totalCount,
      positiveEvidence: positiveCount,
      negativeEvidence: totalCount - positiveCount,
      latestEvidence: null,
      posterior,
      confidence,
      credibilityInterval: [lo, hi],
      marketImpliedProb: marketProb,
      mispricing,
      mispricingSignal: this.getMispricingSignal(mispricing),
      rotationScore,
      action: this.getAction(posterior, mispricing, confidence),
      positionSize,
    };
  }
}
