"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BarChart3, Users, RefreshCw, Globe } from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      {/* Hero */}
      <div className="max-w-2xl mx-auto mb-12 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium mb-6">
          <RefreshCw className="h-3 w-3" />
          每日 UTC 05:00 自动刷新 · 数据源: Open Cabinet / OGE
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
          SmartMoney
          <span className="block text-2xl sm:text-3xl font-medium text-slate-400 mt-2">
            政要持仓追踪
          </span>
        </h1>
        
        <p className="text-base sm:text-lg text-slate-500 mb-8 leading-relaxed max-w-xl mx-auto">
          基于美国政要公开披露的股票交易数据（OGE / Open Cabinet），
          追踪特朗普及政府核心成员的持仓变化，为你提供独特的投资视角
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/trump"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
          >
            进入仪表盘
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="https://open-cabinet.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
          >
            了解数据源
            <Globe className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto w-full">
        <div className="rounded-xl border border-slate-100 bg-white p-5 text-left shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center mb-3">
            <Users className="h-5 w-5 text-amber-600" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">政要覆盖</h3>
          <p className="text-sm text-slate-400">追踪 19+ 位特朗普政府核心成员及国会议员的美股持仓</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-5 text-left shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
            <BarChart3 className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">多维分析</h3>
          <p className="text-sm text-slate-400">行业分布、买卖排行、持仓建议，一目了然</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-5 text-left shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center mb-3">
            <RefreshCw className="h-5 w-5 text-green-600" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">每日更新</h3>
          <p className="text-sm text-slate-400">自动聚合 Open Cabinet / TrumpTrades 等五大数据源</p>
        </div>
      </div>

      {/* Data Sources */}
      <div className="mt-12 text-center">
        <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-3">数据来源</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {[
            { name: "Open Cabinet", url: "https://open-cabinet.org" },
            { name: "TrumpTrades", url: "https://trumpstrades.com" },
            { name: "Trump Tracker", url: "https://trumptracker.org" },
            { name: "OGE", url: "https://oge.gov" },
            { name: "ProPublica", url: "https://projects.propublica.org/trump-team-financial-disclosures/" },
          ].map((s) => (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2 transition-colors"
            >
              {s.name}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
