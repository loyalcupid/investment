"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { UNIVERSE } from "@/lib/data/universe";
import { GRADE_META, type Grade } from "@/lib/constants/copy";
import { formatPct, formatPrice } from "@/lib/format";

const STORAGE_KEY = "ss_watchlist_v1";

interface WatchItem {
  ticker: string;
  entryPrice: number | null;
  memo: string;
}

interface StockSummary {
  ticker: string;
  nameKo: string;
  market: string;
  close: number;
  changeRate: number;
  score: number;
  grade: Grade;
}

interface ExitInfo {
  returnRate: number;
  exitSignal: { label: string; detail: string; severity: "HIGH" | "MEDIUM" } | null;
}

export function WatchlistManager() {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [summaries, setSummaries] = useState<Record<string, StockSummary>>({});
  const [exits, setExits] = useState<Record<string, ExitInfo>>({});
  const [loaded, setLoaded] = useState(false);

  // localStorage 로드 (Free~ 플랜의 관심종목 등록, PRD 7.1 /watchlist)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore malformed storage
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  useEffect(() => {
    if (items.length === 0) {
      setSummaries({});
      return;
    }
    fetch(`/api/stocks?tickers=${items.map((i) => i.ticker).join(",")}`)
      .then((r) => r.json())
      .then((data) => {
        const map: Record<string, StockSummary> = {};
        for (const s of data.results) map[s.ticker] = s;
        setSummaries(map);
      })
      .catch(() => {});
  }, [items]);

  useEffect(() => {
    items.forEach((it) => {
      if (!it.entryPrice) return;
      fetch(`/api/stocks/${it.ticker}/exit?entryPrice=${it.entryPrice}`)
        .then((r) => r.json())
        .then((data) => {
          setExits((prev) => ({ ...prev, [it.ticker]: { returnRate: data.returnRate, exitSignal: data.exitSignal } }));
        })
        .catch(() => {});
    });
  }, [items]);

  const [ticker, setTicker] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [memo, setMemo] = useState("");

  const availableTickers = useMemo(() => UNIVERSE.filter((u) => !items.some((it) => it.ticker === u.ticker)), [items]);

  function addItem() {
    if (!ticker) return;
    setItems((prev) => [...prev, { ticker, entryPrice: entryPrice ? Number(entryPrice) : null, memo }]);
    setTicker("");
    setEntryPrice("");
    setMemo("");
  }

  function removeItem(t: string) {
    setItems((prev) => prev.filter((i) => i.ticker !== t));
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end gap-2 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <div>
          <label className="mb-1 block text-xs text-neutral-400">종목</label>
          <select
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            className="rounded-lg border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="">선택</option>
            {availableTickers.map((u) => (
              <option key={u.ticker} value={u.ticker}>
                {u.nameKo} ({u.ticker})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-400">진입가(선택, 청산 신호 계산용)</label>
          <input
            type="number"
            value={entryPrice}
            onChange={(e) => setEntryPrice(e.target.value)}
            placeholder="예: 70000"
            className="w-32 rounded-lg border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-400">메모</label>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="w-40 rounded-lg border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
        <button
          onClick={addItem}
          disabled={!ticker}
          className="rounded-lg bg-neutral-900 px-4 py-1.5 text-sm text-white disabled:opacity-40 dark:bg-white dark:text-neutral-900"
        >
          추가
        </button>
      </div>

      {loaded && items.length === 0 && (
        <p className="rounded-xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-400 dark:border-neutral-700">
          아직 등록된 관심종목이 없습니다. Free 플랜은 최대 5개까지 등록할 수 있습니다.
        </p>
      )}

      <div className="space-y-2">
        {items.map((it) => {
          const s = summaries[it.ticker];
          const ex = it.entryPrice ? exits[it.ticker] : undefined;
          return (
            <div key={it.ticker} className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                {s ? (
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: GRADE_META[s.grade].color }}
                  >
                    {s.grade}
                  </span>
                ) : (
                  <span className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800" />
                )}
                <Link href={`/stocks/${it.ticker}`} className="min-w-0 flex-1">
                  <span className="block truncate font-medium hover:underline">
                    {s?.nameKo ?? it.ticker} <span className="text-xs text-neutral-400">{it.ticker}</span>
                  </span>
                  {it.memo && <span className="block text-xs text-neutral-400">{it.memo}</span>}
                </Link>
                {s && (
                  <>
                    <span className={`w-16 text-right text-sm tabular-nums ${s.changeRate >= 0 ? "text-up" : "text-down"}`}>
                      {formatPct(s.changeRate)}
                    </span>
                    <span className="w-10 text-right text-sm font-semibold tabular-nums">{s.score}</span>
                  </>
                )}
                <button onClick={() => removeItem(it.ticker)} className="text-xs text-neutral-400 hover:text-neutral-900 dark:hover:text-white">
                  삭제
                </button>
              </div>
              {it.entryPrice && (
                <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-2 text-xs dark:border-neutral-800">
                  <span className="text-neutral-400">
                    진입가 {formatPrice(it.entryPrice)}원
                    {ex && (
                      <span className={ex.returnRate >= 0 ? "text-up" : "text-down"}>
                        {" "}
                        ({formatPct(ex.returnRate)})
                      </span>
                    )}
                  </span>
                  {ex?.exitSignal && (
                    <span
                      className={`rounded-full px-2 py-0.5 font-medium ${
                        ex.exitSignal.severity === "HIGH" ? "bg-down/10 text-down" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                      }`}
                    >
                      {ex.exitSignal.label} · {ex.exitSignal.detail}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
