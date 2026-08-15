import Link from "next/link";
import { getMarketSummary, getMovers, getThemeRanking } from "@/lib/data/repository";
import { REGIME_LABEL, DATA_SOURCE_NOTICE, gradeFromScore } from "@/lib/constants/copy";
import { StockRow } from "@/components/signal/StockRow";
import { formatEok, formatPct, formatPrice } from "@/lib/format";

export default function HomePage() {
  const summary = getMarketSummary();
  const moversUp = getMovers("up", 10);
  const moversDown = getMovers("down", 10);
  const themes = getThemeRanking();

  const regimeColor =
    summary.regime === "BULL" ? "bg-up/10 text-up" : summary.regime === "BEAR" ? "bg-down/10 text-down" : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800";

  return (
    <div className="space-y-10">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300">
        {DATA_SOURCE_NOTICE}
      </div>

      {/* 1. 시장 요약 바 */}
      <section className="flex flex-wrap items-center gap-4 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <div>
          <div className="text-xs text-neutral-400">KOSPI</div>
          <div className="text-xl font-bold tabular-nums">{formatPrice(summary.kospi.close)}</div>
          <div className={`text-sm tabular-nums ${summary.kospi.changeRate >= 0 ? "text-up" : "text-down"}`}>
            {formatPct(summary.kospi.changeRate)}
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${regimeColor}`}>
          {REGIME_LABEL[summary.regime]}
        </span>
        <div className="ml-auto flex gap-6 text-sm">
          <div>
            <div className="text-xs text-neutral-400">외국인 순매수(유니버스 합)</div>
            <div className={`tabular-nums ${summary.marketFrgnNet >= 0 ? "text-up" : "text-down"}`}>
              {formatEok(summary.marketFrgnNet)}
            </div>
          </div>
          <div>
            <div className="text-xs text-neutral-400">기관 순매수(유니버스 합)</div>
            <div className={`tabular-nums ${summary.marketInstNet >= 0 ? "text-up" : "text-down"}`}>
              {formatEok(summary.marketInstNet)}
            </div>
          </div>
        </div>
      </section>

      {/* 2. 오늘의 신호 변화 */}
      <section>
        <h2 className="mb-3 text-lg font-bold">오늘의 신호 변화</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800">
            <h3 className="border-b border-neutral-100 px-3 py-2 text-sm font-semibold text-up dark:border-neutral-800">
              스코어 상승 Top 10
            </h3>
            <div>
              {moversUp.map((m) => (
                <StockRow
                  key={m.meta.ticker}
                  ticker={m.meta.ticker}
                  nameKo={m.meta.nameKo}
                  market={m.meta.market}
                  score={m.score}
                  grade={gradeFromScore(m.score)}
                  changeRate={m.changeRate}
                  extra={<span className="w-14 shrink-0 text-right text-xs text-up">▲{m.delta}</span>}
                />
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800">
            <h3 className="border-b border-neutral-100 px-3 py-2 text-sm font-semibold text-down dark:border-neutral-800">
              스코어 하락 Top 10
            </h3>
            <div>
              {moversDown.map((m) => (
                <StockRow
                  key={m.meta.ticker}
                  ticker={m.meta.ticker}
                  nameKo={m.meta.nameKo}
                  market={m.meta.market}
                  score={m.score}
                  grade={gradeFromScore(m.score)}
                  changeRate={m.changeRate}
                  extra={<span className="w-14 shrink-0 text-right text-xs text-down">▼{Math.abs(m.delta)}</span>}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. 테마 히트맵 */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">테마 히트맵</h2>
          <Link href="/themes" className="text-sm text-neutral-500 hover:underline">
            전체보기 →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {themes.map((t) => {
            const intensity = Math.max(0, Math.min(1, (t.score - 30) / 50));
            const bg = t.score >= 50 ? `rgba(214,69,65,${0.15 + intensity * 0.5})` : `rgba(43,108,176,${0.15 + (1 - intensity) * 0.35})`;
            return (
              <Link
                key={t.theme.slug}
                href={`/themes/${t.theme.slug}`}
                className="rounded-lg p-3 transition hover:opacity-80"
                style={{ backgroundColor: bg }}
              >
                <div className="text-sm font-semibold">{t.theme.nameKo}</div>
                <div className="text-lg font-bold tabular-nums">{t.score.toFixed(1)}</div>
                <div className={`text-xs tabular-nums ${t.momentum5d >= 0 ? "text-up" : "text-down"}`}>
                  5일 {formatPct(t.momentum5d)}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. 관심종목 안내 */}
      <section className="rounded-xl border border-dashed border-neutral-300 p-4 text-sm text-neutral-500 dark:border-neutral-700">
        관심종목을 등록하면 스코어 변화와 청산 신호를 이 자리에서 바로 확인할 수 있습니다.{" "}
        <Link href="/watchlist" className="font-medium text-neutral-900 underline dark:text-white">
          관심종목 관리하기 →
        </Link>
      </section>
    </div>
  );
}
