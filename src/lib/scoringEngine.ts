/**
 * 多因子供应链评分引擎 v2.0
 * 
 * 9维度评分（6项供应链 + 3项市场因子）
 * 评分范围: 0-100 (越高越危险/越值得警惕)
 * 
 * 评级映射:
 *   85-100: 高风险观察 → 强烈建议卖出/回避
 *   70-84:  高风险偏多 → 建议减仓/谨慎
 *   40-69:  观察 → 持有/观望
 *   20-39:  积极观察 → 适合买入建仓
 *   0-19:   谨慎 → 安全/可加仓
 * 
 * 新增因子说明:
 * - 价格动量: 连续上涨+≥0 → 加分(买), 连续下跌 → 减分(卖)
 * - 估值吸引力: PE低于行业中位数 → 加分, PE过高 → 减分
 * - 市场情绪: 高换手率+高波动 → 情绪过热 → 减分
 */

export type RatingLevel = "高风险观察" | "高风险偏多" | "观察" | "积极观察" | "谨慎";

export interface ScoreDimension {
  name: string;
  score: number;
  weight: number;     // 权重
  value?: number;     // 原始值(用于展示)
  isSupplyChain: boolean;  // 是否供应链因子
}

export interface FullScore {
  overall: number;
  rating: RatingLevel;
  dimensions: ScoreDimension[];
  /** 综合建议 */
  action: "强烈卖出" | "减仓" | "持有观望" | "适合买入" | "积极加仓";
  /** 买入信号强度 0-100 */
  buySignal: number;
  /** 卖出信号强度 0-100 */
  sellSignal: number;
}

// ========== 供应商类型 ==========

export interface SupplierInput {
  name: string;
  ratio: number;
  industry?: string;
  financialHealth?: "healthy" | "normal" | "risky";
  isListed?: boolean;
  listedCode?: string;
}

// ========== 行业供应商数据 ==========
// (保持不变)
const INDUSTRY_SUPPLIERS: Record<string, SupplierInput[]> = {
  "芯片制造": [
    { name: "ASML (荷兰)", ratio: 0.32, industry: "光刻机", financialHealth: "healthy", isListed: true, listedCode: "ASML" },
    { name: "应用材料 (AMAT)", ratio: 0.18, industry: "沉积设备", financialHealth: "healthy", isListed: true, listedCode: "AMAT" },
    { name: "东京电子 (TEL)", ratio: 0.15, industry: "刻蚀设备", financialHealth: "healthy", isListed: true, listedCode: "TELYF" },
    { name: "中微公司", ratio: 0.08, industry: "刻蚀设备", financialHealth: "healthy", isListed: true, listedCode: "688012" },
    { name: "沪硅产业", ratio: 0.06, industry: "硅片", financialHealth: "normal", isListed: true, listedCode: "688126" },
  ],
  "AI芯片": [
    { name: "台积电 (TSMC)", ratio: 0.55, industry: "晶圆代工", financialHealth: "healthy", isListed: true, listedCode: "TSM" },
    { name: "中芯国际", ratio: 0.15, industry: "晶圆代工", financialHealth: "normal", isListed: true, listedCode: "688981" },
    { name: "芯原股份", ratio: 0.08, industry: "IP授权", financialHealth: "normal", isListed: true, listedCode: "688521" },
  ],
  "储能/锂电池": [
    { name: "赣锋锂业", ratio: 0.25, industry: "锂矿", financialHealth: "normal", isListed: true, listedCode: "002460" },
    { name: "华友钴业", ratio: 0.18, industry: "钴矿", financialHealth: "normal", isListed: true, listedCode: "600516" },
    { name: "天齐锂业", ratio: 0.15, industry: "锂矿", financialHealth: "risky", isListed: true, listedCode: "002466" },
    { name: "德方纳米", ratio: 0.10, industry: "正极材料", financialHealth: "normal", isListed: true, listedCode: "300769" },
  ],
  "光模块": [
    { name: "Lumentum (美)", ratio: 0.28, industry: "光芯片", financialHealth: "healthy", isListed: true, listedCode: "LITE" },
    { name: "Coherent (美)", ratio: 0.22, industry: "光芯片", financialHealth: "normal", isListed: true, listedCode: "COHR" },
  ],
  "高端制造/AI服务器": [
    { name: "英伟达 (NVIDIA)", ratio: 0.35, industry: "GPU", financialHealth: "healthy", isListed: true, listedCode: "NVDA" },
    { name: "英特尔", ratio: 0.15, industry: "CPU", financialHealth: "normal", isListed: true, listedCode: "INTC" },
    { name: "三星电子", ratio: 0.10, industry: "存储", financialHealth: "healthy", isListed: true, listedCode: "SMSN" },
  ],
  "电力": [
    { name: "中国神华", ratio: 0.15, industry: "煤炭", financialHealth: "healthy", isListed: true, listedCode: "601088" },
    { name: "国电电力", ratio: 0.08, industry: "电力运营", financialHealth: "healthy", isListed: true, listedCode: "600795" },
  ],
  "AI/算力": [
    { name: "英伟达 (NVIDIA)", ratio: 0.30, industry: "GPU", financialHealth: "healthy", isListed: true, listedCode: "NVDA" },
    { name: "AMD", ratio: 0.12, industry: "CPU/GPU", financialHealth: "healthy", isListed: true, listedCode: "AMD" },
  ],
  "新能源车/高端制造": [
    { name: "弗迪电池 (自供)", ratio: 0.45, industry: "动力电池", financialHealth: "healthy", isListed: false },
    { name: "比亚迪半导体 (自供)", ratio: 0.20, industry: "车规芯片", financialHealth: "healthy", isListed: false },
  ],
  "芯片设备": [
    { name: "应用材料 (AMAT)", ratio: 0.25, industry: "半导体设备", financialHealth: "healthy", isListed: true, listedCode: "AMAT" },
    { name: "中微公司", ratio: 0.12, industry: "刻蚀设备", financialHealth: "healthy", isListed: true, listedCode: "688012" },
  ],
  "机器人": [
    { name: "纳博特斯克 (日)", ratio: 0.20, industry: "减速器", financialHealth: "healthy", isListed: true, listedCode: "NAB" },
    { name: "哈默纳科 (日)", ratio: 0.15, industry: "减速器", financialHealth: "healthy", isListed: true, listedCode: "HMN" },
    { name: "绿的谐波", ratio: 0.10, industry: "减速器", financialHealth: "normal", isListed: true, listedCode: "688017" },
  ],
  "PCB/高端制造": [
    { name: "生益科技", ratio: 0.18, industry: "覆铜板", financialHealth: "healthy", isListed: true, listedCode: "600183" },
    { name: "建滔集团", ratio: 0.12, industry: "覆铜板", financialHealth: "normal", isListed: true, listedCode: "00148" },
  ],
};

// ========== 行业PE中位数参考 ==========

const INDUSTRY_MEDIAN_PE: Record<string, number> = {
  "芯片": 55, "芯片制造": 55, "芯片设备": 50, "芯片设计": 60,
  "AI": 45, "AI芯片": 80, "光模块": 40, "算力": 35,
  "储能": 25, "锂电池": 22, "电力": 18,
  "高端制造": 28, "机器人": 35, "PCB": 25,
};

function getIndustryPE(industry: string): number {
  for (const [key, val] of Object.entries(INDUSTRY_MEDIAN_PE)) {
    if (industry.includes(key)) return val;
  }
  return 30;
}

// ========== 评分引擎 ==========

export class ScoringEngine {
  static getRating(score: number): RatingLevel {
    if (score >= 85) return "高风险观察";
    if (score >= 70) return "高风险偏多";
    if (score >= 40) return "观察";
    if (score >= 20) return "积极观察";
    return "谨慎";
  }

  static getAction(score: number, buySignal: number): string {
    if (score >= 85) return "强烈卖出";
    if (score >= 70) return "减仓";
    if (score >= 40) return "持有观望";
    if (buySignal > 65) return "积极加仓";
    if (buySignal > 40) return "适合买入";
    return "持有观望";
  }

  static calculateFullScore(
    industry: string,
    price: number | null,
    pe: number | null,
    marketCap: number | null,
    changePercent: number | null = null,
    code?: string,
    // 新增参数
    prevMonthChange: number | null = null,  // 上月涨跌幅(动量)
    turnoverRate: number | null = null,     // 换手率(情绪)
    materialPriceImpact: number | null = null,  // 原材料成本压力影响 (-20 ~ +30)
  ): FullScore {
    // ===== 供应链因子（原有，权重降低） =====
    const suppliers = INDUSTRY_SUPPLIERS[industry] || this._getDefaultSuppliers(industry);
    const s1 = this._scoreConcentration(suppliers);
    const s2 = this._scoreSubstitutability(suppliers);
    const s3 = this._scoreFinancialHealth(suppliers);
    const s4 = this._scoreImportDependency(suppliers);
    const s5 = this._scoreBargainingPower(suppliers);
    const s6 = this._scoreCustomerConcentration(pe);

    // 个股特殊风险
    const specialRisk: Record<string, number> = {
      "688256": 38, "688041": 35, "688981": 32,
      "300308": 28, "300502": 25, "000988": 22,
      "688008": 20, "688037": 18, "002384": 16,
      "688627": 15, "002074": 14, "601727": 12,
      "603986": 12, "000977": 10, "603019": 8,
    };
    const codeRisk = (code && specialRisk[code]) || 0;

    // ===== 📈 新增因子7: 价格动量 =====
    // 当前涨跌幅 + 上月涨跌幅 综合判断
    const momentumScore = this._scoreMomentum(changePercent, prevMonthChange);

    // ===== 💰 新增因子8: 估值吸引力 =====
    const valuationScore = this._scoreValuation(pe, industry);

    // ===== 🌊 新增因子9: 市场情绪 =====
    const sentimentScore = this._scoreSentiment(changePercent, turnoverRate);

    // ===== 🛢️ 新增因子10: 原材料成本压力 =====
    const materialScore = this._scoreMaterialPressure(industry, materialPriceImpact || 0);

    // ===== 综合权重分配 =====
    const dims: ScoreDimension[] = [
      { name: "供应商集中度", score: s1, weight: 0.15, isSupplyChain: true },
      { name: "供应商可替代性", score: s2, weight: 0.12, isSupplyChain: true },
      { name: "供应商财务健康度", score: s3, weight: 0.08, isSupplyChain: true },
      { name: "原材料/进口依赖", score: s4, weight: 0.08, isSupplyChain: true },
      { name: "供应商议价能力", score: s5, weight: 0.08, isSupplyChain: true },
      { name: "下游客户集中度", score: s6, weight: 0.04, isSupplyChain: true },
      { name: "📈 价格动量", score: momentumScore, weight: 0.20, isSupplyChain: false },
      { name: "💰 估值吸引力", score: valuationScore, weight: 0.15, isSupplyChain: false },
      { name: "🌊 市场情绪", score: sentimentScore, weight: 0.08, isSupplyChain: false },
      { name: "🛢️ 原材料成本", score: materialScore, weight: 0.07, isSupplyChain: false },
    ];

    // 基础分（供应链）
    let baseScore =
      s1 * 0.15 + s2 * 0.12 + s3 * 0.08 + s4 * 0.08 + s5 * 0.08 + s6 * 0.04;

    // 叠加个股特殊风险
    baseScore += codeRisk * 0.15;

    // 叠加市场因子
    baseScore += momentumScore * 0.20 + valuationScore * 0.15 + sentimentScore * 0.08 + materialScore * 0.07;

    const overall = Math.round(Math.min(100, Math.max(0, baseScore)) * 10) / 10;
    const rating = this.getRating(overall);

    // 买入/卖出信号强度
    // 买入信号 = 动量好 + 估值低 + 情绪正常
    const buySignal = Math.round(
      (100 - momentumScore) * 0.35 + (100 - valuationScore) * 0.35 + sentimentScore * 0.30
    );
    // 卖出信号 = 动量差 + 估值高 + 情绪过热
    const sellSignal = Math.round(
      momentumScore * 0.35 + valuationScore * 0.35 + (100 - sentimentScore) * 0.30
    );

    return {
      overall,
      rating,
      dimensions: dims.map(d => ({ ...d })),
      action: this.getAction(overall, buySignal) as any,
      buySignal,
      sellSignal,
    };
  }

  // ===== 因子评分实现 =====

  /** 价格动量: 连续上涨→低分(安全), 暴跌→高分(危险) */
  private static _scoreMomentum(
    changePercent: number | null,
    prevMonthChange: number | null
  ): number {
    const cur = changePercent ?? 0;
    const prev = prevMonthChange ?? 0;
    const avg = (cur + prev) / 2;  // 两月平均

    // 连续上涨 > 5%/月 → 动量强劲 → 低分10(很好)
    if (avg > 5 && cur > 0 && prev > 0) return 10;
    // 温和上涨 → 低分30
    if (avg > 2) return 25;
    // 基本持平 → 中等50
    if (avg > -2) return 50;
    // 温和下跌 → 高分70(危险)
    if (avg > -5) return 65;
    // 暴跌 → 高分90(极其危险)
    return 85;
  }

  /** 估值吸引力: PE低于行业中位数→低分(便宜=安全) */
  private static _scoreValuation(pe: number | null, industry: string): number {
    if (pe === null || pe <= 0) return 50;  // 亏损股 = 中性
    const medianPE = getIndustryPE(industry);
    const ratio = pe / medianPE;

    // PE远低于行业 → 被低估 → 低分(安全)
    if (ratio < 0.5) return 10;
    if (ratio < 0.8) return 25;
    if (ratio < 1.2) return 45;  // 合理
    if (ratio < 2.0) return 65;  // 偏高
    return 85;  // 严重高估
  }

  /** 市场情绪: 换手率+波动率 → 过热→高分(危险) */
  private static _scoreSentiment(
    changePercent: number | null,
    turnoverRate: number | null
  ): number {
    const absChange = Math.abs(changePercent ?? 0);
    const turnover = turnoverRate ?? 0;

    // 高换手率(>5%) + 大幅波动 → 情绪过热 → 高风险
    if (turnover > 8 && absChange > 5) return 80;
    if (turnover > 5 && absChange > 3) return 65;
    if (turnover > 3 || absChange > 4) return 50;
    if (turnover > 1) return 35;
    return 20;  // 低换手+低波动 → 情绪稳定
  }

  /** 🛢️ 原材料成本压力: 涨价→高风险 降价→低风险 */
  private static _scoreMaterialPressure(industry: string, impact: number): number {
    if (impact === 0) return 50;  // 无数据=中性
    // impact范围-20~+30, 映射到0-100
    // -20 → 0(利好)  0 → 50(中性)  +30 → 100(利空)
    const score = 50 + impact * 1.67;
    return Math.round(Math.min(100, Math.max(0, score)));
  }

  // ===== 原有供应链因子（保持但权重降低） =====

  private static _getDefaultSuppliers(industry: string): SupplierInput[] {
    for (const key of Object.keys(INDUSTRY_SUPPLIERS)) {
      if (industry.includes(key) || key.includes(industry)) {
        return INDUSTRY_SUPPLIERS[key];
      }
    }
    return [
      { name: "供应商A", ratio: 0.30, industry: "通用零部件", financialHealth: "normal", isListed: false },
      { name: "供应商B", ratio: 0.20, industry: "通用零部件", financialHealth: "healthy", isListed: false },
      { name: "供应商C", ratio: 0.15, industry: "通用零部件", financialHealth: "normal", isListed: false },
    ];
  }

  static getSuppliersForIndustry(industry: string): SupplierInput[] {
    return INDUSTRY_SUPPLIERS[industry] || this._getDefaultSuppliers(industry);
  }

  private static _scoreConcentration(suppliers: SupplierInput[]): number {
    if (!suppliers.length) return 30;
    const ratios = suppliers.map(s => s.ratio).sort((a, b) => b - a);
    const cr1 = ratios[0] || 0;
    const cr5 = ratios.slice(0, 5).reduce((a, b) => a + b, 0);
    const cr1Score = Math.min(100, (cr1 / 0.3) * 60);
    const cr5Score = Math.min(100, (cr5 / 0.7) * 40);
    return Math.round((cr1Score + cr5Score) / 2);
  }

  private static _scoreSubstitutability(suppliers: SupplierInput[]): number {
    if (!suppliers.length) return 40;
    let score = 0;
    for (const s of suppliers) {
      const isForeign = /ASML|Lumentum|Coherent|TSMC|台积电|英伟达|NVIDIA|纳博特斯克|哈默纳科/i.test(s.name);
      if (isForeign) score += s.ratio * 90;
      else if (s.isListed) score += s.ratio * 40;
      else score += s.ratio * 70;
    }
    return Math.round(Math.min(100, score));
  }

  private static _scoreFinancialHealth(suppliers: SupplierInput[]): number {
    if (!suppliers.length) return 40;
    const healthMap: Record<string, number> = { healthy: 20, normal: 50, risky: 85 };
    let scoreSum = 0;
    let totalRatio = 0;
    for (const s of suppliers) {
      scoreSum += s.ratio * (healthMap[s.financialHealth || "normal"] || 50);
      totalRatio += s.ratio;
    }
    return totalRatio > 0 ? Math.round(Math.min(100, scoreSum / totalRatio)) : 50;
  }

  private static _scoreImportDependency(suppliers: SupplierInput[]): number {
    if (!suppliers.length) return 40;
    const foreignKeywords = ["ASML", "Lumentum", "Coherent", "TSMC", "台积电", "英伟达", "NVIDIA",
      "应用材料", "东京电子", "荷兰", "纳博特斯克", "哈默纳科"];
    let foreignRatio = 0;
    for (const s of suppliers) {
      if (foreignKeywords.some(kw => s.name.includes(kw))) {
        foreignRatio += s.ratio;
      }
    }
    return Math.round(Math.min(100, foreignRatio * 100 + 20));
  }

  private static _scoreBargainingPower(suppliers: SupplierInput[]): number {
    if (!suppliers.length) return 50;
    const maxRatio = Math.max(...suppliers.map(s => s.ratio));
    if (maxRatio > 0.4) return 80;
    if (maxRatio > 0.25) return 60;
    if (maxRatio > 0.15) return 40;
    return 25;
  }

  private static _scoreCustomerConcentration(pe: number | null): number {
    if (pe === null || pe <= 0) return 50;
    if (pe > 100) return 30;
    if (pe > 50) return 40;
    if (pe > 25) return 50;
    if (pe > 10) return 60;
    return 70;
  }
}
