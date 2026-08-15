export const metadata = { title: "이용약관" };

export default function TermsPage() {
  return (
    <div className="prose prose-neutral max-w-3xl text-sm leading-relaxed dark:prose-invert">
      <h1 className="text-xl font-bold">이용약관 (초안)</h1>
      <p className="text-neutral-500">
        본 약관은 MVP 데모용 초안이며, 정식 서비스 및 유료화 전 법률 검토를 거쳐 확정됩니다.
      </p>
      <h2>제1조 (목적)</h2>
      <p>
        이 약관은 시그널스테이션(이하 "회사")이 제공하는 국내 종목·테마·ETF 신호 정보 서비스(이하
        "서비스")의 이용조건 및 절차, 회사와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.
      </p>
      <h2>제2조 (서비스의 성격)</h2>
      <p>
        서비스는 투자 판단에 참고할 수 있는 정보를 제공할 뿐, 금융투자상품의 매수·매도를 권유하거나
        투자자문·투자일임 업무를 수행하지 않습니다. 자동 주문 실행, 증권사 계좌 연동 매매 기능을
        제공하지 않습니다.
      </p>
      <h2>제3조 (이용자의 책임)</h2>
      <p>서비스를 통해 얻은 정보에 기반한 모든 투자 판단과 그 결과에 대한 책임은 이용자 본인에게 있습니다.</p>
      <h2>제4조 (금지 행위)</h2>
      <p>회사는 유료회원을 대상으로 한 1:1 종목 상담 및 양방향 실시간 소통 기능을 제공하지 않습니다.</p>
    </div>
  );
}
