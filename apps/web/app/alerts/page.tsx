export const metadata = { title: "알림 설정" };

const ALERT_TYPES = [
  { name: "스코어 등급 상승", trigger: "C→B, B→A, A→S 전이", plan: "Free~" },
  { name: "스코어 등급 하락", trigger: "관심종목이 D 이하 진입", plan: "Free~" },
  { name: "청산 조건 발생", trigger: "손절·이익보전·과열·수급이탈 조건 충족", plan: "Basic~" },
  { name: "스크리너 조건 충족", trigger: "저장한 조건에 신규 종목 편입", plan: "Basic~" },
  { name: "테마 급등", trigger: "테마 스코어 5일 변화 상위", plan: "Basic~" },
  { name: "주요 공시", trigger: "관심종목 이벤트 스코어 |±20| 이상 (Phase 2)", plan: "Basic~" },
];

export default function AlertsPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-xl font-bold">알림 설정</h1>
      <p className="mb-4 text-sm text-neutral-500">
        웹푸시·이메일 알림 발송은 로그인 및 배치 인프라가 필요한 기능으로, 현재 MVP 데모에는 실제 발송이
        연결되어 있지 않습니다. 아래는 정식 서비스에서 제공될 알림 유형입니다. 장 마감 후 배치는 19:30
        일괄 발송, 21:00~08:00에는 발송을 보류했다가 익일 08:30에 묶어 보냅니다.
      </p>
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800">
        {ALERT_TYPES.map((a) => (
          <div key={a.name} className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3 text-sm last:border-b-0 dark:border-neutral-800">
            <span className="flex-1">
              <span className="block font-medium">{a.name}</span>
              <span className="block text-xs text-neutral-400">{a.trigger}</span>
            </span>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500 dark:bg-neutral-800">{a.plan}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
