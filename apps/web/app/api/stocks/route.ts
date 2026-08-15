// GET /api/stocks?tickers=005930,000660
// MVP에서는 FastAPI(10장) 대신 Next.js Route Handler로 대체 구현.
import { NextRequest, NextResponse } from "next/server";
import { getSignalDetail } from "@/lib/data/repository";

export async function GET(req: NextRequest) {
  const tickersParam = req.nextUrl.searchParams.get("tickers") ?? "";
  const tickers = tickersParam.split(",").map((t) => t.trim()).filter(Boolean);

  const results = tickers
    .map((ticker) => getSignalDetail(ticker, 0))
    .filter((d): d is NonNullable<typeof d> => d != null)
    .map((d) => ({
      ticker: d.ticker,
      nameKo: d.meta.nameKo,
      market: d.meta.market,
      close: d.price.close,
      changeRate: d.price.changeRate,
      score: d.composed.score,
      grade: d.composed.grade,
      gateFailed: d.composed.gateFailed,
    }));

  return NextResponse.json({ results });
}
