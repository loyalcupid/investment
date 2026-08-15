// lib/backtest/costs.ts — PRD 6.2 비용 모델 (2026년 기준). 세율 개정 대응을 위해 상수를 분리.

export const BUY_COST = 0.00015; // 위탁수수료 0.015%
export const TAX_KOSPI = 0.0005 + 0.0015; // 증권거래세 0.05% + 농특세 0.15% = 0.20%
export const TAX_KOSDAQ = 0.002; // 0.20% (농특세 미부과)
export const SLIPPAGE = 0.0015; // 시장가 슬리피지 가정 0.15%

export function sellCost(market: "KOSPI" | "KOSDAQ"): number {
  return BUY_COST + (market === "KOSPI" ? TAX_KOSPI : TAX_KOSDAQ);
}

/** 왕복 비용(매수+매도+세금+슬리피지 근사치, 약 0.5~0.6%) */
export function roundTripCost(market: "KOSPI" | "KOSDAQ"): number {
  return BUY_COST + sellCost(market) + SLIPPAGE;
}
