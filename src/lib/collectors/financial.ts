/**
 * 财报数据采集器 — 东方财富免费API
 * ✅ 免费公开API，无反爬虫
 * ✅ 缓存1天（财报不会日更）
 */

let cache: Record<string, any> = {};
let cacheTime = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24小时

function secid(code: string) {
  return code.startsWith("6") || code.startsWith("9") ? `${code}.SH` : `${code}.SZ`;
}

export interface FinancialHighlights {
  code: string;
  name: string;
  /** 营业总收入(亿元) */
  revenue?: number;
  /** 营收同比增长率 */
  revenueYoy?: number;
  /** 归母净利润(亿元) */
  netProfit?: number;
  /** 净利润同比增长率 */
  profitYoy?: number;
  /** 毛利率 */
  grossMargin?: number;
  /** 净利率 */
  netMargin?: number;
  /** 研发费用(亿元) */
  rdExpense?: number;
  /** 研发费用率 */
  rdRatio?: number;
  /** 报告期 */
  reportDate?: string;
}

export async function fetchFinancialData(code: string): Promise<FinancialHighlights | null> {
  const now = Date.now();
  if (cache[code] && now - cacheTime < CACHE_TTL) return cache[code];

  try {
    const market = code.startsWith("6") || code.startsWith("9") ? ".SH" : ".SZ";
    const url = `https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_LICO_FN_CPD&columns=SECUCODE,SECURITY_NAME_ABBR,TOTAL_OPERATE_INCOME,OPERATE_INCOME_YOY,PARENT_NETPROFIT,NETPROFIT_YOY,GROSS_PROFIT_MARGIN,NET_PROFIT_MARGIN,RESEARCH_EXPENSE,RESEARCH_EXPENSE_RATIO,REPORT_DATE&filter=(SECUCODE="${code}${market}")&pageNumber=1&pageSize=1&sortTypes=-1&sortColumns=REPORT_DATE&source=WEB&client=WEB`;
    
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", Referer: "https://data.eastmoney.com/" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;

    const data = await res.json();
    const row = data?.result?.data?.[0];
    if (!row) return null;

    const result: FinancialHighlights = {
      code,
      name: row.SECURITY_NAME_ABBR || "",
      revenue: row.TOTAL_OPERATE_INCOME ? parseFloat((row.TOTAL_OPERATE_INCOME / 1e8).toFixed(2)) : undefined,
      revenueYoy: row.OPERATE_INCOME_YOY ? parseFloat((row.OPERATE_INCOME_YOY * 100).toFixed(1)) : undefined,
      netProfit: row.PARENT_NETPROFIT ? parseFloat((row.PARENT_NETPROFIT / 1e8).toFixed(2)) : undefined,
      profitYoy: row.NETPROFIT_YOY ? parseFloat((row.NETPROFIT_YOY * 100).toFixed(1)) : undefined,
      grossMargin: row.GROSS_PROFIT_MARGIN ? parseFloat((row.GROSS_PROFIT_MARGIN * 100).toFixed(1)) : undefined,
      netMargin: row.NET_PROFIT_MARGIN ? parseFloat((row.NET_PROFIT_MARGIN * 100).toFixed(1)) : undefined,
      rdExpense: row.RESEARCH_EXPENSE ? parseFloat((row.RESEARCH_EXPENSE / 1e8).toFixed(2)) : undefined,
      rdRatio: row.RESEARCH_EXPENSE_RATIO ? parseFloat((row.RESEARCH_EXPENSE_RATIO * 100).toFixed(1)) : undefined,
      reportDate: row.REPORT_DATE ? row.REPORT_DATE.substring(0, 7) : undefined,
    };

    cache[code] = result;
    cacheTime = now;
    return result;
  } catch {
    return null;
  }
}

export async function fetchBatchFinancial(codes: string[]): Promise<Record<string, FinancialHighlights>> {
  const result: Record<string, FinancialHighlights> = {};
  const batchSize = 5;
  for (let i = 0; i < codes.length; i += batchSize) {
    const batch = await Promise.all(codes.slice(i, i + batchSize).map(fetchFinancialData));
    batch.forEach((d, j) => {
      if (d) result[codes[i + j]] = d;
    });
  }
  return result;
}
