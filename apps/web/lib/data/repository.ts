// lib/data/repository.ts
// 화면(app/*)에서 사용하는 데이터 접근 계층. MVP에서는 mock.ts의 시뮬레이션 시세/수급 위에
// signals/* 엔진(L1 기술적 + L2 수급)을 그대로 적용합니다. 실제 서비스에서는 이 계층이
// FastAPI(10장 API 명세)를 호출하는 형태로 교체됩니다.

import { computeIndicators, sma, type Bar, type IndicatorRow } from "@/lib/signals/indicators";
import { scoreTechnical } from "@/lib/signals/technical";
import { scoreFlow } from "@/lib/signals/flow";
import { composeSignal, type SignalComposed } from "@/lib/signals/composer";
import { marketRegime, type RegimeInputRow } from "@/lib/signals/regime";
import { exitSignal } from "@/lib/signals/exit";
import type { ExitSignal, Regime } from "@/lib/signals/types";
import type { Grade } from "@/lib/constants/copy";
import { roundTripCost } from "@/lib/backtest/costs";
import { getSeries, getKospiIndex } from "./mock";
import {
  UNIVERSE,
  THEMES,
  findStock,
  findTheme,
  themesOfStock,
  type StockMeta,
  type ThemeMeta,
} from "./universe";

const MIN_WARMUP = 130;

// ---------- 지표 캐시 ----------
const indicatorCache = new Map<string, IndicatorRow[]>();
function getIndicatorRows(ticker: string): IndicatorRow[] {
  let rows = indicatorCache.get(ticker);
  if (!rows) {
    rows = computeIndicators(getSeries(ticker).bars);
    indicatorCache.set(ticker, rows);
  }
  return rows;
}

let kospiRegimeRowsCache: RegimeInputRow[] | null = null;
function getKospiRegimeRows(): RegimeInputRow[] {
  if (kospiRegimeRowsCache) return kospiRegimeRowsCache;
  const idx = getKospiIndex();
  const sma20 = sma(idx.close, 20);
  const sma60 = sma(idx.close, 60);
  const sma120 = sma(idx.close, 120);
  kospiRegimeRowsCache = idx.close.map((close, i) => ({
    close,
    sma20: sma20[i],
    sma60: sma60[i],
    sma120: sma120[i],
  }));
  return kospiRegimeRowsCache;
}

function gatedComposed(reason: string): SignalComposed {
  return {
    score: 0,
    grade: "C",
    layers: [
      { layer: "TECH", score: null, weight: 0.6 },
      { layer: "FLOW", score: null, weight: 0.4 },
      { layer: "EVENT", score: null, weight: 0, locked: true },
      { layer: "MODEL", score: null, weight: 0, locked: true },
    ],
    reasons: [],
    regime: "NEUTRAL",
    gateFailed: true,
    gateReason: reason,
    narrativeKo: "",
  };
}

/** rows 인덱스 idx 시점의 합성 시그널 (idx=최근일수록 큼) */
function computeAtIndex(ticker: string, idx: number): SignalComposed | null {
  const rows = getIndicatorRows(ticker);
  if (idx < 0 || idx >= rows.length) return null;
  if (idx < MIN_WARMUP) return null;
  const bundle = getSeries(ticker);
  const techRows = rows.slice(0, idx + 1);
  const flowRows = bundle.flows.slice(0, idx + 1);
  const mktcap = bundle.marketCapSeries[idx];
  const tech = scoreTechnical(techRows);
  const flow = scoreFlow(flowRows, mktcap);
  const regimeRows = getKospiRegimeRows();
  return composeSignal(tech, flow, regimeRows[idx]);
}

export interface SignalDetailResult {
  ticker: string;
  meta: StockMeta;
  date: string;
  price: { close: number; changeRate: number; changeAmount: number };
  composed: SignalComposed;
  prevScore: number | null;
}

/** offset=0 → 최신 거래일, offset=1 → 하루 전 ... */
export function getSignalDetail(ticker: string, offset = 0): SignalDetailResult | null {
  const meta = findStock(ticker);
  if (!meta) return null;
  const rows = getIndicatorRows(ticker);
  const bundle = getSeries(ticker);
  const idx = rows.length - 1 - offset;
  if (idx < 0) return null;

  const composed = computeAtIndex(ticker, idx) ?? gatedComposed("NEW_LISTING");
  const prev = computeAtIndex(ticker, idx - 1);
  const bar = bundle.bars[idx];
  const prevBar = bundle.bars[idx - 1];
  const changeAmount = prevBar ? bar.close - prevBar.close : 0;
  const changeRate = prevBar ? (changeAmount / prevBar.close) * 100 : 0;

  return {
    ticker,
    meta,
    date: bar.date,
    price: { close: bar.close, changeRate, changeAmount },
    composed,
    prevScore: prev ? prev.score : null,
  };
}

export interface SignalHistoryPoint {
  date: string;
  score: number;
  grade: string;
}

export function getSignalHistory(ticker: string, days = 90): SignalHistoryPoint[] {
  const rows = getIndicatorRows(ticker);
  const out: SignalHistoryPoint[] = [];
  const start = Math.max(MIN_WARMUP, rows.length - days);
  for (let idx = start; idx < rows.length; idx++) {
    const composed = computeAtIndex(ticker, idx);
    if (!composed || composed.gateFailed) continue;
    out.push({ date: rows[idx].date, score: composed.score, grade: composed.grade });
  }
  return out;
}

// ---------- 종목 리스트 / 검색 ----------
export interface StockListItem {
  meta: StockMeta;
  score: number;
  grade: Grade;
  changeRate: number;
  gateFailed: boolean;
}

export function listStocks(params?: { market?: "KOSPI" | "KOSDAQ"; query?: string }): StockListItem[] {
  return UNIVERSE.filter((s) => {
    if (params?.market && s.market !== params.market) return false;
    if (params?.query && !s.nameKo.includes(params.query) && !s.ticker.includes(params.query)) return false;
    return true;
  }).map((meta) => {
    const detail = getSignalDetail(meta.ticker, 0)!;
    return {
      meta,
      score: detail.composed.score,
      grade: detail.composed.grade,
      changeRate: detail.price.changeRate,
      gateFailed: detail.composed.gateFailed,
    };
  });
}

export function getMovers(direction: "up" | "down", limit = 10) {
  const items = UNIVERSE.map((meta) => {
    const detail = getSignalDetail(meta.ticker, 0)!;
    const delta = detail.prevScore == null ? 0 : detail.composed.score - detail.prevScore;
    return { meta, score: detail.composed.score, delta, changeRate: detail.price.changeRate };
  }).filter((x) => !Number.isNaN(x.delta));

  items.sort((a, b) => (direction === "up" ? b.delta - a.delta : a.delta - b.delta));
  return items.slice(0, limit);
}

// ---------- 테마 ----------
export interface ThemeRankingItem {
  theme: ThemeMeta;
  score: number;
  momentum5d: number;
  memberCount: number;
  topTickers: { ticker: string; nameKo: string; score: number }[];
}

function themeScoreAtOffset(theme: ThemeMeta, offset: number): number {
  const memberScores = theme.members
    .map((ticker) => {
      const meta = findStock(ticker)!;
      const rows = getIndicatorRows(ticker);
      const idx = rows.length - 1 - offset;
      const composed = computeAtIndex(ticker, idx);
      if (!composed || composed.gateFailed) return null;
      const mktcap = getSeries(ticker).marketCapSeries[idx] ?? 1;
      return { score: composed.score, mktcap };
    })
    .filter((x): x is { score: number; mktcap: number } => x !== null)
    .sort((a, b) => b.score - a.score);

  if (memberScores.length === 0) return 50;
  const topCount = Math.max(1, Math.round(memberScores.length * 0.7));
  const top = memberScores.slice(0, topCount);
  const totalCap = top.reduce((a, b) => a + b.mktcap, 0);
  return top.reduce((a, b) => a + (b.score * b.mktcap) / totalCap, 0);
}

export function getThemeRanking(): ThemeRankingItem[] {
  const rows = THEMES.map((theme) => {
    const score = themeScoreAtOffset(theme, 0);
    const score5dAgo = themeScoreAtOffset(theme, 5);
    const topTickers = theme.members
      .map((ticker) => {
        const meta = findStock(ticker)!;
        const detail = getSignalDetail(ticker, 0)!;
        return { ticker, nameKo: meta.nameKo, score: detail.composed.score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    return {
      theme,
      score,
      momentum5d: score - score5dAgo,
      memberCount: theme.members.length,
      topTickers,
    };
  });
  return rows.sort(
    (a, b) => b.score * 0.6 + b.momentum5d * 4 - (a.score * 0.6 + a.momentum5d * 4)
  );
}

export function getThemeDetail(slug: string) {
  const theme = findTheme(slug);
  if (!theme) return null;
  const members = theme.members.map((ticker) => {
    const meta = findStock(ticker)!;
    const detail = getSignalDetail(ticker, 0)!;
    return { meta, score: detail.composed.score, grade: detail.composed.grade, changeRate: detail.price.changeRate };
  });
  members.sort((a, b) => b.score - a.score);
  const score = themeScoreAtOffset(theme, 0);
  const score5dAgo = themeScoreAtOffset(theme, 5);
  return { theme, members, score, momentum5d: score - score5dAgo };
}

// ---------- 시장 요약 ----------
export function getMarketSummary() {
  const kospi = getKospiIndex();
  const last = kospi.close.length - 1;
  const changeRate = ((kospi.close[last] - kospi.close[last - 1]) / kospi.close[last - 1]) * 100;
  const regimeRows = getKospiRegimeRows();
  const regime: Regime = marketRegime(regimeRows[last]);

  let frgnSum = 0;
  let instSum = 0;
  for (const meta of UNIVERSE) {
    const flows = getSeries(meta.ticker).flows;
    const cur = flows[flows.length - 1];
    frgnSum += cur.frgnNet;
    instSum += cur.instNet;
  }

  return {
    kospi: { close: kospi.close[last], changeRate, date: getSeries(UNIVERSE[0].ticker).bars.at(-1)!.date },
    regime,
    marketFrgnNet: frgnSum,
    marketInstNet: instSum,
  };
}

// ---------- 조건별 과거 성과 (7.2 하단 카드 / PRD 6장 백테스트 로직 축약판) ----------
export interface ConditionStats {
  sampleCount: number;
  winRate: number;
  avgGain: number;
  avgLoss: number;
  avgHoldingDays: number;
  maxDrawdown: number;
  periodFrom: string;
  periodTo: string;
  insufficientSample: boolean;
}

/**
 * 현재 등급(grade)과 동일한 등급이 과거에 발생했던 시점들을 찾아, 그 이후 보유 시
 * (등급이 바뀌거나 최대 10영업일까지) 수익률 분포를 집계합니다.
 * PRD 6.3(T+1 시가 체결) · 6.2(비용모델)을 단순화하여 반영한 MVP 근사치입니다.
 */
export function getConditionStats(ticker: string, grade: string): ConditionStats {
  const rows = getIndicatorRows(ticker);
  const bars = getSeries(ticker).bars;
  const meta = findStock(ticker)!;
  const cost = roundTripCost(meta.market);
  const maxHold = 10;

  const grades: (string | null)[] = new Array(rows.length).fill(null);
  for (let idx = MIN_WARMUP; idx < rows.length - 1; idx++) {
    const composed = computeAtIndex(ticker, idx);
    grades[idx] = composed && !composed.gateFailed ? composed.grade : null;
  }

  const trades: { ret: number; holdingDays: number; mdd: number }[] = [];
  for (let idx = MIN_WARMUP; idx < rows.length - 2; idx++) {
    if (grades[idx] !== grade) continue;
    // 직전 날 같은 등급이면 동일 사례 중복 계산 방지 (신규 진입 시점만 카운트)
    if (grades[idx - 1] === grade) continue;

    const entryIdx = idx + 1; // T+1 시가 체결 (6.3절)
    if (entryIdx >= bars.length) continue;
    const entryPrice = bars[entryIdx].open;
    let exitIdx = entryIdx;
    let peakDD = 0;
    for (let h = 1; h <= maxHold && idx + 1 + h < bars.length; h++) {
      exitIdx = idx + 1 + h;
      const cur = bars[exitIdx].close;
      const dd = (cur - entryPrice) / entryPrice;
      if (dd < peakDD) peakDD = dd;
      if (grades[idx + h] !== grade) break; // 등급 이탈 시 청산 가정
    }
    const exitPrice = bars[exitIdx].close;
    const ret = (exitPrice - entryPrice) / entryPrice - cost;
    trades.push({ ret, holdingDays: exitIdx - entryIdx + 1, mdd: peakDD });
  }

  if (trades.length < 5) {
    return {
      sampleCount: trades.length,
      winRate: 0,
      avgGain: 0,
      avgLoss: 0,
      avgHoldingDays: 0,
      maxDrawdown: 0,
      periodFrom: bars[MIN_WARMUP]?.date ?? "",
      periodTo: bars.at(-1)?.date ?? "",
      insufficientSample: true,
    };
  }

  const wins = trades.filter((t) => t.ret > 0);
  const losses = trades.filter((t) => t.ret <= 0);
  const avgGain = wins.length ? wins.reduce((a, b) => a + b.ret, 0) / wins.length : 0;
  const avgLoss = losses.length ? losses.reduce((a, b) => a + b.ret, 0) / losses.length : 0;
  const avgHoldingDays = trades.reduce((a, b) => a + b.holdingDays, 0) / trades.length;
  const maxDrawdown = Math.min(...trades.map((t) => t.mdd));

  return {
    sampleCount: trades.length,
    winRate: (wins.length / trades.length) * 100,
    avgGain: avgGain * 100,
    avgLoss: avgLoss * 100,
    avgHoldingDays,
    maxDrawdown: maxDrawdown * 100,
    periodFrom: bars[MIN_WARMUP]?.date ?? "",
    periodTo: bars.at(-1)?.date ?? "",
    insufficientSample: false,
  };
}

// ---------- 청산(매도) 신호 — 관심종목 진입가 기준 ----------
export function getExitSignal(ticker: string, entryPrice: number): ExitSignal | null {
  const rows = getIndicatorRows(ticker);
  const flows = getSeries(ticker).flows;
  const cur = rows.at(-1)!;
  const frgnSeries = flows.map((f) => f.frgnNet);
  const instSeries = flows.map((f) => f.instNet);
  const frgnSellStreak = trailingNegativeStreak(frgnSeries);
  const instSellStreak = trailingNegativeStreak(instSeries);

  return exitSignal({
    entryPrice,
    close: cur.close,
    atr: cur.atr,
    sma20: cur.sma20,
    rsi: cur.rsi,
    pctB: cur.pctB,
    frgnSellStreak,
    instSellStreak,
  });
}

function trailingNegativeStreak(values: number[]): number {
  let count = 0;
  for (let i = values.length - 1; i >= 0; i--) {
    if (values[i] < 0) count++;
    else break;
  }
  return count;
}

// ---------- 스크리너 프리셋에서 사용하는 보조 조회 함수 ----------
export function getLatestIndicatorRow(ticker: string): IndicatorRow {
  const rows = getIndicatorRows(ticker);
  return rows[rows.length - 1];
}

export function getLatestMarketCap(ticker: string): number {
  return getSeries(ticker).marketCapSeries.at(-1)!;
}

export function getAvgTradeValue20(ticker: string): number {
  const flows = getSeries(ticker).flows;
  const last20 = flows.slice(-20);
  return last20.reduce((a, b) => a + b.tradeValue, 0) / last20.length;
}

export function getConsecutivePositiveDays(ticker: string, field: "frgnNet" | "instNet", n: number): number {
  const flows = getSeries(ticker).flows.slice(-n);
  return flows.filter((f) => f[field] > 0).length;
}

// ---------- 차트용 데이터 ----------
export interface ChartBarOut {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma20: number | null;
  sma60: number | null;
}

export function getPriceChartData(ticker: string, days = 150): ChartBarOut[] {
  const bars = getSeries(ticker).bars;
  const rows = getIndicatorRows(ticker);
  const start = Math.max(0, bars.length - days);
  return bars.slice(start).map((b, i) => {
    const row = rows[start + i];
    return {
      date: b.date,
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
      volume: b.volume,
      sma20: Number.isNaN(row.sma20) ? null : row.sma20,
      sma60: Number.isNaN(row.sma60) ? null : row.sma60,
    };
  });
}

export interface FlowChartPoint {
  date: string;
  frgnNet: number;
  instNet: number;
  indiNet: number;
}

export function getFlowChartData(ticker: string, days = 20): FlowChartPoint[] {
  return getSeries(ticker)
    .flows.slice(-days)
    .map((f) => ({ date: f.date, frgnNet: f.frgnNet, instNet: f.instNet, indiNet: f.indiNet }));
}

/** 표시 구간 내 등급 전환 시점 (차트 마커용) */
export function getGradeTransitionMarkers(ticker: string, days = 150) {
  const history = getSignalHistory(ticker, days);
  const markers: { date: string; text: string; positive: boolean }[] = [];
  for (let i = 1; i < history.length; i++) {
    if (history[i].grade !== history[i - 1].grade) {
      markers.push({
        date: history[i].date,
        text: `${history[i - 1].grade}→${history[i].grade}`,
        positive: history[i].score > history[i - 1].score,
      });
    }
  }
  return markers;
}

export { UNIVERSE, THEMES, findStock, findTheme, themesOfStock };
export type { StockMeta, ThemeMeta };
export type { Bar };
