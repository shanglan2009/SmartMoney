/**
 * 模拟市值组合管理器
 * 
 * 规则:
 * - 股票进入「积极观察」评级 → 自动买入100股
 * - 股票退出「积极观察」评级 → 自动清仓
 * - 所有数据存储在 localStorage
 */

export interface Holding {
  code: string;
  name: string;
  shares: number;
  costPrice: number;      // 加权平均成本价
  totalCost: number;       // 总成本
  buyDate: string;         // 首次买入日期
}

export interface TradeRecord {
  code: string;
  name: string;
  type: "buy" | "sell";
  shares: number;
  price: number;
  amount: number;
  date: string;
}

export interface PortfolioState {
  holdings: Record<string, Holding>;
  cash: number;
  totalDeposited: number;
  trades: TradeRecord[];
  lastPositiveWatchSnapshot: string[]; // 上一次的积极观察列表
  lastUpdateDate: string;
}

const STORAGE_KEY = "serenity_portfolio";

// ========== 初始化 ==========

const DEFAULT_STATE: PortfolioState = {
  holdings: {},
  cash: 1_000_000,        // 初始资金100万
  totalDeposited: 1_000_000,
  trades: [],
  lastPositiveWatchSnapshot: [],
  lastUpdateDate: "",
};

export function loadPortfolio(): PortfolioState {
  if (typeof window === "undefined") return { ...DEFAULT_STATE };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return { ...DEFAULT_STATE };
}

export function savePortfolio(state: PortfolioState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

// ========== 核心逻辑 ==========

export interface PriceMap {
  [code: string]: { price: number; name: string };
}

export interface UpdateResult {
  newBuys: { code: string; name: string; price: number }[];
  newSells: { code: string; name: string; price: number; shares: number; pl: number }[];
  state: PortfolioState;
}

/**
 * 根据最新的积极观察列表更新持仓
 * @param currentPositiveWatch 当前评级为「积极观察」的股票代码列表
 * @param prices 当前价格映射 { code: {price, name} }
 * @returns 更新结果
 */
export function updatePortfolio(
  currentPositiveWatch: string[],
  prices: PriceMap
): UpdateResult {
  const state = loadPortfolio();
  const prevWatch = state.lastPositiveWatchSnapshot;
  
  // 首次运行或有新进入积极观察的股票 → 买入100股
  const today = new Date().toISOString().split("T")[0];

  const currentSet = new Set(currentPositiveWatch);
  const prevSet = new Set(prevWatch);

  const newBuys: UpdateResult["newBuys"] = [];
  const newSells: UpdateResult["newSells"] = [];

  // === 检测新进入积极观察的股票 → 买入 100 股 ===
  for (const code of currentPositiveWatch) {
    if (!prevSet.has(code)) {
      const priceInfo = prices[code];
      if (!priceInfo || !priceInfo.price) continue;

      const price = priceInfo.price;
      const totalCost = price * 100;

      if (state.cash < totalCost) continue; // 现金不足则跳过

      const existing = state.holdings[code];
      if (existing) {
        // 已有持仓，加仓
        const newShares = 100;
        const newTotalCost = existing.totalCost + totalCost;
        const newTotalShares = existing.shares + newShares;
        existing.costPrice = newTotalCost / newTotalShares;
        existing.totalCost = newTotalCost;
        existing.shares = newTotalShares;
      } else {
        // 新建持仓
        state.holdings[code] = {
          code,
          name: priceInfo.name,
          shares: 100,
          costPrice: price,
          totalCost: totalCost,
          buyDate: today,
        };
      }

      state.cash -= totalCost;
      state.trades.push({
        code,
        name: priceInfo.name,
        type: "buy",
        shares: 100,
        price,
        amount: totalCost,
        date: today,
      });

      newBuys.push({ code, name: priceInfo.name, price });
    }
  }

  // === 检测退出积极观察的股票 → 清仓 ===
  for (const code of prevWatch) {
    if (!currentSet.has(code)) {
      const holding = state.holdings[code];
      if (!holding || holding.shares === 0) continue;

      const priceInfo = prices[code];
      if (!priceInfo || !priceInfo.price) continue;

      const price = priceInfo.price;
      const sellAmount = price * holding.shares;
      const pl = sellAmount - holding.totalCost;

      state.cash += sellAmount;
      state.trades.push({
        code,
        name: holding.name,
        type: "sell",
        shares: holding.shares,
        price,
        amount: sellAmount,
        date: today,
      });

      newSells.push({
        code,
        name: holding.name,
        price,
        shares: holding.shares,
        pl: Math.round(pl * 100) / 100,
      });

      delete state.holdings[code];
    }
  }

  state.lastPositiveWatchSnapshot = [...currentPositiveWatch];
  state.lastUpdateDate = today;
  savePortfolio(state);

  return { newBuys, newSells, state };
}

// ========== 计算持仓盈亏 ==========

export interface HoldingWithPL extends Holding {
  currentPrice: number;
  marketValue: number;
  dailyChange: number;
  dailyChangePercent: number;
  totalPL: number;
  totalPLPercent: number;
  todayChange?: number; // 当日价格变化
}

export interface PortfolioSummary {
  totalMarketValue: number;
  totalCost: number;
  totalPL: number;
  totalPLPercent: number;
  dailyPL: number;
  dailyPLPercent: number;
  cash: number;
  totalAssets: number;
}

/**
 * 计算当前持仓盈亏
 */
export function calculateHoldings(
  prices: PriceMap,
  prevPrices?: PriceMap
): { holdings: HoldingWithPL[]; summary: PortfolioSummary } {
  const state = loadPortfolio();
  const holdings: HoldingWithPL[] = [];
  let totalMarketValue = 0;
  let totalCost = 0;
  let totalDailyPL = 0;
  let totalDailyCost = 0;

  for (const holding of Object.values(state.holdings)) {
    const priceInfo = prices[holding.code];
    if (!priceInfo || !priceInfo.price) continue;

    const currentPrice = priceInfo.price;
    const prevPrice = prevPrices?.[holding.code]?.price ?? currentPrice;
    const marketValue = currentPrice * holding.shares;
    const totalPL = marketValue - holding.totalCost;
    const dailyChange = (currentPrice - prevPrice) * holding.shares;

    holdings.push({
      ...holding,
      currentPrice,
      marketValue,
      dailyChange: Math.round(dailyChange * 100) / 100,
      dailyChangePercent: prevPrice > 0
        ? Math.round(((currentPrice - prevPrice) / prevPrice) * 10000) / 100
        : 0,
      totalPL: Math.round(totalPL * 100) / 100,
      totalPLPercent: holding.totalCost > 0
        ? Math.round((totalPL / holding.totalCost) * 10000) / 100
        : 0,
      todayChange: currentPrice - prevPrice,
    });

    totalMarketValue += marketValue;
    totalCost += holding.totalCost;
    totalDailyPL += dailyChange;
    totalDailyCost += holding.totalCost;
  }

  const totalAssets = totalMarketValue + state.cash;
  // 累计盈亏 = 总资产 - 总投入（包含已实现和未实现盈亏）
  const totalPL = totalAssets - state.totalDeposited;

  return {
    holdings: holdings.sort((a, b) => b.marketValue - a.marketValue),
    summary: {
      totalMarketValue: Math.round(totalMarketValue * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      totalPL: Math.round(totalPL * 100) / 100,
      totalPLPercent: state.totalDeposited > 0
        ? Math.round((totalPL / state.totalDeposited) * 10000) / 100
        : 0,
      dailyPL: Math.round(totalDailyPL * 100) / 100,
      dailyPLPercent: totalDailyCost > 0
        ? Math.round((totalDailyPL / totalDailyCost) * 10000) / 100
        : 0,
      cash: Math.round(state.cash * 100) / 100,
      totalAssets: Math.round(totalAssets * 100) / 100,
    },
  };
}

// ========== 重置组合 ==========

export function resetPortfolio(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

/** 开始模拟：重置并清空快照，下次加载时会检测积极观察列表变化并买入 */
export function startSimulation(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  // 保存一个空快照，让下次updatePortfolio检测到所有积极观察为"新进入"
  const initState = { ...DEFAULT_STATE, lastPositiveWatchSnapshot: [] };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initState));
}
