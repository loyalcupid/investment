// lib/signals/indicators.ts
// PRD 5.2.1 계산식의 TypeScript 이식. 입력은 반드시 수정주가(adjClose) 기준.
// pandas 방식(rolling/ewm)과 동일한 결과가 나오도록 구현. 워밍업 구간은 NaN.

export interface Bar {
  date: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number; // 원가
  volume: number;
  adjClose: number; // 수정주가 — 지표 계산 기준
}

export interface IndicatorRow {
  date: string;
  close: number; // adjClose
  sma5: number;
  sma20: number;
  sma60: number;
  sma120: number;
  ema12: number;
  ema26: number;
  rsi: number;
  macd: number;
  macdSignal: number;
  macdHist: number;
  bbMid: number;
  bbUpper: number;
  bbLower: number;
  pctB: number;
  bandwidth: number;
  stochK: number;
  stochD: number;
  atr: number;
  obv: number;
  disparity20: number;
  disparity60: number;
  volRatio: number;
  high52w: number;
  low52w: number;
}

const NA = NaN;

export function sma(values: number[], n: number): number[] {
  const out = new Array(values.length).fill(NA);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= n) sum -= values[i - n];
    if (i >= n - 1) out[i] = sum / n;
  }
  return out;
}

// pandas ewm(span=n, adjust=False)
export function ema(values: number[], n: number): number[] {
  const out = new Array(values.length).fill(NA);
  const alpha = 2 / (n + 1);
  let prev = NA;
  for (let i = 0; i < values.length; i++) {
    if (Number.isNaN(prev)) {
      prev = values[i];
    } else {
      prev = alpha * values[i] + (1 - alpha) * prev;
    }
    out[i] = prev;
  }
  return out;
}

// pandas ewm(alpha=1/n, adjust=False) — Wilder 방식
function wilderEwm(values: number[], n: number): number[] {
  const out = new Array(values.length).fill(NA);
  const alpha = 1 / n;
  let prev = NA;
  for (let i = 0; i < values.length; i++) {
    if (Number.isNaN(prev)) {
      prev = values[i];
    } else {
      prev = alpha * values[i] + (1 - alpha) * prev;
    }
    out[i] = prev;
  }
  return out;
}

export function rsiWilder(close: number[], period = 14): number[] {
  const n = close.length;
  const delta = new Array(n).fill(NA);
  for (let i = 1; i < n; i++) delta[i] = close[i] - close[i - 1];
  const gain = delta.map((d) => (Number.isNaN(d) ? NA : Math.max(d, 0)));
  const loss = delta.map((d) => (Number.isNaN(d) ? NA : Math.max(-d, 0)));
  // ewm 계산 시 첫 값(NaN)은 0으로 취급 (pandas와 동일하게 diff 첫 항만 NaN)
  const gain0 = gain.map((v) => (Number.isNaN(v) ? 0 : v));
  const loss0 = loss.map((v) => (Number.isNaN(v) ? 0 : v));
  const avgGain = wilderEwm(gain0.slice(1), period);
  const avgLoss = wilderEwm(loss0.slice(1), period);
  const out = new Array(n).fill(NA);
  for (let i = 0; i < avgGain.length; i++) {
    const ag = avgGain[i];
    const al = avgLoss[i];
    const rs = al === 0 ? Infinity : ag / al;
    out[i + 1] = al === 0 && ag === 0 ? 50 : 100 - 100 / (1 + rs);
  }
  return out;
}

export function macd(
  close: number[],
  fast = 12,
  slow = 26,
  signalN = 9
): { macd: number[]; signal: number[]; hist: number[]; ema12: number[]; ema26: number[] } {
  const emaFast = ema(close, fast);
  const emaSlow = ema(close, slow);
  const macdLine = close.map((_, i) => emaFast[i] - emaSlow[i]);
  const signal = ema(macdLine, signalN);
  const hist = macdLine.map((v, i) => v - signal[i]);
  return { macd: macdLine, signal, hist, ema12: emaFast, ema26: emaSlow };
}

export function bollinger(close: number[], n = 20, k = 2) {
  const mid = sma(close, n);
  const std = new Array(close.length).fill(NA);
  for (let i = n - 1; i < close.length; i++) {
    const window = close.slice(i - n + 1, i + 1);
    const mean = window.reduce((a, b) => a + b, 0) / n;
    const variance = window.reduce((a, b) => a + (b - mean) ** 2, 0) / n; // ddof=0
    std[i] = Math.sqrt(variance);
  }
  const upper = close.map((_, i) => mid[i] + k * std[i]);
  const lower = close.map((_, i) => mid[i] - k * std[i]);
  const pctB = close.map((c, i) => (c - lower[i]) / (upper[i] - lower[i]));
  const bandwidth = close.map((_, i) => (upper[i] - lower[i]) / mid[i]);
  return { mid, upper, lower, pctB, bandwidth };
}

export function stochasticSlow(
  high: number[],
  low: number[],
  close: number[],
  period = 14,
  smoothK = 3,
  smoothD = 3
) {
  const n = close.length;
  const kFast = new Array(n).fill(NA);
  for (let i = period - 1; i < n; i++) {
    const hh = Math.max(...high.slice(i - period + 1, i + 1));
    const ll = Math.min(...low.slice(i - period + 1, i + 1));
    kFast[i] = hh === ll ? 50 : (100 * (close[i] - ll)) / (hh - ll);
  }
  const kSlow = sma(kFast, smoothK);
  const d = sma(kSlow, smoothD);
  return { k: kSlow, d };
}

export function atrWilder(high: number[], low: number[], close: number[], period = 14): number[] {
  const n = close.length;
  const tr = new Array(n).fill(NA);
  for (let i = 0; i < n; i++) {
    if (i === 0) {
      tr[i] = high[i] - low[i];
    } else {
      tr[i] = Math.max(
        high[i] - low[i],
        Math.abs(high[i] - close[i - 1]),
        Math.abs(low[i] - close[i - 1])
      );
    }
  }
  return wilderEwm(tr, period);
}

export function obv(close: number[], volume: number[]): number[] {
  const out = new Array(close.length).fill(0);
  for (let i = 1; i < close.length; i++) {
    const sign = close[i] > close[i - 1] ? 1 : close[i] < close[i - 1] ? -1 : 0;
    out[i] = out[i - 1] + sign * volume[i];
  }
  return out;
}

export function disparity(close: number[], smaN: number[]): number[] {
  return close.map((c, i) => (100 * c) / smaN[i]);
}

export function volRatio(volume: number[], n = 20): number[] {
  const avg = sma(volume, n);
  return volume.map((v, i) => v / avg[i]);
}

export function rollingMax(values: number[], n: number): number[] {
  const out = new Array(values.length).fill(NA);
  for (let i = 0; i < values.length; i++) {
    if (i >= n - 1) out[i] = Math.max(...values.slice(i - n + 1, i + 1));
  }
  return out;
}
export function rollingMin(values: number[], n: number): number[] {
  const out = new Array(values.length).fill(NA);
  for (let i = 0; i < values.length; i++) {
    if (i >= n - 1) out[i] = Math.min(...values.slice(i - n + 1, i + 1));
  }
  return out;
}

/** 배열 끝 n개 구간의 분위수만 계산 (전체 롤링 배열보다 훨씬 저렴 — 반복 호출용) */
export function quantileOfTrailingWindow(values: number[], n: number, q: number): number {
  if (values.length < n) return NA;
  const window = values
    .slice(values.length - n)
    .filter((v) => !Number.isNaN(v))
    .sort((a, b) => a - b);
  if (window.length === 0) return NA;
  const pos = q * (window.length - 1);
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return window[lo] + (window[hi] - window[lo]) * (pos - lo);
}

// bandwidth의 120일 롤링 15% 분위수 (스퀴즈 판정용, 5.2.2절)
export function rollingQuantile(values: number[], n: number, q: number): number[] {
  const out = new Array(values.length).fill(NA);
  for (let i = 0; i < values.length; i++) {
    if (i >= n - 1) {
      const window = values
        .slice(i - n + 1, i + 1)
        .filter((v) => !Number.isNaN(v))
        .sort((a, b) => a - b);
      if (window.length === 0) continue;
      const pos = q * (window.length - 1);
      const lo = Math.floor(pos);
      const hi = Math.ceil(pos);
      out[i] = window[lo] + (window[hi] - window[lo]) * (pos - lo);
    }
  }
  return out;
}

/** 최소 250행 권장 (52주 신고가 계산 등을 위해). df.iloc[-1] 기준 마지막 행이 평가일. */
export function computeIndicators(bars: Bar[]): IndicatorRow[] {
  const close = bars.map((b) => b.adjClose);
  const high = bars.map((b) => b.high * (b.adjClose / b.close || 1));
  const low = bars.map((b) => b.low * (b.adjClose / b.close || 1));
  const volume = bars.map((b) => b.volume);

  const sma5 = sma(close, 5);
  const sma20 = sma(close, 20);
  const sma60 = sma(close, 60);
  const sma120 = sma(close, 120);
  const rsi = rsiWilder(close, 14);
  const { macd: macdLine, signal, hist, ema12, ema26 } = macd(close, 12, 26, 9);
  const bb = bollinger(close, 20, 2);
  const stoch = stochasticSlow(high, low, close, 14, 3, 3);
  const atr = atrWilder(high, low, close, 14);
  const obvArr = obv(close, volume);
  const disp20 = disparity(close, sma20);
  const disp60 = disparity(close, sma60);
  const vr = volRatio(volume, 20);
  const hi52 = rollingMax(high, 252);
  const lo52 = rollingMin(low, 252);

  return bars.map((b, i) => ({
    date: b.date,
    close: close[i],
    sma5: sma5[i],
    sma20: sma20[i],
    sma60: sma60[i],
    sma120: sma120[i],
    ema12: ema12[i],
    ema26: ema26[i],
    rsi: rsi[i],
    macd: macdLine[i],
    macdSignal: signal[i],
    macdHist: hist[i],
    bbMid: bb.mid[i],
    bbUpper: bb.upper[i],
    bbLower: bb.lower[i],
    pctB: bb.pctB[i],
    bandwidth: bb.bandwidth[i],
    stochK: stoch.k[i],
    stochD: stoch.d[i],
    atr: atr[i],
    obv: obvArr[i],
    disparity20: disp20[i],
    disparity60: disp60[i],
    volRatio: vr[i],
    high52w: hi52[i],
    low52w: lo52[i],
  }));
}
