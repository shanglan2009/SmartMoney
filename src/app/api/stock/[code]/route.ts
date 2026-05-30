import { NextRequest, NextResponse } from "next/server";
import { getStockAnalysis } from "@/lib/mockData";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const data = getStockAnalysis(code);

  if (!data) {
    return NextResponse.json({ error: "Stock not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
