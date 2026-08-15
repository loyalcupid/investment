import { WatchlistManager } from "@/components/watchlist/WatchlistManager";

export const metadata = { title: "관심종목" };

export default function WatchlistPage() {
  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">관심종목</h1>
      <p className="mb-4 text-sm text-neutral-500">
        MVP 데모에서는 로그인 없이 이 브라우저에만 저장됩니다(로컬 스토리지). 진입가를 입력하면 청산(매도)
        조건을 함께 확인할 수 있습니다.
      </p>
      <WatchlistManager />
    </div>
  );
}
