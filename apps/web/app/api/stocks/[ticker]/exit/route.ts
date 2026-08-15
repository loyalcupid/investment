// GET /api/stocks/{ticker}/exit?entryPrice=70000  — PRD 5.8 청산(매도) 신호
import { NextRequest, NextResponse } from "next/server";
import { getExitSignal, getSignalDetail } from "@/lib/data/repository";

export async function GET(req: NextRequest, ctx: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await ctx.params;
  const entryPrice = Number(req.nextUrl.searchParams.get("entryPrice"));
  const detail = getSignalDetail(ticker, 0);
  if (!detail) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "종목을 찾을 수 없습니다." } }, { status: 404 });
  }
  if (!entryPrice || entryPrice <= 0) {
    return NextResponse.json({ error: { code: "INVALID_ENTRY_PRICE", message: "entryPrice가 필요합니다." } }, { status: 400 });
  }
  const exit = getExitSignal(ticker, entryPrice);
  return NextResponse.json({
    ticker,
    close: detail.price.close,
    entryPrice,
    returnRate: ((detail.price.close - entryPrice) / entryPrice) * 100,
    exitSignal: exit,
  });
}
