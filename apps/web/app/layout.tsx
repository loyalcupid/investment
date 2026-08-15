import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { DisclaimerFooter } from "@/components/DisclaimerFooter";

export const metadata: Metadata = {
  title: {
    default: "시그널스테이션 — 국내 종목·테마·ETF 신호 정보",
    template: "%s | 시그널스테이션",
  },
  description:
    "기술적 지표와 수급 데이터를 합성한 신호 점수로 국내 KOSPI·KOSDAQ 종목·테마·ETF의 현재 국면을 확인하세요.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="flex min-h-screen flex-col antialiased">
        <Header />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
        <DisclaimerFooter />
      </body>
    </html>
  );
}
