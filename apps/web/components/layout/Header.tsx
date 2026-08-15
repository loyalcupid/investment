import Link from "next/link";

const NAV = [
  { href: "/", label: "홈" },
  { href: "/stocks", label: "종목" },
  { href: "/themes", label: "테마" },
  { href: "/screener", label: "스크리너" },
  { href: "/watchlist", label: "관심종목" },
  { href: "/alerts", label: "알림" },
  { href: "/guide", label: "가이드" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-1.5 font-bold">
          <span className="rounded bg-neutral-900 px-1.5 py-0.5 text-sm text-white dark:bg-white dark:text-neutral-900">
            SS
          </span>
          <span>시그널스테이션</span>
          <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            무료 베타
          </span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-neutral-600 dark:text-neutral-300 sm:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-neutral-950 dark:hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
