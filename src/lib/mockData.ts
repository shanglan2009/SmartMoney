import type {
  Company,
  SupplyChainScore,
  Supplier,
  SupplyGraph,
  RiskEvent,
  StockAnalysisResponse,
  RatingLevel,
  ScoreDimension,
  StockListItem,
} from "./types";

// ========== 重点覆盖行业列表（AI/电力/存储/储能/芯片/机器人/算力/高端制造） ==========

export const stockList: StockListItem[] = [
  // ─── 芯片/半导体 ───
  { code: "688981", name: "中芯国际", industry: "芯片制造", score: 82, rating: "高风险偏多", priceChange: "+12.3%", signal: "供应链紧张，国产替代加速", lastUpdated: "2026-05-25 14:30" },
  { code: "002371", name: "北方华创", industry: "芯片设备", score: 65, rating: "观察", priceChange: "+8.5%", signal: "设备供应链稳定，国产化率提升", lastUpdated: "2026-05-25 14:30" },
  { code: "688041", name: "海光信息", industry: "芯片设计", score: 88, rating: "高风险观察", priceChange: "+15.2%", signal: "先进制程产能受限，单一供应商依赖", lastUpdated: "2026-05-25 14:28" },
  { code: "688256", name: "寒武纪", industry: "AI芯片", score: 91, rating: "高风险观察", priceChange: "+22.1%", signal: "算力芯片需求暴增，供应严重不足", lastUpdated: "2026-05-25 14:25" },
  { code: "300661", name: "圣邦股份", industry: "模拟芯片", score: 45, rating: "积极观察", priceChange: "-2.1%", signal: "多元供应商体系，替代选择充足", lastUpdated: "2026-05-25 14:20" },
  { code: "603986", name: "兆易创新", industry: "存储芯片", score: 62, rating: "观察", priceChange: "+5.3%", signal: "NOR Flash供需平衡，国产替代推进", lastUpdated: "2026-05-25 14:22" },
  // ─── AI/算力 ───
  { code: "300308", name: "中际旭创", industry: "光模块/算力", score: 78, rating: "高风险偏多", priceChange: "+35.6%", signal: "AI算力需求爆发，上游光芯片供应紧张", lastUpdated: "2026-05-25 14:30" },
  { code: "300502", name: "新易盛", industry: "光模块", score: 72, rating: "高风险偏多", priceChange: "+28.4%", signal: "高速率光芯片依赖进口", lastUpdated: "2026-05-25 14:28" },
  { code: "000977", name: "浪潮信息", industry: "AI服务器/算力", score: 68, rating: "高风险偏多", priceChange: "+18.5%", signal: "GPU供应受限但需求旺盛", lastUpdated: "2026-05-25 14:26" },
  { code: "603019", name: "中科曙光", industry: "算力/超算", score: 60, rating: "观察", priceChange: "+9.2%", signal: "国产算力芯片替代方案在推进", lastUpdated: "2026-05-25 14:25" },
  { code: "002230", name: "科大讯飞", industry: "AI应用", score: 35, rating: "积极观察", priceChange: "+5.8%", signal: "供应链健康，算力资源有保障", lastUpdated: "2026-05-25 14:26" },
  // ─── 储能/锂电池 ───
  { code: "300750", name: "宁德时代", industry: "储能/锂电池", score: 58, rating: "观察", priceChange: "+3.2%", signal: "锂矿价格波动，供应商多元化布局", lastUpdated: "2026-05-25 14:30" },
  { code: "300274", name: "阳光电源", industry: "储能/逆变器", score: 48, rating: "观察", priceChange: "+6.7%", signal: "IGBT供应改善，元器件替代方案成熟", lastUpdated: "2026-05-25 14:29" },
  { code: "002074", name: "国轩高科", industry: "储能/锂电池", score: 63, rating: "观察", priceChange: "-1.5%", signal: "正极材料依赖单一供应商", lastUpdated: "2026-05-25 14:25" },
  // ─── 电力 ───
  { code: "600900", name: "长江电力", industry: "电力", score: 18, rating: "谨慎", priceChange: "+2.1%", signal: "供应链极简，无重大上游依赖", lastUpdated: "2026-05-25 14:20" },
  { code: "601985", name: "中国核电", industry: "电力/核电", score: 35, rating: "积极观察", priceChange: "+4.2%", signal: "核燃料供应链稳定，国产化率高", lastUpdated: "2026-05-25 14:22" },
  { code: "600406", name: "国电南瑞", industry: "电力设备/智能电网", score: 42, rating: "积极观察", priceChange: "+3.8%", signal: "电力IT供应链自主可控", lastUpdated: "2026-05-25 14:24" },
  // ─── 高端制造/机器人 ───
  { code: "002594", name: "比亚迪", industry: "新能源车/高端制造", score: 42, rating: "积极观察", priceChange: "+2.8%", signal: "垂直整合供应链，核心部件自供", lastUpdated: "2026-05-25 14:30" },
  { code: "300124", name: "汇川技术", industry: "机器人/工控", score: 52, rating: "观察", priceChange: "+4.5%", signal: "核心芯片供应有替代方案", lastUpdated: "2026-05-25 14:28" },
  { code: "688169", name: "石头科技", industry: "机器人/扫地机", score: 28, rating: "谨慎", priceChange: "+1.2%", signal: "供应链管理优秀，供应商竞争充分", lastUpdated: "2026-05-25 14:26" },
  { code: "601727", name: "上海电气", industry: "高端制造/电力设备", score: 60, rating: "观察", priceChange: "+1.8%", signal: "关键零部件进口依赖度高", lastUpdated: "2026-05-25 14:24" },
  { code: "601138", name: "工业富联", industry: "高端制造/AI服务器", score: 55, rating: "观察", priceChange: "+10.3%", signal: "AI服务器需求旺盛，GPU供应受限", lastUpdated: "2026-05-25 14:27" },
];

// ========== 详细评分数据 ==========

function generateScore(code: string): SupplyChainScore {
  const base: Record<string, { overall: number; dims: number[] }> = {
    "688981": { overall: 82, dims: [90, 85, 75, 88, 70, 75] },
    "002371": { overall: 65, dims: [70, 55, 60, 50, 65, 55] },
    "688041": { overall: 88, dims: [92, 85, 80, 90, 78, 82] },
    "688256": { overall: 91, dims: [95, 88, 85, 92, 82, 88] },
    "300661": { overall: 45, dims: [30, 40, 50, 35, 55, 45] },
    "603986": { overall: 62, dims: [55, 60, 50, 45, 65, 55] },
    "300308": { overall: 78, dims: [85, 75, 70, 80, 72, 68] },
    "300502": { overall: 72, dims: [78, 70, 68, 75, 65, 60] },
    "000977": { overall: 68, dims: [72, 65, 55, 60, 62, 58] },
    "603019": { overall: 60, dims: [62, 58, 50, 55, 60, 52] },
    "002230": { overall: 35, dims: [30, 32, 40, 28, 42, 35] },
    "300750": { overall: 58, dims: [65, 55, 50, 60, 55, 52] },
    "300274": { overall: 48, dims: [50, 45, 55, 42, 52, 48] },
    "002074": { overall: 63, dims: [70, 60, 58, 65, 55, 60] },
    "600900": { overall: 18, dims: [10, 15, 20, 12, 22, 18] },
    "601985": { overall: 35, dims: [30, 32, 38, 28, 40, 35] },
    "600406": { overall: 42, dims: [38, 40, 45, 35, 48, 42] },
    "002594": { overall: 42, dims: [35, 45, 38, 40, 48, 42] },
    "300124": { overall: 52, dims: [55, 48, 50, 45, 55, 50] },
    "688169": { overall: 28, dims: [20, 25, 35, 22, 32, 30] },
    "601727": { overall: 60, dims: [65, 55, 58, 62, 55, 58] },
    "601138": { overall: 55, dims: [60, 50, 55, 45, 58, 48] },
  };

  const data = base[code] || { overall: 50, dims: [50, 50, 50, 50, 50, 50] };

  const dimNames: { name: string; weight: number }[] = [
    { name: "供应商集中度", weight: 0.25 },
    { name: "供应商可替代性", weight: 0.20 },
    { name: "供应商财务健康度", weight: 0.15 },
    { name: "原材料/进口依赖", weight: 0.15 },
    { name: "供应商议价能力", weight: 0.15 },
    { name: "下游客户集中度", weight: 0.10 },
  ];

  const dimensions: ScoreDimension[] = dimNames.map((d, i) => ({
    name: d.name,
    score: data.dims[i] || 50,
    weight: d.weight,
  }));

  const ov = data.overall;
  let rating: RatingLevel;
  if (ov >= 85) rating = "高风险观察";
  else if (ov >= 70) rating = "高风险偏多";
  else if (ov >= 40) rating = "观察";
  else if (ov >= 20) rating = "积极观察";
  else rating = "谨慎";

  return { overall: ov, dimensions, rating };
}

// ========== 供应商数据 ==========

const supplierData: Record<string, Supplier[]> = {
  "688981": [
    { id: "s1", name: "ASML (荷兰)", ratio: 0.32, industry: "光刻机", financialHealth: "healthy", isListed: true, listedCode: "ASML", contractAmount: 35.6 },
    { id: "s2", name: "应用材料 (AMAT)", ratio: 0.18, industry: "半导体设备", financialHealth: "healthy", isListed: true, listedCode: "AMAT", contractAmount: 22.1 },
    { id: "s3", name: "东京电子 (TEL)", ratio: 0.15, industry: "半导体设备", financialHealth: "healthy", isListed: true, listedCode: "TELYF", contractAmount: 18.3 },
    { id: "s4", name: "中微半导体", ratio: 0.08, industry: "刻蚀设备", financialHealth: "healthy", isListed: true, listedCode: "688012" },
    { id: "s5", name: "沪硅产业", ratio: 0.06, industry: "硅片", financialHealth: "normal", isListed: true, listedCode: "688126" },
  ],
  "300750": [
    { id: "s1", name: "赣锋锂业", ratio: 0.25, industry: "锂矿", financialHealth: "normal", isListed: true, listedCode: "002460" },
    { id: "s2", name: "华友钴业", ratio: 0.18, industry: "钴矿", financialHealth: "normal", isListed: true, listedCode: "600516" },
    { id: "s3", name: "天齐锂业", ratio: 0.15, industry: "锂矿", financialHealth: "risky", isListed: true, listedCode: "002466" },
    { id: "s4", name: "德方纳米", ratio: 0.10, industry: "正极材料", financialHealth: "normal", isListed: true, listedCode: "300769" },
    { id: "s5", name: "恩捷股份", ratio: 0.08, industry: "隔膜", financialHealth: "normal", isListed: true, listedCode: "002812" },
  ],
  "002594": [
    { id: "s1", name: "弗迪电池 (自供)", ratio: 0.45, industry: "动力电池", financialHealth: "healthy", isListed: false },
    { id: "s2", name: "比亚迪半导体 (自供)", ratio: 0.20, industry: "车规芯片", financialHealth: "healthy", isListed: false },
    { id: "s3", name: "福耀玻璃", ratio: 0.05, industry: "汽车玻璃", financialHealth: "healthy", isListed: true, listedCode: "600660" },
    { id: "s4", name: "华域汽车", ratio: 0.04, industry: "汽车零部件", financialHealth: "healthy", isListed: true, listedCode: "600741" },
  ],
  "300308": [
    { id: "s1", name: "Lumentum (美)", ratio: 0.28, industry: "光芯片", financialHealth: "healthy", isListed: true, listedCode: "LITE" },
    { id: "s2", name: "Coherent (美)", ratio: 0.22, industry: "光芯片", financialHealth: "normal", isListed: true, listedCode: "COHR" },
    { id: "s3", name: "旭创自研芯片", ratio: 0.15, industry: "DSP芯片", financialHealth: "healthy", isListed: false },
    { id: "s4", name: "中际精密制造", ratio: 0.10, industry: "精密制造", financialHealth: "normal", isListed: false },
  ],
  "688256": [
    { id: "s1", name: "台积电 (TSMC)", ratio: 0.55, industry: "晶圆代工", financialHealth: "healthy", isListed: true, listedCode: "TSM" },
    { id: "s2", name: "中芯国际", ratio: 0.15, industry: "晶圆代工", financialHealth: "normal", isListed: true, listedCode: "688981" },
    { id: "s3", name: "芯原股份", ratio: 0.08, industry: "IP授权", financialHealth: "normal", isListed: true, listedCode: "688521" },
    { id: "s4", name: "长电科技", ratio: 0.06, industry: "封装测试", financialHealth: "healthy", isListed: true, listedCode: "600584" },
  ],
};

const defaultSuppliers: Supplier[] = [
  { id: "s1", name: "供应商A", ratio: 0.30, industry: "通用零部件", financialHealth: "normal", isListed: false },
  { id: "s2", name: "供应商B", ratio: 0.20, industry: "通用零部件", financialHealth: "healthy", isListed: false },
  { id: "s3", name: "供应商C", ratio: 0.15, industry: "通用零部件", financialHealth: "normal", isListed: false },
  { id: "s4", name: "供应商D", ratio: 0.08, industry: "通用零部件", financialHealth: "normal", isListed: false },
];

// ========== 公司信息 ==========

const companyInfo: Record<string, Company> = {
  "688981": { code: "688981", name: "中芯国际", industry: "芯片制造", market: "SH", revenue: 523.4, revenueYoy: 0.15, grossMargin: 0.32, rdExpense: 68.2 },
  "300750": { code: "300750", name: "宁德时代", industry: "储能/锂电池", market: "SZ", revenue: 1568.2, revenueYoy: 0.22, grossMargin: 0.26, rdExpense: 85.4 },
  "002594": { code: "002594", name: "比亚迪", industry: "新能源车/高端制造", market: "SZ", revenue: 2856.8, revenueYoy: 0.35, grossMargin: 0.18, rdExpense: 186.5 },
  "300308": { code: "300308", name: "中际旭创", industry: "光模块/算力", market: "SZ", revenue: 182.5, revenueYoy: 0.68, grossMargin: 0.38, rdExpense: 22.3 },
  "688256": { code: "688256", name: "寒武纪", industry: "AI芯片", market: "SH", revenue: 42.6, revenueYoy: 0.85, grossMargin: 0.62, rdExpense: 28.5 },
  "002371": { code: "002371", name: "北方华创", industry: "芯片设备", market: "SZ", revenue: 156.8, revenueYoy: 0.42, grossMargin: 0.40, rdExpense: 18.6 },
  "688041": { code: "688041", name: "海光信息", industry: "芯片设计", market: "SH", revenue: 85.2, revenueYoy: 0.55, grossMargin: 0.58, rdExpense: 22.8 },
  "300502": { code: "300502", name: "新易盛", industry: "光模块", market: "SZ", revenue: 68.4, revenueYoy: 0.52, grossMargin: 0.42, rdExpense: 8.5 },
  "000977": { code: "000977", name: "浪潮信息", industry: "AI服务器/算力", market: "SZ", revenue: 685.2, revenueYoy: 0.28, grossMargin: 0.12, rdExpense: 32.5 },
  "603019": { code: "603019", name: "中科曙光", industry: "算力/超算", market: "SH", revenue: 168.5, revenueYoy: 0.22, grossMargin: 0.25, rdExpense: 15.8 },
  "601138": { code: "601138", name: "工业富联", industry: "高端制造/AI服务器", market: "SH", revenue: 3286.5, revenueYoy: 0.18, grossMargin: 0.12, rdExpense: 42.8 },
  "002230": { code: "002230", name: "科大讯飞", industry: "AI应用", market: "SZ", revenue: 185.6, revenueYoy: 0.28, grossMargin: 0.45, rdExpense: 38.2 },
  "300274": { code: "300274", name: "阳光电源", industry: "储能/逆变器", market: "SZ", revenue: 425.8, revenueYoy: 0.32, grossMargin: 0.28, rdExpense: 18.5 },
  "002074": { code: "002074", name: "国轩高科", industry: "储能/锂电池", market: "SZ", revenue: 185.6, revenueYoy: 0.18, grossMargin: 0.18, rdExpense: 12.8 },
  "600900": { code: "600900", name: "长江电力", industry: "电力", market: "SH", revenue: 645.8, revenueYoy: 0.12, grossMargin: 0.62, rdExpense: 3.5 },
  "601985": { code: "601985", name: "中国核电", industry: "电力/核电", market: "SH", revenue: 485.6, revenueYoy: 0.15, grossMargin: 0.42, rdExpense: 18.5 },
  "600406": { code: "600406", name: "国电南瑞", industry: "电力设备/智能电网", market: "SH", revenue: 385.2, revenueYoy: 0.18, grossMargin: 0.32, rdExpense: 28.5 },
  "603986": { code: "603986", name: "兆易创新", industry: "存储芯片", market: "SH", revenue: 68.5, revenueYoy: 0.15, grossMargin: 0.42, rdExpense: 12.5 },
  "300124": { code: "300124", name: "汇川技术", industry: "机器人/工控", market: "SZ", revenue: 245.8, revenueYoy: 0.32, grossMargin: 0.38, rdExpense: 22.5 },
  "688169": { code: "688169", name: "石头科技", industry: "机器人/扫地机", market: "SH", revenue: 86.5, revenueYoy: 0.25, grossMargin: 0.48, rdExpense: 6.8 },
  "601727": { code: "601727", name: "上海电气", industry: "高端制造/电力设备", market: "SH", revenue: 1125.6, revenueYoy: 0.08, grossMargin: 0.15, rdExpense: 32.5 },
  "300661": { code: "300661", name: "圣邦股份", industry: "模拟芯片", market: "SZ", revenue: 28.5, revenueYoy: 0.22, grossMargin: 0.52, rdExpense: 4.8 },
};

// ========== 风险事件 ==========

const riskEvents: Record<string, RiskEvent[]> = {
  "688981": [
    { date: "2026-05-20", type: "原材料涨价", title: "硅片价格季度上涨8%", impact: "medium" },
    { date: "2026-05-10", type: "进口受限", title: "荷兰扩大DUV光刻机出口管制", impact: "high" },
    { date: "2026-04-28", type: "产能不足", title: "28nm产能利用率达98%", impact: "medium" },
  ],
  "300750": [
    { date: "2026-05-22", type: "原材料涨价", title: "碳酸锂价格反弹15%", impact: "medium" },
    { date: "2026-05-15", type: "供应商暴雷", title: "某负极材料供应商产能异常", impact: "low" },
  ],
  "688256": [
    { date: "2026-05-18", type: "产能不足", title: "台积电7nm产能分配紧张", impact: "high" },
    { date: "2026-05-08", type: "进口受限", title: "高端AI芯片出口管制加严", impact: "high" },
  ],
  "300308": [
    { date: "2026-05-21", type: "原材料涨价", title: "EML光芯片供应短缺加剧", impact: "high" },
    { date: "2026-05-12", type: "合同丢失", title: "某北美云厂商订单延迟", impact: "medium" },
  ],
};

// ========== 图数据 ==========

const graphData: Record<string, SupplyGraph> = {
  "688981": {
    nodes: [
      { id: "688981", name: "中芯国际", type: "company" },
      { id: "amsl", name: "ASML", type: "supplier", group: 1 },
      { id: "amat", name: "应用材料", type: "supplier", group: 1 },
      { id: "tel", name: "东京电子", type: "supplier", group: 1 },
      { id: "688012", name: "中微公司", type: "supplier", group: 2 },
      { id: "688126", name: "沪硅产业", type: "supplier", group: 2 },
      { id: "chip_industry", name: "芯片制造", type: "industry" },
    ],
    edges: [
      { source: "amsl", target: "688981", type: "supplies_to", amount: 35.6, label: "光刻机" },
      { source: "amat", target: "688981", type: "supplies_to", amount: 22.1, label: "沉积设备" },
      { source: "tel", target: "688981", type: "supplies_to", amount: 18.3, label: "刻蚀设备" },
      { source: "688012", target: "688981", type: "supplies_to", amount: 8.5, label: "刻蚀设备" },
      { source: "688126", target: "688981", type: "supplies_to", amount: 6.2, label: "硅片" },
      { source: "688981", target: "chip_industry", type: "supplies_to", label: "所属行业" },
    ],
  },
  "300750": {
    nodes: [
      { id: "300750", name: "宁德时代", type: "company" },
      { id: "002460", name: "赣锋锂业", type: "supplier", group: 1 },
      { id: "600516", name: "华友钴业", type: "supplier", group: 1 },
      { id: "002466", name: "天齐锂业", type: "supplier", group: 1 },
      { id: "300769", name: "德方纳米", type: "supplier", group: 2 },
      { id: "002812", name: "恩捷股份", type: "supplier", group: 2 },
      { id: "battery_industry", name: "锂电池", type: "industry" },
    ],
    edges: [
      { source: "002460", target: "300750", type: "supplies_to", amount: 45.2, label: "碳酸锂" },
      { source: "600516", target: "300750", type: "supplies_to", amount: 32.8, label: "钴" },
      { source: "002466", target: "300750", type: "supplies_to", amount: 28.5, label: "碳酸锂" },
      { source: "300769", target: "300750", type: "supplies_to", amount: 18.5, label: "正极材料" },
      { source: "002812", target: "300750", type: "supplies_to", amount: 12.6, label: "隔膜" },
      { source: "300750", target: "battery_industry", type: "supplies_to", label: "所属行业" },
    ],
  },
};

// ========== 评级历史 ==========

const ratingHistory: Record<string, { date: string; rating: RatingLevel }[]> = {
  "688981": [
    { date: "2026-05", rating: "高风险偏多" },
    { date: "2026-04", rating: "高风险观察" },
    { date: "2026-03", rating: "高风险偏多" },
    { date: "2026-02", rating: "观察" },
    { date: "2026-01", rating: "谨慎" },
  ],
  "300750": [
    { date: "2026-05", rating: "观察" },
    { date: "2026-04", rating: "积极观察" },
    { date: "2026-03", rating: "积极观察" },
    { date: "2026-02", rating: "观察" },
    { date: "2026-01", rating: "观察" },
  ],
  "688256": [
    { date: "2026-05", rating: "高风险观察" },
    { date: "2026-04", rating: "高风险观察" },
    { date: "2026-03", rating: "高风险偏多" },
    { date: "2026-02", rating: "高风险偏多" },
    { date: "2026-01", rating: "观察" },
  ],
};

const defaultHistory: { date: string; rating: RatingLevel }[] = [
  { date: "2026-05", rating: "观察" },
  { date: "2026-04", rating: "观察" },
  { date: "2026-03", rating: "积极观察" },
  { date: "2026-02", rating: "积极观察" },
  { date: "2026-01", rating: "谨慎" },
];

// ========== 主API函数 ==========

export function getStockList(): StockListItem[] {
  return stockList;
}

export function getStockAnalysis(code: string): StockAnalysisResponse | null {
  const company = companyInfo[code];
  if (!company) return null;

  const score = generateScore(code);
  const suppliers = supplierData[code] || defaultSuppliers;
  const graph = graphData[code] || {
    nodes: [
      { id: code, name: company.name, type: "company" },
      ...suppliers.map((s, i) => ({ id: s.id, name: s.name, type: "supplier" as const, group: i % 3 })),
    ],
    edges: suppliers.map((s) => ({
      source: s.id,
      target: code,
      type: "supplies_to" as const,
      amount: s.ratio,
    })),
  };
  const events = riskEvents[code] || [];
  const history = ratingHistory[code] || defaultHistory;

  return {
    company,
    score,
    suppliers,
    topCustomers: [
      { name: "客户A", ratio: 0.15 },
      { name: "客户B", ratio: 0.12 },
      { name: "客户C", ratio: 0.08 },
    ],
    graph,
    events,
    history,
  };
}
