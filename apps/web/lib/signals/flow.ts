// lib/signals/flow.ts
// PRD 5.3 — L2 수급 레이어 (한국 시장 차별점). Python 원안을 그대로 TS로 이식.

import type { LayerResult, Reason } from "./types";

export interface FlowRow {
  date: string;
  frgnNet: number; // 외국인 순매수대금(원)
  instNet: number; // 기관 순매수대금(원)
  indiNet: number; // 개인 순매수대금(원)
  shortBalanceRatio: number; // 공매도 잔고비율(%)
  progNet: number; // 프로그램 순매수(원)
  tradeValue: number; // 거래대금(원)
}

function R(code: string, label: string, detail: string, delta: number): Reason {
  return { code, label, detail, delta, layer: "FLOW" };
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

/** 배열 끝에서부터 연속 양수(>0) 개수 */
function consecutivePositive(values: number[]): number {
  let count = 0;
  for (let i = values.length - 1; i >= 0; i--) {
    if (values[i] > 0) count++;
    else break;
  }
  return count;
}
function consecutiveNegative(values: number[]): number {
  let count = 0;
  for (let i = values.length - 1; i >= 0; i--) {
    if (values[i] < 0) count++;
    else break;
  }
  return count;
}

/**
 * rows: 오름차순 일별 수급 데이터 (최소 20행 권장), 마지막 행이 평가 기준일
 * mktcap: 시가총액(원)
 */
export function scoreFlow(rows: FlowRow[], mktcap: number): LayerResult {
  if (rows.length < 6 || !mktcap) {
    return { score: 0, reasons: [], gateFailed: true, gateReason: "DATA_MISSING" };
  }
  const cur = rows[rows.length - 1];
  let r = 0;
  const reasons: Reason[] = [];

  const frgnSeries = rows.map((x) => x.frgnNet);
  const instSeries = rows.map((x) => x.instNet);

  // 1) 연속 순매수 일수 (최대 ±25)
  const frgnStreak = consecutivePositive(frgnSeries);
  const instStreak = consecutivePositive(instSeries);
  if (frgnStreak >= 5) {
    r += 15;
    reasons.push(R("FRGN_STREAK", "외국인 연속 순매수", `${frgnStreak}일 연속`, 15));
  } else if (frgnStreak >= 3) {
    r += 8;
  }
  if (instStreak >= 5) {
    r += 10;
    reasons.push(R("INST_STREAK", "기관 연속 순매수", `${instStreak}일 연속`, 10));
  } else if (instStreak >= 3) {
    r += 5;
  }

  const frgnSellStreak = consecutiveNegative(frgnSeries);
  if (frgnSellStreak >= 5) {
    r -= 15;
    reasons.push(R("FRGN_SELL_STREAK", "외국인 연속 순매도", `${frgnSellStreak}일 연속`, -15));
  }

  // 2) 순매수 강도 = 5일 누적 순매수 / 시가총액 (최대 ±30)
  const last5Frgn = frgnSeries.slice(-5).reduce((a, b) => a + b, 0);
  const last5Inst = instSeries.slice(-5).reduce((a, b) => a + b, 0);
  const intensity = (last5Frgn + last5Inst) / mktcap;
  if (intensity > 0.01) {
    r += 30;
    reasons.push(R("FLOW_STRONG", "수급 강함", `5일 순매수 시총대비 ${(intensity * 100).toFixed(2)}%`, 30));
  } else if (intensity > 0.003) {
    r += 15;
    reasons.push(R("FLOW_GOOD", "수급 양호", `5일 순매수 시총대비 ${(intensity * 100).toFixed(2)}%`, 15));
  } else if (intensity < -0.01) {
    r -= 30;
    reasons.push(R("FLOW_EXIT", "수급 이탈", `5일 순매도 시총대비 ${(intensity * 100).toFixed(2)}%`, -30));
  } else if (intensity < -0.003) {
    r -= 15;
  }

  // 3) 쌍끌이 (외국인+기관 동시 순매수) 보너스 (+20)
  const last3 = rows.slice(-3);
  const both = last3.filter((x) => x.frgnNet > 0 && x.instNet > 0).length;
  if (both === 3) {
    r += 20;
    reasons.push(R("DUAL_BUY", "쌍끌이 매수", "외국인·기관 3일 동시 순매수", 20));
  }

  // 4) 공매도 잔고 (최대 ±15)
  const sbIdx = rows.length - 6;
  if (sbIdx >= 0) {
    const sbChg = cur.shortBalanceRatio - rows[sbIdx].shortBalanceRatio;
    if (cur.shortBalanceRatio > 3.0 && sbChg > 0.5) {
      r -= 15;
      reasons.push(R("SHORT_UP", "공매도 증가", `잔고비율 ${cur.shortBalanceRatio.toFixed(1)}%`, -15));
    } else if (cur.shortBalanceRatio > 3.0 && sbChg < -0.5) {
      r += 10;
      reasons.push(R("SHORT_COVER", "숏커버링 가능성", "공매도 잔고 감소 중", 10));
    }
  }

  // 5) 거래대금 유동성 필터 (스코어 아닌 게이트) — 20일 평균 5억 미만
  const tradeValues = rows.map((x) => x.tradeValue).slice(-20);
  const avgTradeValue = tradeValues.reduce((a, b) => a + b, 0) / tradeValues.length;
  if (avgTradeValue < 500_000_000) {
    return {
      score: 0,
      reasons: [R("LOW_LIQUIDITY", "유동성 부족", "거래대금 과소로 신호 미산출", 0)],
      gateFailed: true,
      gateReason: "LOW_LIQUIDITY",
    };
  }

  return { score: clamp(r, -100, 100), reasons };
}
