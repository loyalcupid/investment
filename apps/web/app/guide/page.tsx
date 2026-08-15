import { GRADE_META } from "@/lib/constants/copy";

export const metadata = { title: "지표 설명" };

const INDICATORS = [
  { name: "SMA / 정배열·역배열", desc: "5·20·60일 이동평균선이 순서대로 위에서부터 배열되면 정배열(상승 추세), 반대는 역배열(하락 추세)로 봅니다." },
  { name: "골든크로스 / 데드크로스", desc: "5일선이 20일선을 위로 뚫으면 골든크로스, 아래로 뚫으면 데드크로스라고 부릅니다." },
  { name: "RSI (상대강도지수)", desc: "0~100 사이 값으로, 30 미만이면 과매도, 70 초과면 과매수 구간으로 참고합니다." },
  { name: "MACD", desc: "단기·장기 이동평균의 차이로 추세 전환을 포착하는 지표입니다. 시그널선을 상향 돌파하면 상승 모멘텀 신호로 참고합니다." },
  { name: "볼린저밴드 / %b", desc: "20일 이동평균과 표준편차로 만든 밴드입니다. %b가 0에 가까우면 밴드 하단, 1에 가까우면 밴드 상단에 위치한 것입니다." },
  { name: "이격도", desc: "현재가가 이동평균선 대비 얼마나 떨어져 있는지를 나타냅니다. 지나치게 높으면 과열 신호로 참고합니다." },
  { name: "외국인·기관 순매수", desc: "외국인·기관 투자자가 특정 종목을 순매수했는지, 며칠 연속 매수했는지를 보여줍니다." },
  { name: "쌍끌이 매수", desc: "외국인과 기관이 동시에 여러 날 연속 순매수하는 상태를 말합니다." },
  { name: "공매도 잔고비율", desc: "공매도로 아직 갚지 않은 주식이 전체 발행주식 대비 얼마나 되는지를 나타냅니다." },
];

export default function GuidePage() {
  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <h1 className="mb-2 text-xl font-bold">지표 설명</h1>
        <p className="text-sm text-neutral-500">
          시그널스테이션은 종목의 매매 시점을 지시하지 않습니다. 기술적 지표와 수급 데이터를 종합해 지금 이
          종목이 어떤 국면에 있는지 참고 정보로 제공합니다.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">신호 등급</h2>
        <div className="space-y-2">
          {(Object.keys(GRADE_META) as (keyof typeof GRADE_META)[]).map((g) => {
            const m = GRADE_META[g];
            return (
              <div key={g} className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3 text-sm dark:border-neutral-800">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: m.color }}
                >
                  {g}
                </span>
                <span className="font-medium">{m.label}</span>
                <span className="ml-auto text-neutral-400">스코어 {m.range[0]}~{m.range[1]}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">신호 구성</h2>
        <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          MVP 단계의 종합 스코어는 <strong>기술적 레이어(가중치 0.60)</strong>와{" "}
          <strong>수급 레이어(가중치 0.40)</strong>를 합성한 뒤, 시장 전체 국면(레짐)에 따라 보정한 값입니다.
          이벤트(공시·뉴스)·ML 레이어는 Phase 2·3에서 순차적으로 추가될 예정입니다.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">용어 사전</h2>
        <dl className="space-y-3">
          {INDICATORS.map((it) => (
            <div key={it.name}>
              <dt className="text-sm font-semibold">{it.name}</dt>
              <dd className="text-sm text-neutral-500">{it.desc}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
