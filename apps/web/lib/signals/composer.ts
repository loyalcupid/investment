// lib/signals/composer.ts — PRD 5.7 최종 합성 및 등급
// MVP(Phase 1) 범위: L1(기술적, 0.60) + L2(수급, 0.40)만 사용. L3(이벤트)·L4(ML) 가중 0 (PRD 5.1).

import { gradeFromScore, type Grade } from "@/lib/constants/copy";
import { REGIME_ADJ, type RegimeInputRow, marketRegime } from "./regime";
import type { LayerResult, Reason, Regime } from "./types";

export const LAYER_WEIGHTS = { TECH: 0.6, FLOW: 0.4 } as const;

export interface LayerScoreOut {
  layer: "TECH" | "FLOW" | "EVENT" | "MODEL";
  score: number | null;
  weight: number;
  locked?: boolean;
}

export interface SignalComposed {
  score: number; // 0~100
  grade: Grade;
  layers: LayerScoreOut[];
  reasons: Reason[];
  regime: Regime;
  gateFailed: boolean;
  gateReason?: string;
  narrativeKo: string;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export function composeSignal(
  tech: LayerResult,
  flow: LayerResult,
  regimeRow: RegimeInputRow
): SignalComposed {
  const regime = marketRegime(regimeRow);

  if (tech.gateFailed || flow.gateFailed) {
    const gateReason = tech.gateFailed ? tech.gateReason : flow.gateReason;
    return {
      score: 0,
      grade: "C",
      layers: [
        { layer: "TECH", score: tech.gateFailed ? null : tech.score, weight: LAYER_WEIGHTS.TECH },
        { layer: "FLOW", score: flow.gateFailed ? null : flow.score, weight: LAYER_WEIGHTS.FLOW },
        { layer: "EVENT", score: null, weight: 0, locked: true },
        { layer: "MODEL", score: null, weight: 0, locked: true },
      ],
      reasons: [...tech.reasons, ...flow.reasons],
      regime,
      gateFailed: true,
      gateReason,
      narrativeKo: "",
    };
  }

  const w1 = LAYER_WEIGHTS.TECH;
  const w2 = LAYER_WEIGHTS.FLOW;
  const raw = (w1 * tech.score + w2 * flow.score) / (w1 + w2);
  const adjFactor = raw > 0 ? REGIME_ADJ[regime].buy : REGIME_ADJ[regime].sell;
  const adj = raw * adjFactor;
  const score = Math.round((clamp(adj, -100, 100) + 100) / 2);
  const grade = gradeFromScore(score);

  const reasons = [...tech.reasons, ...flow.reasons].sort(
    (a, b) => Math.abs(b.delta) - Math.abs(a.delta)
  );

  return {
    score,
    grade,
    layers: [
      { layer: "TECH", score: tech.score, weight: w1 },
      { layer: "FLOW", score: flow.score, weight: w2 },
      { layer: "EVENT", score: null, weight: 0, locked: true },
      { layer: "MODEL", score: null, weight: 0, locked: true },
    ],
    reasons,
    regime,
    gateFailed: false,
    narrativeKo: buildNarrative(reasons, grade, regime),
  };
}

/**
 * 해설은 산출된 근거(reasons) 리스트 내에서만 생성 — 새로운 사실을 만들지 않음 (PRD 14장 리스크 대응).
 * MVP에서는 LLM 호출 없이 규칙 기반 템플릿으로 상위 근거를 요약. Phase 2에서 5.4.2 스펙대로 LLM 연동.
 */
function buildNarrative(reasons: Reason[], grade: Grade, regime: Regime): string {
  if (reasons.length === 0) {
    return "현재 뚜렷한 기술적·수급 근거가 관측되지 않아 중립 구간으로 판단됩니다.";
  }
  const positives = reasons.filter((r) => r.delta > 0).slice(0, 2);
  const negatives = reasons.filter((r) => r.delta < 0).slice(0, 1);

  const parts: string[] = [];
  if (positives.length > 0) {
    parts.push(positives.map((r) => r.detail).join(", ") + "가 확인됩니다");
  }
  if (negatives.length > 0) {
    parts.push(`다만 ${negatives.map((r) => r.detail).join(", ")}로 주의가 필요합니다`);
  }
  const regimeNote =
    regime === "BEAR"
      ? " 현재 시장 전반이 약세 국면이라 매수 관련 근거는 신호에 낮은 가중치로 반영되었습니다."
      : regime === "BULL"
        ? " 현재 시장 전반이 강세 국면입니다."
        : "";

  return parts.join(". ") + "." + regimeNote;
}
