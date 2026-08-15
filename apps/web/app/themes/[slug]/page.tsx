import { notFound } from "next/navigation";
import { getThemeDetail } from "@/lib/data/repository";
import { StockRow } from "@/components/signal/StockRow";
import { formatPct } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const detail = getThemeDetail(slug);
  return { title: detail ? `${detail.theme.nameKo} 테마` : "테마 상세" };
}

export default async function ThemeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const detail = getThemeDetail(slug);
  if (!detail) notFound();

  const { theme, members, score, momentum5d } = detail;

  return (
    <div className="space-y-6">
      <div className="border-b border-neutral-200 pb-4 dark:border-neutral-800">
        <h1 className="text-xl font-bold">{theme.nameKo}</h1>
        <p className="mt-1 text-sm text-neutral-500">{theme.description}</p>
        <div className="mt-3 flex items-center gap-4">
          <div>
            <div className="text-xs text-neutral-400">테마 스코어</div>
            <div className="text-2xl font-bold tabular-nums">{score.toFixed(1)}</div>
          </div>
          <div>
            <div className="text-xs text-neutral-400">5일 모멘텀</div>
            <div className={`text-lg font-semibold tabular-nums ${momentum5d >= 0 ? "text-up" : "text-down"}`}>
              {formatPct(momentum5d)}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800">
        <h2 className="border-b border-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-500 dark:border-neutral-800">
          구성종목 ({members.length}개)
        </h2>
        {members.map((m) => (
          <StockRow
            key={m.meta.ticker}
            ticker={m.meta.ticker}
            nameKo={m.meta.nameKo}
            market={m.meta.market}
            score={m.score}
            grade={m.grade}
            changeRate={m.changeRate}
          />
        ))}
      </div>
    </div>
  );
}
