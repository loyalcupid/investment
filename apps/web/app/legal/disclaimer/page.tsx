import { DISCLAIMER } from "@/lib/constants/copy";

export const metadata = { title: "투자 유의사항" };

export default function DisclaimerPage() {
  return (
    <div className="prose prose-neutral max-w-3xl text-sm leading-relaxed dark:prose-invert">
      <h1 className="text-xl font-bold">투자 유의사항</h1>
      <p className="font-medium">{DISCLAIMER.GLOBAL}</p>
      <ol className="list-decimal space-y-3 pl-5">
        <li>
          본 서비스는 자본시장법상 <strong>유사투자자문업</strong>에 해당하며, 유료화 시점에 금융위원회
          신고 절차를 거칩니다. 현재는 신고 의무가 없는 무료 베타로 운영됩니다.
        </li>
        <li>
          서비스가 제공하는 "신호 강도", "조건 충족" 등의 표현은 과거 데이터와 규칙에 기반한 정보 제공이며,
          특정 종목의 매수·매도를 권유하는 것이 아닙니다.
        </li>
        <li>{DISCLAIMER.BACKTEST}</li>
        <li>{DISCLAIMER.ML} (Phase 3부터 제공 예정)</li>
        <li>
          본 서비스는 1:1 종목 상담, 실시간 채팅·DM 등 양방향 소통 기능을 제공하지 않습니다. 고객센터
          문의는 이메일로만 접수하며, 답변 시 개별 종목에 대한 의견을 제시하지 않습니다.
        </li>
        <li>모든 투자 판단과 그 결과에 대한 책임은 이용자 본인에게 있습니다.</li>
      </ol>
    </div>
  );
}
