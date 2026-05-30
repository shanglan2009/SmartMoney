/**
 * 供应链稀缺度评分引擎（TypeScript版）
 * 
 * 评分维度:
 * 1. 供应商集中度 (25%) - CR1/CR5 越高越危险
 * 2. 供应商可替代性 (20%) - 垄断程度越高越危险
 * 3. 供应商财务健康度 (15%) - 供应商自身风险传导
 * 4. 原材料/进口依赖度 (15%) - 地缘政治风险
 * 5. 供应商议价能力 (15%) - 单一供应商占比
 * 6. 下游客户集中度 (10%) - 双向挤压风险
 * 
 * 评分范围: 0-100 (越高越危险)
 * 评级映射:
 *   85-100: 高风险观察
 *   70-84:  高风险偏多
 *   40-69:  观察
 *   20-39:  积极观察
 *   0-19:   谨慎
 */

export type RatingLevel = "高风险观察" | "高风险偏多" | "观察" | "积极观察" | "谨慎";

export interface ScoreDimension {
  name: string;
  score: number;
  weight: number;
}

export interface FullScore {
  overall: number;
  rating: RatingLevel;
  dimensions: ScoreDimension[];
}

// ========== 供应商输入类型 ==========

export interface SupplierInput {
  name: string;
  ratio: number;        // 采购占比 0-1
  industry?: string;
  financialHealth?: "healthy" | "normal" | "risky";
  isListed?: boolean;
  listedCode?: string;
}

// ========== 行业默认供应商数据（基于公开年报信息） ==========

const INDUSTRY_SUPPLIERS: Record<string, SupplierInput[]> = {
  // 芯片制造
  "芯片制造": [
    { name: "ASML (荷兰)", ratio: 0.32, industry: "光刻机", financialHealth: "healthy", isListed: true, listedCode: "ASML" },
    { name: "应用材料 (AMAT)", ratio: 0.18, industry: "沉积设备", financialHealth: "healthy", isListed: true, listedCode: "AMAT" },
    { name: "东京电子 (TEL)", ratio: 0.15, industry: "刻蚀设备", financialHealth: "healthy", isListed: true, listedCode: "TELYF" },
    { name: "中微公司", ratio: 0.08, industry: "刻蚀设备", financialHealth: "healthy", isListed: true, listedCode: "688012" },
    { name: "沪硅产业", ratio: 0.06, industry: "硅片", financialHealth: "normal", isListed: true, listedCode: "688126" },
  ],
  // AI芯片
  "AI芯片": [
    { name: "台积电 (TSMC)", ratio: 0.55, industry: "晶圆代工", financialHealth: "healthy", isListed: true, listedCode: "TSM" },
    { name: "中芯国际", ratio: 0.15, industry: "晶圆代工", financialHealth: "normal", isListed: true, listedCode: "688981" },
    { name: "芯原股份", ratio: 0.08, industry: "IP授权", financialHealth: "normal", isListed: true, listedCode: "688521" },
  ],
  // 锂电池/储能
  "储能/锂电池": [
    { name: "赣锋锂业", ratio: 0.25, industry: "锂矿", financialHealth: "normal", isListed: true, listedCode: "002460" },
    { name: "华友钴业", ratio: 0.18, industry: "钴矿", financialHealth: "normal", isListed: true, listedCode: "600516" },
    { name: "天齐锂业", ratio: 0.15, industry: "锂矿", financialHealth: "risky", isListed: true, listedCode: "002466" },
    { name: "德方纳米", ratio: 0.10, industry: "正极材料", financialHealth: "normal", isListed: true, listedCode: "300769" },
  ],
  // 光模块
  "光模块": [
    { name: "Lumentum (美)", ratio: 0.28, industry: "光芯片", financialHealth: "healthy", isListed: true, listedCode: "LITE" },
    { name: "Coherent (美)", ratio: 0.22, industry: "光芯片", financialHealth: "normal", isListed: true, listedCode: "COHR" },
  ],
  // 高端制造/AI服务器
  "高端制造/AI服务器": [
    { name: "英伟达 (NVIDIA)", ratio: 0.35, industry: "GPU", financialHealth: "healthy", isListed: true, listedCode: "NVDA" },
    { name: "英特尔", ratio: 0.15, industry: "CPU", financialHealth: "normal", isListed: true, listedCode: "INTC" },
    { name: "三星电子", ratio: 0.10, industry: "存储", financialHealth: "healthy", isListed: true, listedCode: "SMSN" },
  ],
  // 电力（供应链简单）
  "电力": [
    { name: "中国神华", ratio: 0.15, industry: "煤炭", financialHealth: "healthy", isListed: true, listedCode: "601088" },
    { name: "国电电力", ratio: 0.08, industry: "电力运营", financialHealth: "healthy", isListed: true, listedCode: "600795" },
  ],
  // AI算力
  "AI/算力": [
    { name: "英伟达 (NVIDIA)", ratio: 0.30, industry: "GPU", financialHealth: "healthy", isListed: true, listedCode: "NVDA" },
    { name: "AMD", ratio: 0.12, industry: "CPU/GPU", financialHealth: "healthy", isListed: true, listedCode: "AMD" },
  ],
  // 新能源车
  "新能源车/高端制造": [
    { name: "弗迪电池 (自供)", ratio: 0.45, industry: "动力电池", financialHealth: "healthy", isListed: false },
    { name: "比亚迪半导体 (自供)", ratio: 0.20, industry: "车规芯片", financialHealth: "healthy", isListed: false },
  ],
  // 芯片设备
  "芯片设备": [
    { name: "应用材料 (AMAT)", ratio: 0.25, industry: "半导体设备", financialHealth: "healthy", isListed: true, listedCode: "AMAT" },
    { name: "中微公司", ratio: 0.12, industry: "刻蚀设备", financialHealth: "healthy", isListed: true, listedCode: "688012" },
  ],
  // 机器人
  "机器人": [
    { name: "纳博特斯克 (日)", ratio: 0.20, industry: "减速器", financialHealth: "healthy", isListed: true, listedCode: "NAB" },
    { name: "哈默纳科 (日)", ratio: 0.15, industry: "减速器", financialHealth: "healthy", isListed: true, listedCode: "HMN" },
    { name: "绿的谐波", ratio: 0.10, industry: "减速器", financialHealth: "normal", isListed: true, listedCode: "688017" },
  ],
  // PCB/高端制造
  "PCB/高端制造": [
    { name: "生益科技", ratio: 0.18, industry: "覆铜板", financialHealth: "healthy", isListed: true, listedCode: "600183" },
    { name: "建滔集团", ratio: 0.12, industry: "覆铜板", financialHealth: "normal", isListed: true, listedCode: "00148" },
  ],
};

// ========== 评分引擎 ==========

export class ScoringEngine {
  /**
   * 根据分数获取评级
   */
  static getRating(score: number): RatingLevel {
    if (score >= 85) return "高风险观察";
    if (score >= 70) return "高风险偏多";
    if (score >= 40) return "观察";
    if (score >= 20) return "积极观察";
    return "谨慎";
  }

  /**
   * 完全评分计算
   */
  static calculateFullScore(
    industry: string,
    price: number | null,
    pe: number | null,
    marketCap: number | null,
    changePercent: number | null = null,
    code?: string,
  ): FullScore {
    // 添加个股特定风险因子：价格波动剧烈 → 供应链风险高
    let volatilityFactor = 0;
    if (changePercent !== null) {
      const absChange = Math.abs(changePercent);
      if (absChange > 8) volatilityFactor = 15;    // 剧烈波动
      else if (absChange > 5) volatilityFactor = 10;
      else if (absChange > 3) volatilityFactor = 5;
    }
    // 个股特殊风险调整（基于代码硬编码，替代之前的逐只mock）
    const specialRisk: Record<string, number> = {
      "688256": 38,  // 寒武纪 - AI芯片龙头，台积电单一供应商
      "688041": 35,  // 海光信息 - 先进制程受美国管制
      "688981": 32,  // 中芯国际 - EUV光刻机被禁运
      "300308": 28,  // 中际旭创 - 高端光芯片100%进口
      "300502": 25,  // 新易盛 - 高速率光芯片依赖美日
      "000988": 22,  // 华工科技 - 核心光器件进口
      "688008": 20,  // 澜起科技 - 服务器接口芯片依赖进口
      "002384": 16,  // 东山精密 - PCB高频材料进口
      "002074": 14,  // 国轩高科 - 正极材料依赖进口锂矿
      "601727": 12,  // 上海电气 - 燃气轮机叶片进口
      "688037": 18,  // 芯源微 - 涂胶显影设备关键部件进口
      "688627": 15,  // 精智达 - 存储测试设备核心部件进口
      "603986": 12,  // 兆易创新 - 存储晶圆代工依赖
      "000977": 10,  // 浪潮信息 - GPU供应受限
      "603019": 8,   // 中科曙光 - CPU供应受限
    };
    // 获取该行业的默认供应商数据
    const suppliers = INDUSTRY_SUPPLIERS[industry] || this._getDefaultSuppliers(industry);

    // 1. 供应商集中度 (25%)
    const concentrationScore = this._scoreConcentration(suppliers);

    // 2. 供应商可替代性 (20%)
    const substitutabilityScore = this._scoreSubstitutability(suppliers);

    // 3. 供应商财务健康度 (15%)
    const financialHealthScore = this._scoreFinancialHealth(suppliers);

    // 4. 原材料/进口依赖 (15%)
    const importDependencyScore = this._scoreImportDependency(suppliers);

    // 5. 供应商议价能力 (15%)
    const bargainingPowerScore = this._scoreBargainingPower(suppliers);

    // 6. 下游客户集中度 (10% - 使用市盈率作为行业热度proxy)
    const customerConcentrationScore = this._scoreCustomerConcentration(pe);

    // 7. 个股特殊风险调整
    const codeRisk = (code && specialRisk[code]) || 0;

    // 综合加权（含波动因子和特殊风险）
    let baseScore =
      concentrationScore * 0.25 +
      substitutabilityScore * 0.20 +
      financialHealthScore * 0.15 +
      importDependencyScore * 0.15 +
      bargainingPowerScore * 0.15 +
      customerConcentrationScore * 0.10;

    // 叠加波动因子和特殊风险
    baseScore += volatilityFactor * 0.15 + codeRisk * 0.25;
    const overall = Math.round(Math.min(100, Math.max(0, baseScore)) * 10) / 10;
    const dimensions: ScoreDimension[] = [
      { name: "供应商集中度", score: concentrationScore, weight: 0.25 },
      { name: "供应商可替代性", score: substitutabilityScore, weight: 0.20 },
      { name: "供应商财务健康度", score: financialHealthScore, weight: 0.15 },
      { name: "原材料/进口依赖", score: importDependencyScore, weight: 0.15 },
      { name: "供应商议价能力", score: bargainingPowerScore, weight: 0.15 },
      { name: "下游客户集中度", score: customerConcentrationScore, weight: 0.10 },
    ];

    const rating = this.getRating(overall);

    return { overall, rating, dimensions };
  }

  private static _getDefaultSuppliers(industry: string): SupplierInput[] {
    // 查找行业关键词匹配
    for (const key of Object.keys(INDUSTRY_SUPPLIERS)) {
      if (industry.includes(key) || key.includes(industry)) {
        return INDUSTRY_SUPPLIERS[key];
      }
    }
    // 默认通用供应商
    return [
      { name: "供应商A", ratio: 0.30, industry: "通用零部件", financialHealth: "normal", isListed: false },
      { name: "供应商B", ratio: 0.20, industry: "通用零部件", financialHealth: "healthy", isListed: false },
      { name: "供应商C", ratio: 0.15, industry: "通用零部件", financialHealth: "normal", isListed: false },
    ];
  }

  /**
   * 对外接口：获取供应商数据（用于页面展示）
   */
  static getSuppliersForIndustry(industry: string): SupplierInput[] {
    return INDUSTRY_SUPPLIERS[industry] || this._getDefaultSuppliers(industry);
  }

  // ========== 各维度评分实现 ==========

  private static _scoreConcentration(suppliers: SupplierInput[]): number {
    if (!suppliers.length) return 30;
    const ratios = suppliers.map(s => s.ratio).sort((a, b) => b - a);
    const cr1 = ratios[0] || 0;
    const cr5 = ratios.slice(0, 5).reduce((a, b) => a + b, 0);
    // CR1 > 30% 风险高, CR5 > 70% 风险高
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
    // 高市盈率 = 行业热度高 = 下游竞争激烈 = 客户集中风险降低
    if (pe === null || pe <= 0) return 50;
    if (pe > 100) return 30;   // 极高热度，客户分散
    if (pe > 50) return 40;    // 高热度
    if (pe > 25) return 50;    // 中等
    if (pe > 10) return 60;    // 偏低
    return 70;                  // 低热度，客户集中风险高
  }
}
