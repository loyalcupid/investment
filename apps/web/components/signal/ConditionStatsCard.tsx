import { DISCLAIMER } from "@/lib/constants/copy";
import type { ConditionStats } from "@/lib/data/repository";

// PRD 6.5 — 백테스트/조건 성과 카드는 DISCLAIMER.BACKTEST와 분리 불가능하게 병기.
export function ConditionStatsCard({ stats }: { stats: ConditionStats }) {
  return (
    <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <h3 className="mb-3 text-sm font-semibold">이 조건의 과거 성과</h3>
      {stats.insufficientSample ? (
        <p className="text-sm text-neutral-500">
          동일 조건 발생 사례가 충분하지 않아({stats.sampleCount}회) 통계를 표시하지 않습니다.
        </p>
      ) : (
        <>
          <p className="mb-3 text-sm text-neutral-500">
            동일 조건 충족 사례 최근 {stats.periodFrom} ~ {stats.periodTo} 중 {stats.sampleCount}회
          </p>
          <div className="grid grid-cols-2 gap-y-2 text-sm sm:grid-cols-4">
            <Stat label="승률" value={`${stats.winRate.toFixed(1)}%`} />
            <Stat label="평균수익" value={`+${stats.avgGain.toFixed(1)}%`} tone="up" />
            <Stat label="평균손실" value={`${stats.avgLoss.toFixed(1)}%`} tone="down" />
            <Stat label="평균보유" value={`${stats.avgHoldingDays.toFixed(1)}일`} />
          </div>
          <p className="mt-2 text-sm font-medium">
            최대낙폭(MDD){" "}
            <span className="text-down">{stats.maxDrawdown.toFixed(1)}%</span>
          </p>
        </>
      )}
      <p className="mt-3 border-t border-neutral-100 pt-2 text-xs text-neutral-500 dark:border-neutral-800">
        ⓘ {DISCLAIMER.BACKTEST}
      </p>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div>
      <div className="text-xs text-neutral-400">{label}</div>
      <div className={`font-semibold tabular-nums ${tone === "up" ? "text-up" : tone === "down" ? "text-down" : ""}`}>
        {value}
      </div>
    </div>
  );
}
