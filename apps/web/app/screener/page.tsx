import { SCREENER_PRESETS, runPreset } from "@/lib/data/screener";
import { StockRow } from "@/components/signal/StockRow";

export const metadata = { title: "스크리너" };

export default async function ScreenerPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string }>;
}) {
  const sp = await searchParams;
  const presetId = sp.preset ?? SCREENER_PRESETS[0].id;
  const { preset, results } = runPreset(presetId);

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">스크리너</h1>
      <p className="mb-4 text-sm text-neutral-500">조건을 충족하는 종목을 찾습니다. (MVP: 프리셋 전체 공개 · 커스텀 조건 빌더는 Phase 2)</p>

      <div className="mb-4 flex flex-wrap gap-2">
        {SCREENER_PRESETS.map((p) => (
          <a
            key={p.id}
            href={`/screener?preset=${p.id}`}
            className={`rounded-full px-3 py-1.5 text-sm ${
              p.id === presetId
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
            }`}
          >
            {p.name}
            {p.plan !== "FREE" && <span className="ml-1 text-[10px] opacity-70">{p.plan}</span>}
          </a>
        ))}
      </div>

      {preset && (
        <p className="mb-3 rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300">
          조건: {preset.condition}
        </p>
      )}

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800">
        {results.length === 0 && (
          <p className="p-6 text-center text-sm text-neutral-400">현재 조건을 충족하는 종목이 없습니다.</p>
        )}
        {results.map((r) => (
          <StockRow
            key={r.meta.ticker}
            ticker={r.meta.ticker}
            nameKo={r.meta.nameKo}
            market={r.meta.market}
            score={r.score}
            grade={r.grade}
            changeRate={r.changeRate}
          />
        ))}
      </div>
    </div>
  );
}
