// src/lib/constants/copy.ts
// PRD 3.3절 — UI 문구는 절대 하드코딩 금지, 이 파일만 사용.
// "매수/매도하세요" 같은 지시형 표현 금지 → 정보 제공형 표현만 사용.

export const SIGNAL_LABEL = {
  90: "매수조건 강하게 충족",
  70: "매수조건 충족",
  55: "매수조건 일부 충족",
  45: "중립 구간",
  30: "매도조건 일부 충족",
  10: "매도조건 충족",
} as const;

export const DISCLAIMER = {
  GLOBAL:
    "본 서비스가 제공하는 정보는 투자 참고자료이며, 투자 권유 또는 종목 추천이 아닙니다. 모든 투자 판단과 그 결과에 대한 책임은 이용자 본인에게 있습니다.",
  BACKTEST:
    "아래 성과는 과거 데이터에 기반한 시뮬레이션 결과이며, 실제 매매 수익을 보장하지 않습니다. 미래 수익률과 무관합니다.",
  ML: "예측 확률은 통계 모델의 산출값이며 적중을 보장하지 않습니다.",
} as const;

export type Grade = "S" | "A" | "B" | "C" | "D" | "E";

export const GRADE_META: Record<
  Grade,
  { range: [number, number]; label: string; color: string }
> = {
  S: { range: [80, 100], label: "매수조건 강하게 충족", color: "#0F7B3E" },
  A: { range: [65, 79], label: "매수조건 충족", color: "#2E9E5B" },
  B: { range: [55, 64], label: "매수조건 일부 충족", color: "#7FB77E" },
  C: { range: [45, 54], label: "중립 구간", color: "#8A8F98" },
  D: { range: [35, 44], label: "매도조건 일부 충족", color: "#D98F6B" },
  E: { range: [0, 34], label: "매도조건 충족", color: "#C2472F" },
};

export function gradeFromScore(score: number): Grade {
  if (score >= 80) return "S";
  if (score >= 65) return "A";
  if (score >= 55) return "B";
  if (score >= 45) return "C";
  if (score >= 35) return "D";
  return "E";
}

export const GATE_REASON_LABEL: Record<string, string> = {
  MANAGED: "관리종목으로 지정되어 신호를 산출하지 않습니다.",
  SUSPENDED: "거래정지 종목으로 신호를 산출하지 않습니다.",
  LOW_LIQUIDITY: "거래대금 과소로 신호를 산출하지 않습니다.",
  NEW_LISTING: "상장 60영업일 미만으로 신호를 산출하지 않습니다.",
  DATA_MISSING: "데이터 결측으로 신호를 산출하지 않습니다.",
};

export const REGIME_LABEL: Record<"BULL" | "NEUTRAL" | "BEAR", string> = {
  BULL: "강세장",
  NEUTRAL: "중립장",
  BEAR: "약세장",
};

// MVP 데이터 출처 고지 — 실제 KRX/KIS 파이프라인 연결 전까지 노출
export const DATA_SOURCE_NOTICE =
  "현재 화면의 시세·수급 데이터는 MVP 데모용 시뮬레이션 데이터입니다. 실제 KRX·한국투자증권 데이터 연동 전까지 실제 시세와 다를 수 있습니다.";
