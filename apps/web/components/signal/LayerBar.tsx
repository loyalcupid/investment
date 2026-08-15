import type { LayerScoreOut } from "@/lib/signals/composer";

const LAYER_LABEL: Record<string, string> = {
  TECH: "기술적",
  FLOW: "수급",
  EVENT: "이벤트",
  MODEL: "ML",
};
const LOCKED_NOTE: Record<string, string> = {
  EVENT: "Phase 2 예정",
  MODEL: "Phase 3 예정",
};

export function LayerBar({ layer }: { layer: LayerScoreOut }) {
  const label = LAYER_LABEL[layer.layer] ?? layer.layer;

  if (layer.score == null) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="w-12 shrink-0 text-neutral-500">{label}</span>
        <div className="h-2.5 flex-1 rounded-full bg-neutral-100 dark:bg-neutral-800" />
        <span className="w-24 shrink-0 text-right text-xs text-neutral-400">
          {LOCKED_NOTE[layer.layer] ?? "미제공"}
        </span>
      </div>
    );
  }

  const pct = Math.max(0, Math.min(100, (layer.score + 100) / 2));
  const positive = layer.score >= 0;

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-12 shrink-0 text-neutral-500">{label}</span>
      <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
        <div
          className={`absolute top-0 h-full rounded-full ${positive ? "bg-up" : "bg-down"}`}
          style={{
            left: positive ? "50%" : `${pct}%`,
            width: `${Math.abs(pct - 50)}%`,
          }}
        />
        <div className="absolute inset-y-0 left-1/2 w-px bg-neutral-300 dark:bg-neutral-700" />
      </div>
      <span className={`w-14 shrink-0 text-right font-medium tabular-nums ${positive ? "text-up" : "text-down"}`}>
        {positive ? "+" : ""}
        {Math.round(layer.score)}
      </span>
    </div>
  );
}
