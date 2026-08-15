// lib/data/screener.ts — PRD 7.4 스크리너 프리셋 (Free 3개 / 유료 전체 가정, MVP는 전부 공개)

import { UNIVERSE, findStock } from "./universe";
import { getFundamentals } from "./universe";
import {
  getLatestIndicatorRow,
  getLatestMarketCap,
  getAvgTradeValue20,
  getConsecutivePositiveDays,
  getSignalDetail,
} from "./repository";
import { getSeries } from "./mock";

export interface ScreenerPreset {
  id: string;
  name: string;
  condition: string;
  plan: "FREE" | "BASIC" | "PRO";
  test: (ticker: string) => boolean;
}

export const SCREENER_PRESETS: ScreenerPreset[] = [
  {
    id: "pullback",
    name: "눌림목 후보",
    condition: "정배열 & RSI 40~55 & 20일선 ±3% & 외국인 3일 순매수",
    plan: "FREE",
    test: (ticker) => {
      const row = getLatestIndicatorRow(ticker);
      const alignedUp = row.sma5 > row.sma20 && row.sma20 > row.sma60;
      const rsiBand = row.rsi >= 40 && row.rsi <= 55;
      const nearSma20 = Math.abs(row.disparity20 - 100) <= 3;
      const frgnBuy3 = getConsecutivePositiveDays(ticker, "frgnNet", 3) === 3;
      return alignedUp && rsiBand && nearSma20 && frgnBuy3;
    },
  },
  {
    id: "flow-concentration",
    name: "수급 집중",
    condition: "5일 순매수강도 상위권(유니버스 내) & 거래대금 20일평균 2배",
    plan: "FREE",
    test: (ticker) => {
      const row = getLatestIndicatorRow(ticker);
      const flows = getSeries(ticker).flows;
      const mktcap = getLatestMarketCap(ticker);
      const intensity =
        (flows.slice(-5).reduce((a, b) => a + b.frgnNet + b.instNet, 0)) / mktcap;
      return intensity > 0.006 && row.volRatio > 2.0;
    },
  },
  {
    id: "oversold-rebound",
    name: "과매도 반등",
    condition: "RSI<30 & 볼린저 %b<0.05 & 거래대금 100억↑",
    plan: "FREE",
    test: (ticker) => {
      const row = getLatestIndicatorRow(ticker);
      const flows = getSeries(ticker).flows;
      const tradeValue = flows.at(-1)!.tradeValue;
      return row.rsi < 30 && row.pctB < 0.05 && tradeValue > 10_000_000_000;
    },
  },
  {
    id: "breakout-high",
    name: "신고가 돌파",
    condition: "52주 신고가 & 거래량 3배 & 시총 3천억↑",
    plan: "BASIC",
    test: (ticker) => {
      const row = getLatestIndicatorRow(ticker);
      const mktcap = getLatestMarketCap(ticker);
      const near52wHigh = !Number.isNaN(row.high52w) && row.close >= row.high52w * 0.995;
      return near52wHigh && row.volRatio >= 3 && mktcap >= 300_000_000_000;
    },
  },
  {
    id: "dividend-value",
    name: "배당+저평가",
    condition: "PER<10 & PBR<1 & 배당수익률>3%",
    plan: "BASIC",
    test: (ticker) => {
      const f = getFundamentals(ticker);
      return f.per < 10 && f.pbr < 1 && f.dividendYield > 3;
    },
  },
];

export function runPreset(presetId: string) {
  const preset = SCREENER_PRESETS.find((p) => p.id === presetId);
  if (!preset) return { preset: null, results: [] as ReturnType<typeof buildResult>[] };
  const results = UNIVERSE.filter((s) => preset.test(s.ticker)).map((s) => buildResult(s.ticker));
  return { preset, results };
}

function buildResult(ticker: string) {
  const meta = findStock(ticker)!;
  const detail = getSignalDetail(ticker, 0)!;
  return {
    meta,
    score: detail.composed.score,
    grade: detail.composed.grade,
    changeRate: detail.price.changeRate,
  };
}
