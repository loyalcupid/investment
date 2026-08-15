import { GRADE_META, type Grade } from "@/lib/constants/copy";

export function SignalGauge({
  score,
  grade,
  prevScore,
}: {
  score: number;
  grade: Grade;
  prevScore: number | null;
}) {
  const meta = GRADE_META[grade];
  const circumference = 2 * Math.PI * 52;
  const offset = circumference * (1 - score / 100);
  const delta = prevScore == null ? null : score - prevScore;

  return (
    <div className="flex items-center gap-6">
      <div className="relative h-32 w-32 shrink-0">
        <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90">
          <circle cx="60" cy="60" r="52" strokeWidth="12" className="fill-none stroke-neutral-200 dark:stroke-neutral-800" />
          <circle
            cx="60"
            cy="60"
            r="52"
            strokeWidth="12"
            strokeLinecap="round"
            fill="none"
            stroke={meta.color}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.4s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tabular-nums">{score}</span>
          <span className="text-xs text-neutral-500">/ 100</span>
        </div>
      </div>
      <div>
        <div className="mb-1 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold text-white" style={{ backgroundColor: meta.color }}>
          <span>{grade}</span>
          <span>·</span>
          <span>{meta.label}</span>
        </div>
        {delta != null && (
          <p className="text-sm text-neutral-500">
            전일 {prevScore} → 오늘 {score}{" "}
            <span className={delta > 0 ? "text-up font-medium" : delta < 0 ? "text-down font-medium" : ""}>
              ({delta > 0 ? "▲" : delta < 0 ? "▼" : "-"}
              {Math.abs(delta)})
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
