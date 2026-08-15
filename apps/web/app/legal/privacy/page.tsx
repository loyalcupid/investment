export const metadata = { title: "개인정보처리방침" };

export default function PrivacyPage() {
  return (
    <div className="prose prose-neutral max-w-3xl text-sm leading-relaxed dark:prose-invert">
      <h1 className="text-xl font-bold">개인정보처리방침 (초안)</h1>
      <p className="text-neutral-500">본 방침은 MVP 데모용 초안이며, 정식 서비스 전 확정됩니다.</p>
      <h2>1. 수집하는 개인정보 항목</h2>
      <p>이메일, 닉네임(선택), 결제 시 결제 토큰(카드정보 등 원본은 저장하지 않음)</p>
      <h2>2. 수집 목적</h2>
      <p>회원 식별, 관심종목·알림 등 서비스 제공, 결제 처리</p>
      <h2>3. 보유 및 파기</h2>
      <p>회원 탈퇴 시 30일 이내 파기합니다. 관계 법령에 따라 보존이 필요한 정보는 해당 기간 동안 별도 보관합니다.</p>
      <h2>4. 뉴스·공시 데이터 처리</h2>
      <p>뉴스 본문은 저장하지 않으며, 분석에 사용된 URL 해시와 분석 결과만 보관합니다.</p>
    </div>
  );
}
