// ============================================================
// Trump Stock Tracker — 数据刷新 API (Cron 调用)
// ============================================================

import { NextResponse } from "next/server";
import { getTrades, getPoliticians } from "@/lib/trumpDataApi";

export async function GET(request: Request) {
  // 验证 Cron Secret（可选）
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 强制刷新缓存
    const trades = getTrades(true);
    const politicians = getPoliticians();
    const tradeCount = trades.length;

    console.log(`[Trump Cron] Refreshed: ${tradeCount} trades, ${politicians.length} politicians`);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      tradeCount,
      politicianCount: politicians.length,
      message: "数据刷新完成",
      nextScheduled: "UTC 06:00 每日自动刷新",
    });
  } catch (err: any) {
    console.error("[Trump Cron] Refresh failed:", err);
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}
