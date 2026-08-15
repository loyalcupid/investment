import Link from "next/link";
import { getThemeRanking } from "@/lib/data/repository";
import { formatPct } from "@/lib/format";

export const metadata = { title: "테마 랭킹" };

export default function ThemesPage() {
  const themes = getThemeRanking();

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">테마 랭킹</h1>
      <p className="mb-4 text-sm text-neutral-500">
        테마 스코어 = 구성종목 스코어(시총가중) 상위 70% 절사평균 · 테마 모멘텀 = 5일 스코어 변화량
      </p>
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-3 border-b border-neutral-100 px-4 py-2 text-xs text-neutral-400 dark:border-neutral-800">
          <span className="w-6">#</span>
          <span className="flex-1">테마</span>
          <span className="w-24 text-right">구성종목</span>
          <span className="w-20 text-right">5일 모멘텀</span>
          <span className="w-16 text-right">스코어</span>
        </div>
        {themes.map((t, i) => (
          <Link
            key={t.theme.slug}
            href={`/themes/${t.theme.slug}`}
            className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900"
          >
            <span className="w-6 text-neutral-400">{i + 1}</span>
            <span className="flex-1">
              <span className="block font-medium">{t.theme.nameKo}</span>
              <span className="block text-xs text-neutral-400">
                대표: {t.topTickers.map((tk) => tk.nameKo).join(", ")}
              </span>
            </span>
            <span className="w-24 text-right text-neutral-400">{t.memberCount}개</span>
            <span className={`w-20 text-right tabular-nums ${t.momentum5d >= 0 ? "text-up" : "text-down"}`}>
              {formatPct(t.momentum5d)}
            </span>
            <span className="w-16 text-right font-semibold tabular-nums">{t.score.toFixed(1)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
