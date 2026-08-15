# 시그널스테이션 — MVP (기술적 + 수급 2레이어)

`PRD_signal_station.md`를 기반으로 한 웹사이트 MVP입니다. **PRD 5.1절 지침대로 MVP는 L1(기술적)·L2(수급)
2개 레이어만 사용**하며, 이벤트(공시·뉴스)·ML 레이어는 화면에 "Phase 2/3 예정"으로 표시되는 자리만
마련해 두었습니다.

## 실행 방법

```bash
npm install
npm run dev
# http://localhost:3000
```

## 이 MVP가 실제로 구현한 것

- **시그널 엔진 (`lib/signals/`)**: PRD 5.2(기술적 룰), 5.3(수급 룰), 5.6(레짐 보정), 5.7(합성),
  5.8(청산 신호)의 계산식을 TypeScript로 그대로 이식했습니다. RSI/MACD/볼린저/스토캐스틱/ATR 등은
  `lib/signals/indicators.ts`에서 pandas 방식(Wilder EMA 등)과 동일하게 계산합니다.
- **화면**: 홈(`/`), 종목 탐색(`/stocks`), 종목 상세(`/stocks/[ticker]` — PRD 7.2 핵심 화면),
  테마 랭킹(`/themes`, `/themes/[slug]`), 스크리너(`/screener`, 프리셋 5종), 관심종목(`/watchlist`,
  로컬 스토리지 기반), 알림 안내(`/alerts`), 가이드(`/guide`), 법적 고지(`/legal/*`).
- **규제 대응 UI (PRD 3장)**: `lib/constants/copy.ts` 상수만 사용해 "매수/매도" 같은 지시형 표현을
  금지하고, `DISCLAIMER.GLOBAL`을 모든 페이지 푸터에, `DISCLAIMER.BACKTEST`를 성과 카드에 분리
  불가능하게 병기합니다.
- **API 라우트**: `app/api/stocks`, `app/api/stocks/[ticker]/exit` — 관심종목 화면이 사용하는 최소
  API. 정식 서비스에서는 PRD 10장의 FastAPI로 대체됩니다.

## MVP의 의도적 단순화 (실제 서비스 전 반드시 교체해야 할 부분)

| 항목 | MVP 상태 | 실제 서비스에서 필요한 것 |
|---|---|---|
| 시세·수급 데이터 | `lib/data/mock.ts`의 결정적(seeded) 시뮬레이션 데이터, 24개 큐레이션 종목 | PRD 4장 D1~D3 (KRX Open API·pykrx·KIS)로 교체 |
| 이벤트(공시·뉴스) 레이어 | 미구현, UI에 "Phase 2 예정"만 표시 | PRD 5.4 |
| ML 레이어 | 미구현, UI에 "Phase 3 예정"만 표시 | PRD 5.5 |
| 신호 해설(narrative) | 근거 리스트 기반 규칙형 템플릿 문장 | PRD 5.4.2의 LLM 연동으로 교체 (환각 방지를 위해 근거 리스트 범위 내에서만 생성하는 원칙은 이미 반영) |
| "조건별 과거 성과" / 백테스트 | 종목별 420일 시뮬레이션 데이터 위에서 계산한 근사치 (T+1 시가 체결, 비용모델 반영) | PRD 6장의 전체 유니버스·상장폐지 포함 워크포워드 백테스트 엔진 |
| 인증/결제/알림 발송 | 없음 (로그인 없이 로컬 스토리지만 사용) | Auth.js, 토스페이먼츠, 웹푸시/이메일 발송 인프라 |
| DB | 없음 (서버 프로세스 메모리 내 계산) | PostgreSQL + TimescaleDB (PRD 9장 스키마) |

## 디렉터리

```
app/                 Next.js App Router 페이지 및 API 라우트
components/          signal/ chart/ layout/ watchlist/ UI 컴포넌트
lib/signals/          시그널 엔진 (지표·기술적·수급·레짐·합성·청산)
lib/backtest/         비용 모델 (PRD 6.2)
lib/data/              종목/테마 마스터, 시뮬레이션 데이터, 레포지토리, 스크리너 프리셋
lib/constants/copy.ts  규제 대응 문구 상수 (하드코딩 금지 원칙)
```
