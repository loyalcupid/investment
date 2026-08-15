// lib/data/mock.ts
// MVP 데모용 시세·수급 시뮬레이터. PRD 4장의 실제 파이프라인(KRX/pykrx/KIS)이 연결되기 전까지
// 결정적(seeded) 난수로 생성한 대체 데이터입니다 — 실제 시세가 아닙니다 (copy.ts DATA_SOURCE_NOTICE 참고).

import type { Bar } from "@/lib/signals/indicators";
import type { FlowRow } from "@/lib/signals/flow";
import { UNIVERSE, type StockMeta } from "./universe";

const TRADING_DAYS = 420;
const END_DATE = "2026-08-14"; // PRD 7.2 예시와 동일한 기준일

function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 평일만 골라 endDate 이전 n개 날짜를 오름차순으로 반환 */
function tradingDates(endDateStr: string, n: number): string[] {
  const end = new Date(endDateStr + "T00:00:00Z");
  const dates: string[] = [];
  const cursor = new Date(end);
  while (dates.length < n) {
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) {
      dates.push(cursor.toISOString().slice(0, 10));
    }
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return dates.reverse();
}

export interface SeriesBundle {
  ticker: string;
  bars: Bar[];
  flows: FlowRow[];
  marketCapSeries: number[]; // bars와 동일 길이
}

const cache = new Map<string, SeriesBundle>();

function genOne(meta: StockMeta): SeriesBundle {
  const rnd = mulberry32(hashSeed(meta.ticker));
  const dates = tradingDates(END_DATE, TRADING_DAYS);

  // 추세 구간을 여러 국면으로 나눠 사실적인 파동 생성 (상승/횡보/조정 반복 + trendBias로 종목별 색깔 부여)
  const dailyDriftBase = meta.trendBias * 0.0009;
  const vol = 0.014 + (1 - Math.abs(meta.trendBias)) * 0.006;

  let price = meta.basePrice * 0.72; // 420일 전 가격(추세 반영해 현재가와 basePrice 근처로 수렴하도록 역산)
  const bars: Bar[] = [];
  const marketCapSeries: number[] = [];

  // 국면 전환용 규제된 랜덤워크 (레짐 사이클)
  let regimeCycle = 0;
  let regimeLen = 30 + Math.floor(rnd() * 40);

  for (let i = 0; i < dates.length; i++) {
    if (regimeCycle >= regimeLen) {
      regimeCycle = 0;
      regimeLen = 25 + Math.floor(rnd() * 45);
    }
    regimeCycle++;
    const phaseWave = Math.sin((i / 55) * Math.PI + hashSeed(meta.ticker) % 7) * 0.0016;
    const noise = (rnd() - 0.5) * vol;
    const drift = dailyDriftBase + phaseWave;
    const changeRate = drift + noise;
    const prevClose = price;
    price = Math.max(price * (1 + changeRate), 100);

    const intraday = Math.abs(noise) + 0.004;
    const open = prevClose * (1 + (rnd() - 0.5) * intraday * 0.6);
    const high = Math.max(open, price) * (1 + rnd() * intraday * 0.5);
    const low = Math.min(open, price) * (1 - rnd() * intraday * 0.5);
    const baseVolume = (meta.sharesOut / 420) * (0.15 + rnd() * 0.5);
    const volSpike = rnd() > 0.94 ? 1.8 + rnd() * 2.2 : 1;
    const volume = Math.round(baseVolume * volSpike);
    const tradeValue = Math.round(volume * price);

    bars.push({
      date: dates[i],
      open: round2(open),
      high: round2(high),
      low: round2(low),
      close: round2(price),
      volume,
      adjClose: round2(price), // MVP 유니버스는 최근 420일 내 액면분할 없음으로 가정 → close=adjClose
    });
    marketCapSeries.push(Math.round(price * meta.sharesOut));
  }
  // tradeValue를 bars와 별도 보관하지 않고 flows에 포함 (아래)

  // 수급: 가격 추세와 약하게 상관된 외국인/기관 순매수 시뮬레이션 (5.3절 필드)
  const flows: FlowRow[] = [];
  let shortBalance = 1.0 + rnd() * 2.5;
  for (let i = 0; i < dates.length; i++) {
    const priceChange = i > 0 ? bars[i].close / bars[i - 1].close - 1 : 0;
    const trendSignal = Math.tanh(priceChange * 40) * 0.6 + meta.trendBias * 0.3;
    const mktcap = marketCapSeries[i];
    const frgnNet = Math.round(mktcap * 0.0009 * (trendSignal + (rnd() - 0.45)));
    const instNet = Math.round(mktcap * 0.0006 * (trendSignal + (rnd() - 0.5)));
    const indiNet = -(frgnNet + instNet) + Math.round(mktcap * 0.0002 * (rnd() - 0.5));
    const progNet = Math.round(mktcap * 0.0003 * (trendSignal + (rnd() - 0.5)));
    shortBalance = Math.max(0.2, Math.min(9, shortBalance + (rnd() - 0.5) * 0.35));

    flows.push({
      date: dates[i],
      frgnNet,
      instNet,
      indiNet,
      shortBalanceRatio: round2(shortBalance),
      progNet,
      tradeValue: Math.round(bars[i].volume * bars[i].close),
    });
  }

  return { ticker: meta.ticker, bars, flows, marketCapSeries };
}

function round2(v: number) {
  return Math.round(v * 100) / 100;
}

export function getSeries(ticker: string): SeriesBundle {
  const cached = cache.get(ticker);
  if (cached) return cached;
  const meta = UNIVERSE.find((s) => s.ticker === ticker);
  if (!meta) throw new Error(`Unknown ticker: ${ticker}`);
  const bundle = genOne(meta);
  cache.set(ticker, bundle);
  return bundle;
}

// KOSPI 종합지수 시뮬레이션 (시장 레짐 판정용, PRD 5.6)
let kospiCache: { dates: string[]; close: number[] } | null = null;
export function getKospiIndex(): { dates: string[]; close: number[] } {
  if (kospiCache) return kospiCache;
  const rnd = mulberry32(hashSeed("KOSPI_INDEX"));
  const dates = tradingDates(END_DATE, TRADING_DAYS);
  let idx = 2350;
  const close: number[] = [];
  for (let i = 0; i < dates.length; i++) {
    const wave = Math.sin(i / 70) * 0.0012;
    const noise = (rnd() - 0.48) * 0.009;
    idx = Math.max(idx * (1 + wave + noise), 1000);
    close.push(round2(idx));
  }
  kospiCache = { dates, close };
  return kospiCache;
}
