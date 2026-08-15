import Link from "next/link";
import { GRADE_META, type Grade } from "@/lib/constants/copy";
import { formatPct } from "@/lib/format";

export function StockRow({
  ticker,
  nameKo,
  market,
  score,
  grade,
  changeRate,
  extra,
}: {
  ticker: string;
  nameKo: string;
  market: string;
  score: number;
  grade: Grade;
  changeRate: number;
  extra?: React.ReactNode;
}) {
  const meta = GRADE_META[grade];
  return (
    <Link
      href={`/stocks/${ticker}`}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900"
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ backgroundColor: meta.color }}
      >
        {grade}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{nameKo}</span>
        <span className="block text-xs text-neutral-400">
          {ticker} · {market}
        </span>
      </span>
      {extra}
      <span className={`w-16 shrink-0 text-right tabular-nums ${changeRate >= 0 ? "text-up" : "text-down"}`}>
        {formatPct(changeRate)}
      </span>
      <span className="w-10 shrink-0 text-right font-semibold tabular-nums">{score}</span>
    </Link>
  );
}
