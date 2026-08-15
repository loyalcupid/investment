import { DISCLAIMER } from "@/lib/constants/copy";

// PRD 3.3 — DISCLAIMER.GLOBAL은 모든 페이지 푸터에 상시 노출.
export function DisclaimerFooter() {
  return (
    <footer className="mt-16 border-t border-neutral-200 bg-neutral-50 py-6 text-xs leading-relaxed text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400">
      <div className="mx-auto max-w-6xl px-4">
        <p className="font-medium text-neutral-600 dark:text-neutral-300">{DISCLAIMER.GLOBAL}</p>
        <p className="mt-2">
          시그널스테이션은 유사투자자문업 신고 대상 서비스이며, 현재는 무료 베타로 운영됩니다. ·{" "}
          <a href="/legal/disclaimer" className="underline underline-offset-2">
            투자 유의사항
          </a>{" "}
          ·{" "}
          <a href="/legal/terms" className="underline underline-offset-2">
            이용약관
          </a>{" "}
          ·{" "}
          <a href="/legal/privacy" className="underline underline-offset-2">
            개인정보처리방침
          </a>
        </p>
      </div>
    </footer>
  );
}
