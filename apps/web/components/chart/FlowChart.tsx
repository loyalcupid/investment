// 외국인/기관/개인 순매수 막대 그래프 (경량 SVG, PRD 7.2 [수급] 섹션)
import { formatEok } from "@/lib/format";

export interface FlowPoint {
  date: string;
  frgnNet: number;
  instNet: number;
  indiNet: number;
}

const SERIES = [
  { key: "frgnNet" as const, label: "외국인", color: "#2B6CB0" },
  { key: "instNet" as const, label: "기관", color: "#7F5AF0" },
  { key: "indiNet" as const, label: "개인", color: "#A3A3A3" },
];

export function FlowChart({ points }: { points: FlowPoint[] }) {
  const max = Math.max(1, ...points.flatMap((p) => [Math.abs(p.frgnNet), Math.abs(p.instNet), Math.abs(p.indiNet)]));
  const height = 140;
  const mid = height / 2;

  return (
    <div>
      <div className="mb-2 flex gap-4 text-xs text-neutral-500">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${points.length * 18} ${height}`} className="w-full" style={{ height }}>
        <line x1={0} y1={mid} x2={points.length * 18} y2={mid} stroke="currentColor" strokeOpacity={0.15} />
        {points.map((p, i) => (
          <g key={p.date} transform={`translate(${i * 18}, 0)`}>
            {SERIES.map((s, si) => {
              const v = p[s.key];
              const h = (Math.abs(v) / max) * (mid - 4);
              const y = v >= 0 ? mid - h : mid;
              return (
                <rect key={s.key} x={si * 5} y={y} width={4} height={Math.max(h, 0.5)} fill={s.color} rx={1}>
                  <title>
                    {p.date} {s.label} {formatEok(v)}
                  </title>
                </rect>
              );
            })}
          </g>
        ))}
      </svg>
    </div>
  );
}
