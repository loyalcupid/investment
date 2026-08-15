import { listStocks } from "@/lib/data/repository";
import { StockRow } from "@/components/signal/StockRow";

export const metadata = { title: "종목 탐색" };

export default async function StocksPage({
  searchParams,
}: {
  searchParams: Promise<{ market?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const market = sp.market === "KOSPI" || sp.market === "KOSDAQ" ? sp.market : undefined;
  const items = listStocks({ market, query: sp.q }).sort((a, b) => b.score - a.score);

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">종목 탐색</h1>
      <form className="mb-4 flex flex-wrap items-center gap-2" action="/stocks">
        <input
          type="text"
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="종목명 또는 코드 검색"
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        <div className="flex gap-1 text-sm">
          <FilterLink href="/stocks" active={!market} label="전체" />
          <FilterLink href="/stocks?market=KOSPI" active={market === "KOSPI"} label="KOSPI" />
          <FilterLink href="/stocks?market=KOSDAQ" active={market === "KOSDAQ"} label="KOSDAQ" />
        </div>
        <button className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm text-white dark:bg-white dark:text-neutral-900" type="submit">
          검색
        </button>
      </form>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-3 border-b border-neutral-100 px-3 py-2 text-xs text-neutral-400 dark:border-neutral-800">
          <span className="w-8" />
          <span className="flex-1">종목</span>
          <span className="w-16 text-right">등락률</span>
          <span className="w-10 text-right">스코어</span>
        </div>
        {items.length === 0 && <p className="p-6 text-center text-sm text-neutral-400">검색 결과가 없습니다.</p>}
        {items.map((it) => (
          <StockRow
            key={it.meta.ticker}
            ticker={it.meta.ticker}
            nameKo={it.meta.nameKo}
            market={it.meta.market}
            score={it.score}
            grade={it.grade}
            changeRate={it.changeRate}
          />
        ))}
      </div>
    </div>
  );
}

function FilterLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <a
      href={href}
      className={`rounded-full px-3 py-1.5 ${active ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900" : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"}`}
    >
      {label}
    </a>
  );
}
