// lib/signals/technical.ts
// PRD 5.2.2 — L1 기술적 레이어 룰 조합. Python 원안을 그대로 TS로 이식.

import { quantileOfTrailingWindow } from "./indicators";
import type { IndicatorRow } from "./indicators";
import type { LayerResult, Reason } from "./types";

function R(code: string, label: string, detail: string, delta: number): Reason {
  return { code, label, detail, delta, layer: "TECH" };
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * rows: 최소 250행의 일봉 지표 배열 (오름차순, 마지막 행이 평가 기준일)
 */
export function scoreTechnical(rows: IndicatorRow[]): LayerResult {
  if (rows.length < 61) {
    return { score: 0, reasons: [], gateFailed: true, gateReason: "DATA_MISSING" };
  }
  const cur = rows[rows.length - 1];
  const prev = rows[rows.length - 2];
  let r = 0;
  const reasons: Reason[] = [];

  // --- 추세 (최대 ±35) ---
  if (cur.sma5 > cur.sma20 && cur.sma20 > cur.sma60) {
    r += 20;
    reasons.push(R("TREND_ALIGN_UP", "정배열", "5·20·60일선 정배열 상태", 20));
  } else if (cur.sma5 < cur.sma20 && cur.sma20 < cur.sma60) {
    r -= 20;
    reasons.push(R("TREND_ALIGN_DOWN", "역배열", "5·20·60일선 역배열 상태", -20));
  }

  if (prev.sma5 <= prev.sma20 && cur.sma5 > cur.sma20) {
    r += 15;
    reasons.push(R("GOLDEN_CROSS", "골든크로스", "5일선이 20일선을 상향 돌파", 15));
  }
  if (prev.sma5 >= prev.sma20 && cur.sma5 < cur.sma20) {
    r -= 15;
    reasons.push(R("DEAD_CROSS", "데드크로스", "5일선이 20일선을 하향 돌파", -15));
  }

  // --- 모멘텀 (최대 ±30) ---
  if (prev.macd <= prev.macdSignal && cur.macd > cur.macdSignal) {
    r += 15;
    reasons.push(R("MACD_UP", "MACD 상향교차", "MACD가 시그널선 상향 돌파", 15));
  }
  if (prev.macd >= prev.macdSignal && cur.macd < cur.macdSignal) {
    r -= 15;
    reasons.push(R("MACD_DOWN", "MACD 하향교차", "MACD가 시그널선 하향 돌파", -15));
  }

  if (cur.rsi < 30) {
    r += 15;
    reasons.push(R("RSI_OVERSOLD", "RSI 과매도", `RSI ${cur.rsi.toFixed(0)} (30 미만)`, 15));
  } else if (cur.rsi > 70) {
    r -= 15;
    reasons.push(R("RSI_OVERBOUGHT", "RSI 과매수", `RSI ${cur.rsi.toFixed(0)} (70 초과)`, -15));
  } else if (cur.rsi >= 45 && cur.rsi <= 60 && cur.rsi > prev.rsi) {
    r += 5;
    reasons.push(R("RSI_TURN_UP", "RSI 상승", "중립권에서 상승 전환", 5));
  }

  // --- 변동성/위치 (최대 ±20) ---
  if (cur.pctB < 0.05) {
    r += 10;
    reasons.push(R("BB_LOWER", "밴드 하단", "볼린저밴드 하단 이탈", 10));
  } else if (cur.pctB > 0.95) {
    r -= 10;
    reasons.push(R("BB_UPPER", "밴드 상단", "볼린저밴드 상단 접근", -10));
  }

  const bandwidths = rows.map((row) => row.bandwidth);
  const bw20 = quantileOfTrailingWindow(bandwidths, 120, 0.15);
  if (!Number.isNaN(bw20) && prev.bandwidth < bw20 && cur.bandwidth > prev.bandwidth * 1.15) {
    const d = cur.close > cur.sma20 ? 10 : -10;
    r += d;
    reasons.push(R("BB_EXPANSION", "밴드 확장", "변동성 수축 후 확장 시작", d));
  }

  // --- 거래량 확인 (최대 ±15) ---
  if (cur.volRatio > 2.0 && cur.close > prev.close) {
    r += 15;
    reasons.push(
      R("VOL_SURGE_UP", "대량 상승", `거래량 20일 평균 대비 ${cur.volRatio.toFixed(1)}배`, 15)
    );
  } else if (cur.volRatio > 2.0 && cur.close < prev.close) {
    r -= 15;
    reasons.push(R("VOL_SURGE_DOWN", "대량 하락", "거래량 급증 동반 하락", -15));
  }

  // --- 과열 필터 (5.2.2절, 스코어와 별도 강제 감쇠) ---
  if (cur.disparity20 > 115) {
    if (r > 20) {
      reasons.push(R("OVERHEAT_CAP", "과열 상한", "20일선 대비 +15% 이상, 매수 신호 상한 적용", 20 - r));
    }
    r = Math.min(r, 20);
  }
  if (cur.disparity20 > 125) {
    if (r > -10) {
      reasons.push(R("OVERHEAT_WARN", "과열 경계", "20일선 대비 +25% 이상, 경계 구간 강제 적용", -10 - r));
    }
    r = Math.min(r, -10);
  }

  return { score: clamp(r, -100, 100), reasons };
}
