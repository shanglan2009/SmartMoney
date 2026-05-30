/**
 * Vercel Cron 定时任务处理
 * 
 * 由 vercel.json 配置每小时触发:
 *   "crons": [{"path": "/api/cron", "schedule": "0 * * * *"}]
 * 
 * 触发后刷新评分缓存
 */

import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // 验证 Vercel Cron 密钥（可选安全措施）
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 调用评分刷新接口
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
    
    const res = await fetch(`${baseUrl}/api/scores?refresh=true`, {
      signal: AbortSignal.timeout(30000),
    });
    const data = await res.json();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stockCount: data.count,
      message: "评分缓存已刷新",
    });
  } catch (err: any) {
    console.error("[CRON] Score refresh failed:", err);
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}
