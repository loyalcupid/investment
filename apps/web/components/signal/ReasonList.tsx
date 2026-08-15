import type { Reason } from "@/lib/signals/types";

const LAYER_LABEL: Record<string, string> = { TECH: "기술적", FLOW: "수급", EVENT: "이벤트", MODEL: "ML" };

export function ReasonList({ reasons }: { reasons: Reason[] }) {
  if (reasons.length === 0) {
    return <p className="text-sm text-neutral-500">현재 뚜렷하게 관측된 근거가 없습니다.</p>;
  }
  return (
    <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
      {reasons.map((r, i) => {
        const positive = r.delta > 0;
        const icon = r.delta === 0 ? "ℹ️" : positive ? "✅" : "⚠️";
        return (
          <li key={`${r.code}-${i}`} className="flex items-center gap-3 py-2 text-sm">
            <span aria-hidden>{icon}</span>
            <span className="w-28 shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 text-center text-xs text-neutral-500 dark:bg-neutral-800">
              {LAYER_LABEL[r.layer] ?? r.layer}
            </span>
            <span className="w-32 shrink-0 font-medium">{r.label}</span>
            <span className="flex-1 text-neutral-500">{r.detail}</span>
            <span className={`w-12 shrink-0 text-right font-semibold tabular-nums ${positive ? "text-up" : r.delta < 0 ? "text-down" : "text-neutral-400"}`}>
              {positive ? "+" : ""}
              {r.delta}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
