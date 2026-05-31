// ============================================================
// Trump Stock Tracker — 主数据 API
// ============================================================

import { NextResponse } from "next/server";
import {
  getDashboardStats,
  getPoliticians,
  getPoliticianPortfolio,
  getRecommendations,
  getTrades,
} from "@/lib/trumpDataApi";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const section = url.searchParams.get("section");
  const politicianId = url.searchParams.get("politicianId");
  const forceRefresh = url.searchParams.has("refresh");

  if (forceRefresh) {
    getTrades(true); // 强制刷新缓存
  }

  try {
    switch (section) {
      case "stats":
        return NextResponse.json(getDashboardStats());

      case "politicians":
        return NextResponse.json(getPoliticians());

      case "politician":
        if (!politicianId) {
          return NextResponse.json({ error: "politicianId required" }, { status: 400 });
        }
        const portfolio = getPoliticianPortfolio(politicianId);
        if (!portfolio) {
          return NextResponse.json({ error: "Politician not found" }, { status: 404 });
        }
        return NextResponse.json(portfolio);

      case "trades": {
        const trades = getTrades();
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);
        const politician = url.searchParams.get("politician");
        let filtered = trades;
        if (politician) {
          filtered = filtered.filter((t) => t.politicianId === politician);
        }
        return NextResponse.json({
          total: filtered.length,
          trades: filtered.slice(0, limit),
        });
      }

      case "recommendations": {
        const recs = getRecommendations();
        const sector = url.searchParams.get("sector");
        let filtered = recs;
        if (sector) {
          filtered = filtered.filter((r) => r.sector === sector);
        }
        return NextResponse.json({
          total: filtered.length,
          recommendations: filtered.slice(0, 20),
        });
      }

      default:
        // 返回完整仪表盘数据
        return NextResponse.json({
          stats: getDashboardStats(),
          politicians: getPoliticians(),
          recommendations: getRecommendations().slice(0, 10),
        });
    }
  } catch (err: any) {
    console.error("[Trump API Error]", err);
    return NextResponse.json(
      { error: "Internal server error", detail: String(err) },
      { status: 500 }
    );
  }
}
