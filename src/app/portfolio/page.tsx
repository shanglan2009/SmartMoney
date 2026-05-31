"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp, TrendingDown, DollarSign, Wallet,
  RefreshCw, AlertTriangle, RotateCcw
} from "lucide-react";
import {
  loadPortfolio, updatePortfolio, calculateHoldings,
  resetPortfolio, startSimulation, savePortfolio,
  type HoldingWithPL, type PortfolioSummary
} from "@/lib/portfolioStore";

export default function PortfolioPage() {
  const [holdings, setHoldings] = useState<HoldingWithPL[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");
  const [trades, setTrades] = useState<{ code: string; name: string; type: string; shares: number; price: number; amount: number; date: string }[]>([]);

  const loadData = useCallback(async (force = false) => {
    if (force) setRefreshing(true);
    setLoading(true);

    try {
      // 1. 获取最新评分数据
      const res = await fetch(`/api/collect${force ? "?refresh=true" : ""}`, {
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) {
        throw new Error(`API返回 ${res.status}`);
      }
      const data = await res.json();
      const stocks = data.stocks || [];
      if (stocks.length === 0) {
        throw new Error("API返回空数据");
      }

      // 2. 找出增持列表
      const positiveWatch = stocks
        .filter((s: any) => s.rating === "强烈推荐" || s.rating === "买入")
        .map((s: any) => s.code);

      console.log(`[组合] 增持 ${positiveWatch.length} 只, 共 ${stocks.length} 只股票`);

      // 3. 构建价格映射
      const prices: Record<string, { price: number; name: string }> = {};
      stocks.forEach((s: any) => {
        if (s.price && s.price > 0) {
          prices[s.code] = { price: s.price, name: s.name };
        }
      });

      // 4. 执行买入/卖出逻辑
      const result = updatePortfolio(positiveWatch, prices);

      // 5. 计算持仓盈亏
      const { holdings: h, summary: s } = calculateHoldings(prices);

      setHoldings(h);
      setSummary(s);
      setTrades(result.state.trades.slice().reverse().slice(0, 50));

      // 6. 显示交易消息
      const msgs: string[] = [];
      if (result.newBuys.length > 0) {
        msgs.push(`🟢 买入 ${result.newBuys.map(b => `${b.name}(${b.price}元)`).join(", ")}, 各100股`);
      }
      if (result.newSells.length > 0) {
        msgs.push(`🔴 卖出 ${result.newSells.map(b => `${b.name}(盈亏${b.pl > 0 ? "+" : ""}${b.pl}元)`).join(", ")}`);
      }
      if (msgs.length > 0) {
        setMessage(msgs.join(" | "));
        setTimeout(() => setMessage(""), 8000);
      } else {
        setMessage(h.length > 0 ? `当前持仓 ${h.length} 只` : "暂无持仓，等待强烈推荐/买入标的出现");
      }
    } catch (err: any) {
      console.error("[组合] 加载失败:", err);
      setMessage(`数据加载失败: ${err.message || "未知错误"}`);
      // 即使API失败，也从本地加载已有持仓显示
      try {
        const { holdings: h, summary: s } = calculateHoldings({});
        if (h.length > 0) {
          setHoldings(h);
          setSummary(s);
        }
      } catch {}
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    // 首次加载：如果无持仓且有积极观察股票，自动开始模拟
    async function init() {
      const pf = loadPortfolio();
      const hasNoHoldings = Object.keys(pf.holdings).length === 0;
      if (hasNoHoldings || pf.lastPositiveWatchSnapshot.length === 0) {
        // 无持仓或首次运行 → 清除快照让updatePortfolio检测所有为新进入
        startSimulation();
      }
      await loadData(true);
    }
    init();
    const interval = setInterval(() => loadData(), 60_000);
    return () => clearInterval(interval);
  }, []);

  const handleReset = () => {
    if (confirm("确定重置所有持仓数据？这将清空交易记录和持仓。")) {
      resetPortfolio();
      loadData(true);
    }
  };

  const formatMoney = (v: number) =>
    v.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formatPercent = (v: number) =>
    `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;

  return (
    <div>
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-ink" />
          <h1 className="text-xl font-semibold text-ink">模拟市值</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">初始资金: ¥1,000,000</span>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border border-rule bg-panel text-ink-2 hover:bg-paper-3 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
            刷新
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            重置
          </button>
        </div>
      </div>

      {/* 提示消息 */}
      {message && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700">
          {message}
        </div>
      )}

      {/* 账户总览 */}
      {summary && (
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5 mb-4">
          <div className="rounded-lg border border-rule bg-panel p-4">
            <span className="text-xs text-muted font-medium uppercase tracking-wide">总资产</span>
            <p className={`text-2xl font-bold mt-1 ${summary.totalAssets >= 1000000 ? "text-green-600" : "text-red-600"}`}>
              ¥{formatMoney(summary.totalAssets)}
            </p>
          </div>
          <div className="rounded-lg border border-rule bg-panel p-4">
            <span className="text-xs text-muted font-medium uppercase tracking-wide">持仓市值</span>
            <p className="text-2xl font-bold mt-1 text-ink">¥{formatMoney(summary.totalMarketValue)}</p>
            <p className="text-xs text-muted mt-1">可用现金: ¥{formatMoney(summary.cash)}</p>
          </div>
          <div className="rounded-lg border border-rule bg-panel p-4">
            <span className="text-xs text-muted font-medium uppercase tracking-wide">今日盈亏</span>
            <p className={`text-2xl font-bold mt-1 ${summary.dailyPL >= 0 ? "text-green-600" : "text-red-600"}`}>
              {summary.dailyPL >= 0 ? "+" : ""}¥{formatMoney(summary.dailyPL)}
            </p>
            <p className={`text-xs mt-1 ${summary.dailyPLPercent >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatPercent(summary.dailyPLPercent)}
            </p>
          </div>
          <div className="rounded-lg border border-rule bg-panel p-4">
            <span className="text-xs text-muted font-medium uppercase tracking-wide">累计盈亏</span>
            <p className={`text-2xl font-bold mt-1 ${summary.totalPL >= 0 ? "text-green-600" : "text-red-600"}`}>
              {summary.totalPL >= 0 ? "+" : ""}¥{formatMoney(summary.totalPL)}
            </p>
            <p className={`text-xs mt-1 ${summary.totalPLPercent >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatPercent(summary.totalPLPercent)}
            </p>
          </div>
          <div className="rounded-lg border border-rule bg-panel p-4">
            <span className="text-xs text-muted font-medium uppercase tracking-wide">持仓数量</span>
            <p className="text-2xl font-bold mt-1 text-ink">{holdings.length} 只</p>
            <p className="text-xs text-muted mt-1">累计交易: {trades.length} 笔</p>
          </div>
        </section>
      )}

      {/* 加载状态 */}
      {loading && (
        <div className="text-center py-12 text-muted animate-pulse">
          正在更新持仓数据...
        </div>
      )}

      {/* 持仓列表 */}
      {!loading && holdings.length === 0 && (
        <div className="text-center py-12 text-muted">
          <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>暂无持仓</p>
          <p className="text-xs mt-1">当股票进入「增持」评级时，将自动买入100股</p>
          <button
            onClick={() => {
              startSimulation();
              loadData(true);
            }}
            className="mt-3 px-4 py-2 rounded-full bg-ink text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            开始模拟 → 立即买入当前增持股票
          </button>
        </div>
      )}

      {!loading && holdings.length > 0 && (
        <div className="rounded-lg border border-rule bg-panel overflow-hidden mb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-rule text-xs text-muted bg-paper-2">
                  <th className="text-left px-3 py-2.5 font-medium">股票名称</th>
                  <th className="text-left px-3 py-2.5 font-medium">代码</th>
                  <th className="text-right px-3 py-2.5 font-medium">持有股数</th>
                  <th className="text-right px-3 py-2.5 font-medium">现价</th>
                  <th className="text-right px-3 py-2.5 font-medium">成本价</th>
                  <th className="text-right px-3 py-2.5 font-medium">持有市值</th>
                  <th className="text-right px-3 py-2.5 font-medium">当日盈亏</th>
                  <th className="text-right px-3 py-2.5 font-medium">当日盈亏%</th>
                  <th className="text-right px-3 py-2.5 font-medium">持仓盈亏</th>
                  <th className="text-right px-3 py-2.5 font-medium">持仓盈亏%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {holdings.map((h) => (
                  <tr key={h.code} className="hover:bg-paper-3 transition-colors">
                    <td className="px-3 py-2.5 font-medium text-ink">{h.name}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-muted">{h.code}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-ink-2">{h.shares}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-ink font-medium">
                      ¥{h.currentPrice.toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-ink-2">
                      ¥{h.costPrice.toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-ink font-medium">
                      ¥{h.marketValue.toFixed(2)}
                    </td>
                    <td className={`px-3 py-2.5 text-right font-mono ${h.dailyChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {h.dailyChange >= 0 ? "+" : ""}¥{Math.abs(h.dailyChange).toFixed(2)}
                    </td>
                    <td className={`px-3 py-2.5 text-right font-mono text-xs ${h.dailyChangePercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatPercent(h.dailyChangePercent)}
                    </td>
                    <td className={`px-3 py-2.5 text-right font-mono ${h.totalPL >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {h.totalPL >= 0 ? "+" : ""}¥{Math.abs(h.totalPL).toFixed(2)}
                    </td>
                    <td className={`px-3 py-2.5 text-right font-mono text-xs ${h.totalPLPercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatPercent(h.totalPLPercent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 交易记录 */}
      {trades.length > 0 && (
        <details className="rounded-lg border border-rule bg-panel">
          <summary className="px-4 py-3 text-sm font-medium text-ink cursor-pointer hover:bg-paper-3 transition-colors">
            交易记录 ({trades.length} 笔)
          </summary>
          <div className="max-h-64 overflow-y-auto border-t border-rule">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-paper-2">
                <tr className="text-muted">
                  <th className="text-left px-3 py-2 font-medium">日期</th>
                  <th className="text-left px-3 py-2 font-medium">操作</th>
                  <th className="text-left px-3 py-2 font-medium">股票</th>
                  <th className="text-right px-3 py-2 font-medium">股数</th>
                  <th className="text-right px-3 py-2 font-medium">价格</th>
                  <th className="text-right px-3 py-2 font-medium">金额</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {trades.map((t, i) => (
                  <tr key={i} className="hover:bg-paper-3">
                    <td className="px-3 py-1.5 text-muted">{t.date}</td>
                    <td className="px-3 py-1.5">
                      <span className={`font-medium ${t.type === "buy" ? "text-green-600" : "text-red-600"}`}>
                        {t.type === "buy" ? "买入" : "卖出"}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-ink-2">{t.name}</td>
                    <td className="px-3 py-1.5 text-right font-mono">{t.shares}</td>
                    <td className="px-3 py-1.5 text-right font-mono">¥{t.price.toFixed(2)}</td>
                    <td className="px-3 py-1.5 text-right font-mono">¥{formatMoney(t.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}
