// lib/signals/exit.ts — PRD 5.8 매도(청산) 신호. 관심종목 진입가 기준 별도 규칙.

import type { ExitSignal } from "./types";

export interface ExitInput {
  entryPrice: number;
  close: number;
  atr: number;
  sma20: number;
  rsi: number;
  pctB: number;
  frgnSellStreak: number; // 외국인 연속 순매도 일수
  instSellStreak: number; // 기관 연속 순매도 일수
}

export function exitSignal(input: ExitInput): ExitSignal | null {
  const { entryPrice, close, atr, sma20, rsi, pctB, frgnSellStreak, instSellStreak } = input;
  const ret = (close - entryPrice) / entryPrice;

  if (close < entryPrice - 2.0 * atr) {
    return {
      code: "STOP_LOSS",
      label: "손절조건 도달",
      detail: `진입가 대비 ${(ret * 100).toFixed(1)}% (ATR 2배 이탈)`,
      severity: "HIGH",
    };
  }
  if (ret > 0.2 && close < sma20) {
    return {
      code: "PROFIT_PROTECT",
      label: "이익보전조건",
      detail: "20% 이상 상승 후 20일선 이탈",
      severity: "HIGH",
    };
  }
  if (rsi > 75 && pctB > 0.95) {
    return {
      code: "OVERHEAT_EXIT",
      label: "과열조건",
      detail: "RSI·볼린저 동시 과열",
      severity: "MEDIUM",
    };
  }
  // 외국인·기관 동시 3일 이상 연속 순매도 + 아직 수익 구간
  if (Math.min(frgnSellStreak, instSellStreak) >= 3 && ret > 0) {
    return {
      code: "FLOW_EXIT",
      label: "수급이탈",
      detail: "외국인·기관 3일 연속 순매도",
      severity: "MEDIUM",
    };
  }
  return null;
}
