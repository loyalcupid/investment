import { notFound } from "next/navigation";
import {
  getSignalDetail,
  getConditionStats,
  getPriceChartData,
  getFlowChartData,
  getGradeTransitionMarkers,
  themesOfStock,
  getThemeRanking,
} from "@/lib/data/repository";
import { SignalGauge } from "@/components/signal/SignalGauge";
import { LayerBar } from "@/components/signal/LayerBar";
import { ReasonList } from "@/components/signal/ReasonList";
import { ConditionStatsCard } from "@/components/signal/ConditionStatsCard";
import { PriceChart } from "@/components/chart/PriceChart";
import { FlowChart } from "@/components/chart/FlowChart";
import { GATE_REASON_LABEL } from "@/lib/constants/copy";
import { formatPct, formatPrice } from "@/lib/format";
import Link from "next/link";

export async function generateMetadata({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const detail = getSignalDetail(ticker, 0);
  return { title: detail ? `${detail.meta.nameKo} ${detail.ticker}` : "종목 상세" };
}

export default async function StockDetailPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const detail = getSignalDetail(ticker, 0);
  if (!detail) notFound();

  const { meta, price, composed, date, prevScore } = detail;

  if (composed.gateFailed) {
    return (
      <div>
        <StockHeader meta={meta} price={price} date={date} />
        <div className="mt-6 rounded-xl border border-neutral-200 p-6 text-center dark:border-neutral-800">
          <p className="text-lg font-semibold">신호 미산출</p>
          <p className="mt-1 text-sm text-neutral-500">
            {composed.gateReason ? GATE_REASON_LABEL[composed.gateReason] ?? composed.gateReason : "사유 미상"}
          </p>
        </div>
      </div>
    );
  }

  const stats = getConditionStats(ticker, composed.grade);
  const chartBars = getPriceChartData(ticker, 150);
  const markers = getGradeTransitionMarkers(ticker, 150);
  const flowPoints = getFlowChartData(ticker, 20);
  const related = themesOfStock(ticker);
  const ranking = getThemeRanking();

  return (
    <div className="space-y-8">
      <StockHeader meta={meta} price={price} date={date} />

      {/* 종합 신호 */}
      <section className="rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
        <h2 className="mb-4 text-sm font-semibold text-neutral-500">종합 신호</h2>
        <SignalGauge score={composed.score} grade={composed.grade} prevScore={prevScore} />
        <div className="mt-5 space-y-2">
          {composed.layers.map((l) => (
            <LayerBar key={l.layer} layer={l} />
          ))}
        </div>
        {composed.narrativeKo && (
          <p className="mt-5 rounded-lg bg-neutral-50 p-3 text-sm leading-relaxed text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
            💬 {composed.narrativeKo}
          </p>
        )}
      </section>

      {/* 신호 근거 */}
      <section className="rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
        <h2 className="mb-2 text-sm font-semibold text-neutral-500">신호 근거</h2>
        <ReasonList reasons={composed.reasons} />
      </section>

      {/* 차트 */}
      <section className="rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
        <h2 className="mb-2 text-sm font-semibold text-neutral-500">차트 (일봉 + 이동평균, 노란선 SMA20 · 보라선 SMA60)</h2>
        <PriceChart bars={chartBars} markers={markers} />
      </section>

      {/* 조건별 과거 성과 */}
      <ConditionStatsCard stats={stats} />

      {/* 수급 */}
      <section className="rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
        <h2 className="mb-3 text-sm font-semibold text-neutral-500">수급 (최근 20일 순매수)</h2>
        <FlowChart points={flowPoints} />
      </section>

      {/* 공시·뉴스 (Phase 2) */}
      <section className="rounded-xl border border-dashed border-neutral-300 p-5 text-sm text-neutral-400 dark:border-neutral-700">
        공시·뉴스 이벤트 레이어는 Phase 2에서 제공될 예정입니다 (DART 공시 + 뉴스 감성 분석).
      </section>

      {/* 관련 테마 */}
      {related.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-neutral-500">관련 테마</h2>
          <div className="flex flex-wrap gap-2">
            {related.map((t) => {
              const rank = ranking.findIndex((r) => r.theme.slug === t.slug) + 1;
              return (
                <Link
                  key={t.slug}
                  href={`/themes/${t.slug}`}
                  className="rounded-full border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
                >
                  {t.nameKo} {rank > 0 ? `(${rank}위)` : ""}
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function StockHeader({
  meta,
  price,
  date,
}: {
  meta: { nameKo: string; ticker: string; market: string; sector: string };
  price: { close: number; changeAmount: number; changeRate: number };
  date: string;
}) {
  const up = price.changeAmount >= 0;
  return (
    <div className="flex flex-wrap items-end justify-between gap-2 border-b border-neutral-200 pb-4 dark:border-neutral-800">
      <div>
        <h1 className="text-xl font-bold">
          {meta.nameKo} <span className="text-base font-normal text-neutral-400">{meta.ticker}</span>
        </h1>
        <p className="text-sm text-neutral-400">
          {meta.market} · {meta.sector}
        </p>
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold tabular-nums">{formatPrice(price.close)}원</div>
        <div className={`text-sm tabular-nums ${up ? "text-up" : "text-down"}`}>
          {up ? "▲" : "▼"}
          {formatPrice(Math.abs(price.changeAmount))} ({formatPct(price.changeRate)})
        </div>
        <p className="text-xs text-neutral-400">{date} 종가 기준</p>
      </div>
    </div>
  );
}
