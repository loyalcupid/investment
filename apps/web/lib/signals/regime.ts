// lib/signals/regime.ts — PRD 5.6 시장 레짐 보정

import type { Regime } from "./types";

export interface RegimeInputRow {
  close: number;
  sma20: number;
  sma60: number;
  sma120: number;
}

export function marketRegime(row: RegimeInputRow): Regime {
  if (row.close > row.sma120 && row.sma20 > row.sma60) return "BULL";
  if (row.close < row.sma120 && row.sma20 < row.sma60) return "BEAR";
  return "NEUTRAL";
}

export const REGIME_ADJ: Record<Regime, { buy: number; sell: number }> = {
  BULL: { buy: 1.1, sell: 0.9 },
  NEUTRAL: { buy: 1.0, sell: 1.0 },
  BEAR: { buy: 0.7, sell: 1.2 }, // 하락장에선 매수신호 30% 감쇠
};
