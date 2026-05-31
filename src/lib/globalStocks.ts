/**
 * 全球供应链分工评分引擎 v4.0
 * 
 * 核心维度:
 * 1. 海外收入占比 (30%) - 国际分工参与广度
 * 2. 国际供应链地位 (25%) - 在巨头供应链中的角色
 * 3. 供应链护城河 (20%) - 替代难度/技术壁垒
 * 4. 研发强度 (15%) - 持续创新能力
 * 5. 客户集中度风险 (10%) - 单一客户依赖风险
 * 
 * 评级映射 (同前):
 * 0-19: 谨慎  20-39: 积极观察  40-69: 观察  70-84: 高风险偏多  85-100: 高风险观察
 */

export type RatingLevel = "强烈推荐" | "买入" | "增持" | "持有" | "中性" | "减持" | "卖出";

// ========== 国际分工股票数据库 ==========

export interface GlobalStock {
  code: string;
  name: string;
  industry: string;
  market: string;
  overseasRatio: number;       // 海外收入占比 0-1
  rdRatio: number;             // 研发费用率 0-1
  rdExpense: number;           // 研发费用(亿元)
  moatLevel: "极高" | "高" | "中" | "低";
  globalCustomers: string[];   // 国际大客户
  role: string;                // 国际分工角色
  revenue: number;             // 营收(亿元)
}

export const GLOBAL_STOCKS: GlobalStock[] = [
  // 芯片/半导体
  { code: "688981", name: "中芯国际", industry: "芯片制造", market: "SH", overseasRatio: 0.45, rdRatio: 0.128, rdExpense: 68.2, moatLevel: "高", globalCustomers: ["台积电竞争","NVIDIA间接","高通"], role: "全球晶圆代工", revenue: 523.4 },
  { code: "688008", name: "澜起科技", industry: "芯片/内存接口", market: "SH", overseasRatio: 0.70, rdRatio: 0.225, rdExpense: 12.5, moatLevel: "极高", globalCustomers: ["三星","SK海力士","Google","英特尔"], role: "DDR5内存接口全球龙头", revenue: 45.8 },
  { code: "603986", name: "兆易创新", industry: "存储芯片", market: "SH", overseasRatio: 0.35, rdRatio: 0.152, rdExpense: 8.5, moatLevel: "高", globalCustomers: ["苹果","三星","华为"], role: "NOR Flash全球前三", revenue: 68.5 },
  { code: "603501", name: "韦尔股份", industry: "图像传感器", market: "SH", overseasRatio: 0.80, rdRatio: 0.125, rdExpense: 22.5, moatLevel: "极高", globalCustomers: ["苹果","三星","华为","OV"], role: "CIS图像传感器全球前三", revenue: 185.6 },
  { code: "600584", name: "长电科技", industry: "芯片封装测试", market: "SH", overseasRatio: 0.55, rdRatio: 0.068, rdExpense: 12.8, moatLevel: "高", globalCustomers: ["台积电","NVIDIA","苹果","高通"], role: "封测全球前三", revenue: 268.5 },
  { code: "002156", name: "通富微电", industry: "芯片封装测试", market: "SZ", overseasRatio: 0.60, rdRatio: 0.052, rdExpense: 6.5, moatLevel: "高", globalCustomers: ["AMD(合资)","英伟达","联发科"], role: "AMD封测独家伙伴", revenue: 185.6 },
  { code: "002371", name: "北方华创", industry: "芯片设备", market: "SZ", overseasRatio: 0.15, rdRatio: 0.185, rdExpense: 18.6, moatLevel: "中", globalCustomers: ["中芯国际","台积电(间接)"], role: "国产半导体设备龙头", revenue: 156.8 },
  { code: "688012", name: "中微公司", industry: "芯片刻蚀设备", market: "SH", overseasRatio: 0.30, rdRatio: 0.205, rdExpense: 15.2, moatLevel: "极高", globalCustomers: ["台积电","SK海力士","英特尔","美光"], role: "刻蚀设备打入台积电供应链", revenue: 62.5 },
  { code: "300661", name: "圣邦股份", industry: "模拟芯片", market: "SZ", overseasRatio: 0.25, rdRatio: 0.165, rdExpense: 4.8, moatLevel: "中", globalCustomers: ["三星","苹果","华为"], role: "国产模拟芯片替代", revenue: 28.5 },
  { code: "688099", name: "晶晨股份", industry: "AI音视频芯片", market: "SH", overseasRatio: 0.50, rdRatio: 0.202, rdExpense: 8.5, moatLevel: "高", globalCustomers: ["谷歌","亚马逊","Meta","小米"], role: "智能终端SoC全球供应商", revenue: 42.6 },
  { code: "688041", name: "海光信息", industry: "芯片设计", market: "SH", overseasRatio: 0.05, rdRatio: 0.285, rdExpense: 22.8, moatLevel: "低", globalCustomers: ["国内为主"], role: "国产CPU/x86授权", revenue: 85.2 },
  { code: "688256", name: "寒武纪", industry: "AI芯片", market: "SH", overseasRatio: 0.08, rdRatio: 0.652, rdExpense: 28.5, moatLevel: "中", globalCustomers: ["国内为主"], role: "国产AI训练芯片", revenue: 42.6 },

  // AI/算力
  { code: "601138", name: "工业富联", industry: "AI服务器", market: "SH", overseasRatio: 0.65, rdRatio: 0.025, rdExpense: 42.8, moatLevel: "极高", globalCustomers: ["NVIDIA","苹果","微软","亚马逊"], role: "全球最大AI服务器制造商", revenue: 3286.5 },
  { code: "300308", name: "中际旭创", industry: "光模块", market: "SZ", overseasRatio: 0.75, rdRatio: 0.122, rdExpense: 22.3, moatLevel: "极高", globalCustomers: ["Google","Meta","英伟达","微软"], role: "全球光模块龙头", revenue: 182.5 },
  { code: "300502", name: "新易盛", industry: "光模块", market: "SZ", overseasRatio: 0.65, rdRatio: 0.145, rdExpense: 8.5, moatLevel: "高", globalCustomers: ["亚马逊","微软","Meta"], role: "高速光模块供应商", revenue: 68.4 },
  { code: "000977", name: "浪潮信息", industry: "AI服务器", market: "SZ", overseasRatio: 0.15, rdRatio: 0.052, rdExpense: 32.5, moatLevel: "中", globalCustomers: ["NVIDIA(采购)","英特"], role: "国内AI服务器龙头", revenue: 685.2 },
  { code: "603019", name: "中科曙光", industry: "算力/超算", market: "SH", overseasRatio: 0.10, rdRatio: 0.085, rdExpense: 15.8, moatLevel: "中", globalCustomers: ["国内为主"], role: "国产超算龙头", revenue: 168.5 },

  // 精密制造/消费电子供应链
  { code: "002475", name: "立讯精密", industry: "精密制造", market: "SZ", overseasRatio: 0.75, rdRatio: 0.072, rdExpense: 48.5, moatLevel: "极高", globalCustomers: ["苹果","Meta","微软","特斯拉"], role: "苹果核心组装/连接器供应商", revenue: 1865.8 },
  { code: "002241", name: "歌尔股份", industry: "声学/VR", market: "SZ", overseasRatio: 0.60, rdRatio: 0.085, rdExpense: 28.5, moatLevel: "高", globalCustomers: ["苹果","Meta","索尼"], role: "VR/声学组件全球龙头", revenue: 685.6 },
  { code: "000725", name: "京东方A", industry: "显示面板", market: "SZ", overseasRatio: 0.40, rdRatio: 0.075, rdExpense: 85.4, moatLevel: "高", globalCustomers: ["苹果","三星","华为"], role: "全球面板龙头", revenue: 1568.2 },
  { code: "002384", name: "东山精密", industry: "PCB/精密制造", market: "SZ", overseasRatio: 0.45, rdRatio: 0.062, rdExpense: 12.5, moatLevel: "高", globalCustomers: ["苹果","特斯拉","华为"], role: "FPC/精密金属全球供应商", revenue: 285.6 },
  { code: "300476", name: "胜宏科技", industry: "PCB/AI", market: "SZ", overseasRatio: 0.35, rdRatio: 0.085, rdExpense: 6.8, moatLevel: "高", globalCustomers: ["英伟达","AMD","英特尔"], role: "GPU载板供应商", revenue: 85.6 },

  // 储能/锂电池
  { code: "300750", name: "宁德时代", industry: "储能/锂电池", market: "SZ", overseasRatio: 0.30, rdRatio: 0.055, rdExpense: 85.4, moatLevel: "极高", globalCustomers: ["特斯拉","宝马","奔驰","大众"], role: "全球动力电池龙头", revenue: 1568.2 },
  { code: "300274", name: "阳光电源", industry: "储能/逆变器", market: "SZ", overseasRatio: 0.40, rdRatio: 0.068, rdExpense: 18.5, moatLevel: "高", globalCustomers: ["全球逆变器市占率第一"], role: "全球逆变器龙头", revenue: 425.8 },
  { code: "002850", name: "科达利", industry: "电池结构件", market: "SZ", overseasRatio: 0.20, rdRatio: 0.052, rdExpense: 3.5, moatLevel: "高", globalCustomers: ["宁德时代","特斯拉","松下"], role: "全球电池结构件龙头", revenue: 85.6 },
  { code: "688472", name: "阿特斯", industry: "储能/光伏", market: "SH", overseasRatio: 0.60, rdRatio: 0.035, rdExpense: 5.2, moatLevel: "高", globalCustomers: ["全球市场"], role: "全球光伏组件供应商", revenue: 385.6 },

  // 电力/高端制造（有国际业务）
  { code: "600089", name: "特变电工", industry: "电力设备", market: "SH", overseasRatio: 0.20, rdRatio: 0.045, rdExpense: 18.5, moatLevel: "中", globalCustomers: ["全球电网项目"], role: "全球变压器供应商", revenue: 625.8 },
  { code: "601727", name: "上海电气", industry: "高端制造/电力", market: "SH", overseasRatio: 0.15, rdRatio: 0.052, rdExpense: 32.5, moatLevel: "中", globalCustomers: ["全球电力项目"], role: "全球电力设备供应商", revenue: 1125.6 },
  { code: "002594", name: "比亚迪", industry: "新能源车/电池", market: "SZ", overseasRatio: 0.08, rdRatio: 0.065, rdExpense: 186.5, moatLevel: "高", globalCustomers: ["全球EV市场"], role: "全球EV销量领先", revenue: 2856.8 },
  { code: "300751", name: "迈为股份", industry: "高端制造/光伏", market: "SZ", overseasRatio: 0.35, rdRatio: 0.125, rdExpense: 8.5, moatLevel: "高", globalCustomers: ["全球HJT设备"], role: "HJT电池设备龙头", revenue: 62.5 },
  { code: "603606", name: "东方电缆", industry: "高端制造/海缆", market: "SH", overseasRatio: 0.12, rdRatio: 0.042, rdExpense: 4.5, moatLevel: "中", globalCustomers: ["全球海缆项目"], role: "全球海缆供应商", revenue: 68.5 },

  { code: "300456", name: "赛微电子", industry: "MEMS传感器/芯片", market: "SZ", overseasRatio: 0.30, rdRatio: 0.15, rdExpense: 3.5, moatLevel: "中", globalCustomers: ["全球MEMS代工","意法半导体"], role: "MEMS传感器代工", revenue: 22.5 },
  { code: "600563", name: "法拉电子", industry: "薄膜电容器", market: "SH", overseasRatio: 0.25, rdRatio: 0.05, rdExpense: 1.2, moatLevel: "高", globalCustomers: ["特斯拉","华为","阳光电源"], role: "薄膜电容器全球前三", revenue: 42.8 },
  { code: "300124", name: "汇川技术", industry: "机器人/工控", market: "SZ", overseasRatio: 0.15, rdRatio: 0.12, rdExpense: 22.5, moatLevel: "高", globalCustomers: ["宁德时代","比亚迪","全球工控市场"], role: "国产伺服/PLC龙头", revenue: 245.8 },
  { code: "600522", name: "中天科技", industry: "光缆/海缆", market: "SH", overseasRatio: 0.20, rdRatio: 0.04, rdExpense: 8.5, moatLevel: "中", globalCustomers: ["全球海缆项目","华为"], role: "全球海缆+光缆供应商", revenue: 385.6 },
  { code: "002270", name: "华明装备", industry: "变压器分接开关", market: "SZ", overseasRatio: 0.30, rdRatio: 0.05, rdExpense: 1.5, moatLevel: "极高", globalCustomers: ["西门子","ABB","全球变压器厂"], role: "变压器分接开关全球龙头(90%份额)", revenue: 28.5 },
  { code: "300827", name: "上能电气", industry: "储能/逆变器", market: "SZ", overseasRatio: 0.25, rdRatio: 0.06, rdExpense: 2.5, moatLevel: "中", globalCustomers: ["全球光伏项目","中核"], role: "逆变器供应商", revenue: 38.5 },
  { code: "605117", name: "德业股份", industry: "储能/逆变器", market: "SH", overseasRatio: 0.55, rdRatio: 0.05, rdExpense: 3.5, moatLevel: "高", globalCustomers: ["全球光储市场","巴西/南非/德国"], role: "微型逆变器全球龙头", revenue: 68.5 },
];