// lib/signals/types.ts

export type LayerName = "TECH" | "FLOW" | "EVENT" | "MODEL";

export interface Reason {
  code: string;
  label: string;
  detail: string;
  delta: number;
  layer: LayerName;
}

export interface LayerResult {
  score: number; // -100 ~ 100
  reasons: Reason[];
  gateFailed?: boolean;
  gateReason?: string;
}

export type Regime = "BULL" | "NEUTRAL" | "BEAR";

export interface ExitSignal {
  code: string;
  label: string;
  detail: string;
  severity: "HIGH" | "MEDIUM";
}
