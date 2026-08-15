# PRD — 시그널스테이션 (가칭)
### 국내(KOSPI·KOSDAQ) 테마·종목·ETF 매매 타이밍 정보 서비스

| 항목 | 내용 |
|---|---|
| 문서 버전 | v1.0 |
| 작성일 | 2026-08-15 |
| 문서 목적 | **Claude Code가 이 문서만 읽고 바로 구현에 착수할 수 있는 수준**의 개발 명세 |
| 대상 시장 | 한국거래소 유가증권시장(KOSPI), 코스닥(KOSDAQ), 국내 상장 ETF |
| 제품 유형 | 웹 서비스 (반응형 웹 우선, 모바일 앱은 Phase 3) |

---

## 0. 먼저 읽어야 할 3가지 (개발 착수 전 필수)

1. **이 서비스는 "매매 신호를 유료로 제공"하므로 자본시장법상 유사투자자문업 신고 대상입니다.** 무료 서비스로만 운영하면 신고 의무가 없으나, 유료 구독을 붙이는 순간 신고 수리 전 영업은 형사처벌 대상입니다. → [3장](#3-법적규제-요건-최우선-제약조건) 필독.
2. **"매수하세요/매도하세요"라는 지시형 표현은 제품 전체에서 금지합니다.** 대신 `신호 강도(0~100)`, `조건 충족`, `과거 유사 패턴 통계` 같은 **정보 제공형 표현**을 씁니다. 이는 카피라이팅 문제가 아니라 규제 리스크 문제이며, UI 텍스트 상수로 강제합니다.
3. **시그널은 4개 레이어(기술적·수급·이벤트·ML)의 가중 합산 스코어**로 산출합니다. MVP는 기술적 + 수급 2개 레이어만으로 출시하고, 이벤트·ML은 Phase 2·3에서 붙입니다. 처음부터 4개를 다 만들면 어느 레이어가 성능을 내는지 검증이 불가능해집니다.

---

## 1. 제품 개요

### 1.1 한 줄 정의
> 국내 주식·ETF·테마에 대해 **기술적 지표 / 수급 / 뉴스·공시 / 머신러닝** 4개 관점의 신호를 하나의 점수로 합성해, "지금 이 종목이 어떤 국면에 있는지"를 초보자도 읽을 수 있게 보여주고, 조건 충족 시 알림을 보내는 웹 서비스.

### 1.2 해결하려는 문제

| 사용자가 겪는 문제 | 현재의 대안 | 대안의 한계 |
|---|---|---|
| "지금 사도 되는지 모르겠다" | HTS/MTS 차트 직접 분석 | 지표 이름은 알지만 해석을 못 함 |
| "테마가 뜨는 걸 뒤늦게 안다" | 뉴스·커뮤니티 | 이미 3~4일 지난 정보 |
| "언제 팔아야 할지 모른다" | 감(感), 손실 방치 | 매도 규칙 부재 → 손실 확대 |
| "이 전략이 진짜 통하는지 모른다" | 유튜브 리딩방 | 검증 불가, 생존 편향 |
| "종목이 2,700개인데 뭘 봐야 하나" | 거래대금 상위 리스트 | 후행 지표, 이미 급등 후 |

### 1.3 핵심 차별점
1. **단일 지표가 아닌 4레이어 합성 스코어** — RSI만 보는 서비스와 다름
2. **모든 신호에 백테스트 성과가 붙어 있음** — "이 조건은 최근 3년간 승률 54%, 평균 +3.2%" 형태로 신뢰도를 함께 노출
3. **한국 시장 특화 수급 데이터** — 외국인/기관 순매수, 프로그램 매매, 공매도 잔고 (미국 서비스가 커버 못 하는 영역)
4. **초보자용 자연어 해설** — LLM이 지표 조합을 한국어 문장으로 번역

### 1.4 명시적 비목표 (Out of Scope)
- 자동 주문 실행 / 증권사 계좌 연동 매매 (→ 투자중개업 라이선스 필요)
- 1:1 종목 상담, 실시간 채팅 리딩 (→ 미등록 투자자문업, 3년 이하 징역)
- 해외 주식, 암호화폐, 선물·옵션 (Phase 4 이후 재검토)
- 수익률 보장, 목표가 제시

---

## 2. 타깃 사용자 및 등급 구조

### 2.1 페르소나

**P1. 김초보 (34세, 직장인, 투자경력 1년, 자산 2천만원)**
- 점심시간에 MTS를 열어보지만 뭘 봐야 할지 모름
- "삼성전자 지금 사도 돼?"를 검색함
- **니즈**: 복잡한 지표 말고 "지금 이 종목 상태가 어떤지" 한 줄 요약, 그리고 놓치지 않게 알림
- **핵심 화면**: 종목 상세의 신호 카드 + 알림

**P2. 박액티브 (41세, 전업/반전업 트레이더, 경력 7년, 자산 3억)**
- 조건검색식을 직접 짜고, 수급을 매일 확인함
- **니즈**: 커스텀 조건 빌더, 백테스트, 실시간 스크리너, 데이터 내보내기
- **핵심 화면**: 스크리너 + 백테스터

### 2.2 등급(Plan) 정의

| 기능 | Free | Basic (₩9,900/월) | Pro (₩29,900/월) |
|---|---|---|---|
| 종목 신호 스코어 조회 | 일 5종목 | 무제한 | 무제한 |
| 신호 갱신 주기 | 장 마감 후 1회 (T+0 18:00) | 장중 30분 지연 | 장중 5분 |
| 관심종목 등록 | 5개 | 30개 | 200개 |
| 알림 (웹푸시/이메일) | 일 3건 | 일 30건 | 무제한 |
| 테마 랭킹 | 상위 5개 | 전체 | 전체 + 구성종목 수급 |
| 스크리너 프리셋 | 3개 | 전체 프리셋 | 전체 + 커스텀 조건 저장 |
| 백테스트 | ✕ | 기간 1년, 월 10회 | 기간 10년, 무제한 |
| 이벤트(공시·뉴스) 신호 | ✕ | 요약만 | 원문 링크 + 감성 스코어 |
| ML 예측 확률 | ✕ | ✕ | ○ |
| CSV/API 내보내기 | ✕ | ✕ | ○ (일 1,000콜) |

> **가격 근거**: 국내 퀀트/차트 서비스 유료 구간이 대체로 월 1~5만원대에 형성되어 있음. Basic은 진입 장벽 최소화, Pro는 백테스트·ML을 앵커로 삼음. **런칭 후 3개월간은 전 기능 무료 베타로 운영하여 신고 수리 절차와 병행** (무료 = 유사투자자문업 신고 의무 없음).

---

## 3. 법적·규제 요건 (최우선 제약조건)

### 3.1 유사투자자문업 신고

**언제 의무가 발생하는가**: 투자자문업자가 아닌 자가 **고객으로부터 대가를 받고**, **불특정 다수에게 개별성 없는** 금융투자상품 조언을 하는 경우.

| 판단 요소 | 본 서비스 해당 여부 |
|---|---|
| 대가 수취 | 유료 구독 도입 시 **해당** (무료 베타 기간은 비해당) |
| 불특정 다수 대상 | 해당 |
| 조언의 개별성 | 없음 (모든 사용자에게 동일 알고리즘 결과) → **유사투자자문업** |

**결론**: 유료화 시점에 **금융위원회 신고(금감원 심사) 필수**. 신고 수리 전 유료 영업 시 **1년 이하 징역 또는 3천만원 이하 벌금**.

**신고 준비 체크리스트** (개발과 병행)
- [ ] 대표자 사전교육 이수 (신고일로부터 1년 이내)
- [ ] 사업자등록 (업종에 투자자문 관련 종목 포함)
- [ ] 사업계획서, 법령준수각서, 회원가입계약서(약관), 사무실 계약서류
- [ ] **"양방향 소통 차단방안"** 문서 — 제품 설계와 직결됨 (아래 3.2)

### 3.2 제품 설계에 직접 반영해야 할 금지사항

| 금지 행위 | 처벌 | 제품 설계 대응 |
|---|---|---|
| 유료회원 대상 **양방향 실시간 소통** (채팅·1:1 상담) | 3년 이하 징역 / 1억원 이하 벌금 | **댓글·채팅·DM 기능 전면 미구현.** 고객센터는 이메일 1:1 문의만 두되, 문의 답변에서 종목 언급 금지 (자동 필터 + 상담 매뉴얼) |
| 1:1 개별 종목 상담 | 동일 | 챗봇에 종목 추천 질의가 오면 거부 응답 (프롬프트 가드레일 + 종목명 감지 필터) |
| 선행매매 | 5년 이하 징역 / 2억원 이하 벌금 | 임직원 계좌 신고 및 서비스 노출 종목 매매 제한 내규 |
| 미실현 수익률 광고 | 1억원 이하 과태료 | 백테스트 결과 표기 시 **"과거 시뮬레이션이며 실제 수익이 아님"** 문구 강제 표시 (컴포넌트 레벨) |
| 손실보전·이익보장 약정 | 금지 (2024.8.14~) | 마케팅 카피 검수 프로세스 |

### 3.3 UI 문구 규칙 (코드 상수로 관리)

```ts
// src/lib/constants/copy.ts — 절대 하드코딩 금지, 이 파일만 사용
export const SIGNAL_LABEL = {
  90: '매수조건 강하게 충족',   // ❌ '적극 매수'
  70: '매수조건 충족',
  55: '매수조건 일부 충족',
  45: '중립 구간',
  30: '매도조건 일부 충족',
  10: '매도조건 충족',
} as const;

export const DISCLAIMER = {
  GLOBAL: '본 서비스가 제공하는 정보는 투자 참고자료이며, 투자 권유 또는 종목 추천이 아닙니다. 모든 투자 판단과 그 결과에 대한 책임은 이용자 본인에게 있습니다.',
  BACKTEST: '아래 성과는 과거 데이터에 기반한 시뮬레이션 결과이며, 실제 매매 수익을 보장하지 않습니다. 미래 수익률과 무관합니다.',
  ML: '예측 확률은 통계 모델의 산출값이며 적중을 보장하지 않습니다.',
} as const;
```
- `DISCLAIMER.GLOBAL`은 **모든 페이지 푸터에 상시 노출**
- `DISCLAIMER.BACKTEST`는 백테스트/성과 수치가 렌더링되는 컴포넌트 내부에서 **분리 불가능하게** 함께 렌더

### 3.4 데이터 이용 라이선스
- KRX 시세 데이터의 **재배포·상업적 이용**은 별도 계약이 필요할 수 있음 → 유료화 전 KRX 정보사업부 및 사용 중인 API 제공처의 이용약관 확인 필수
- 뉴스 본문은 **저장·재배포 금지**. 제목·요약·원문 링크만 노출하고 본문은 분석 후 즉시 폐기(휘발성 처리)
- 개인정보보호법: 이메일·결제정보 수집 → 개인정보처리방침, 파기 정책 필요

---

## 4. 데이터 소스 및 수집 설계

### 4.1 소스 매트릭스

| # | 소스 | 제공 데이터 | 인증 | 비용 | 용도 |
|---|---|---|---|---|---|
| D1 | **KRX Data Marketplace Open API** (`openapi.krx.co.kr`) | 지수/주식/증권상품(ETF)/채권/파생/ESG 일별 데이터 | 회원가입 후 인증키 신청 → 관리자 승인 | 무료(승인제) | 일별 시세 정본 |
| D2 | **pykrx** (Python 라이브러리) | OHLCV, 시가총액, PER/PBR/DIV, **투자자별 거래실적**, 공매도 잔고/거래량, ETF NAV·괴리율·PDF(구성종목) | 불필요(일부 KRX 로그인) | 무료 | MVP 백필 및 일배치 |
| D3 | **한국투자증권 KIS Developers** (`apiportal.koreainvestment.com`) | 현재가·호가·체결·일자별, 투자자매매동향, 프로그램매매, 신용잔고, 순위분석, **실시간 WebSocket** | OAuth (App Key/Secret → Access Token), WebSocket 접속키 | 무료(계좌 필요) | 장중 실시간 |
| D4 | **Open DART** (`opendart.fss.or.kr`) | 공시 원문(XML), 주요사항보고서, 지분보고서, 정기보고서 재무 | 인증키 신청 | 무료 | 이벤트 레이어 |
| D5 | 뉴스 (RSS/네이버 검색 API 등) | 제목·요약·링크·발행시각 | 각 소스별 | 무료~ | 감성 분석 |
| D6 | LLM API (Claude) | 감성 스코어링, 자연어 해설 생성 | API Key | 종량 | 이벤트 레이어 + UX |

### 4.2 반드시 지켜야 할 제약

```
KIS REST API: 초당 최대 20건  ← 위반 시 차단
→ 토큰버킷 레이트리미터 필수 (RATE_LIMIT_RPS=18 로 여유 확보)
→ 200종목 실시간 갱신 시 단순 루프 금지. 배치 + 우선순위 큐로 처리
→ Access Token 유효기간 관리(만료 전 갱신), 토큰은 Redis에 단일 인스턴스로 공유

KRX Open API: 서비스별 활용 신청·승인 필요 → 개발 착수 D-14에 미리 신청할 것
Open DART: 인증키당 일일 호출 한도 존재 → 키 사용량 모니터링 + 캐싱
```

**레이트 리미터 구현 스펙**
```python
# ingest/common/rate_limiter.py
class TokenBucket:
    """KIS API 초당 20건 제한 대응. Redis 기반으로 워커 간 공유."""
    def __init__(self, redis, key: str, rate: float = 18.0, capacity: int = 18):
        ...
    async def acquire(self, tokens: int = 1, timeout: float = 30.0) -> None:
        """토큰 확보까지 대기. timeout 초과 시 RateLimitTimeout 예외."""
```

### 4.3 수집 스케줄 (Asia/Seoul 기준)

| 시각 | 작업 | 소스 | 비고 |
|---|---|---|---|
| 08:30 | 영업일 판정, 종목 마스터 동기화 (신규상장/상폐/티커변경) | D2 | 휴장일이면 전체 스킵 |
| 09:00~15:30 (5분) | 장중 시세·거래대금 스냅샷 (Pro 대상 유니버스 500종목) | D3 | 실시간 신호 갱신 |
| 09:00~15:30 (수시) | 신규 공시 폴링 (5분) | D4 | 이벤트 레이어 |
| 15:40 | 일별 OHLCV 확정 수집 | D2/D1 | 정정 대비 D-1도 재수집 |
| 18:00 | **투자자별 거래실적(외국인/기관) 수집** | D2 | KRX 확정치 공개 후 |
| 18:20 | 공매도 잔고 수집 | D2 | |
| 18:30 | **일일 시그널 배치 산출 (전 종목)** | 내부 | 핵심 배치 |
| 19:00 | 테마 스코어 집계, 랭킹 산출 | 내부 | |
| 19:30 | 알림 발송 큐 처리 | 내부 | |
| 매주 토 03:00 | 백테스트 성과 갱신, ML 재학습(Phase 3) | 내부 | |

> **정정 데이터 대응**: KRX는 사후 정정이 발생함. 모든 일별 테이블은 `(ticker, trade_date)` UPSERT 이며, 매일 **직전 5영업일을 재수집**하여 덮어씀.

---

## 5. 시그널 엔진 명세 (본 제품의 핵심)

### 5.1 전체 구조

```
                    ┌─────────────────────────────────────┐
   일별/장중 데이터 →│  L1 기술적 (Technical)   가중 0.40  │
                    │  L2 수급    (Flow)       가중 0.30  │→ 합성 스코어
                    │  L3 이벤트  (Event)      가중 0.15  │   0~100
                    │  L4 ML 예측 (Model)      가중 0.15  │
                    └─────────────────────────────────────┘
                                    ↓
                       시장 레짐(Regime) 보정 계수 적용
                                    ↓
                        최종 스코어 + 근거 리스트 + 자연어 해설
```

- **MVP(Phase 1)**: L1(0.60) + L2(0.40)만 사용, L3·L4 가중 0
- 가중치는 DB 테이블 `signal_weights`에서 관리하여 **재배포 없이 조정 가능**
- 각 레이어는 **-100 ~ +100** 을 반환하고, 최종 합성 후 `(weighted_sum + 100) / 2` 로 0~100 정규화

### 5.2 L1: 기술적 레이어

전 지표는 **일봉 기준**(Pro 실시간은 5분봉 병행). 계산은 Python `pandas` + 자체 구현 (TA-Lib 의존 지양, 재현성 확보).

#### 5.2.1 사용 지표 및 정확한 계산식

| 지표 | 파라미터 | 계산식 |
|---|---|---|
| SMA | 5, 20, 60, 120 | `close.rolling(n).mean()` |
| EMA | 12, 26 | `close.ewm(span=n, adjust=False).mean()` |
| **RSI** | 14 (Wilder) | `delta = close.diff()`<br>`gain = delta.clip(lower=0)`, `loss = (-delta).clip(lower=0)`<br>`avg_gain = gain.ewm(alpha=1/14, adjust=False).mean()`<br>`avg_loss = loss.ewm(alpha=1/14, adjust=False).mean()`<br>`RSI = 100 - 100/(1 + avg_gain/avg_loss)` |
| **MACD** | 12, 26, 9 | `macd = EMA12 - EMA26`<br>`signal = macd.ewm(span=9, adjust=False).mean()`<br>`hist = macd - signal` |
| **볼린저밴드** | 20, 2σ | `mid = SMA20`<br>`std = close.rolling(20).std(ddof=0)`<br>`upper = mid + 2*std`, `lower = mid - 2*std`<br>`%b = (close - lower) / (upper - lower)`<br>`bandwidth = (upper - lower) / mid` |
| **스토캐스틱** | 14, 3, 3 (Slow) | `%K_fast = 100*(close - LL14)/(HH14 - LL14)`<br>`%K_slow = %K_fast.rolling(3).mean()`<br>`%D = %K_slow.rolling(3).mean()` |
| **ATR** | 14 (Wilder) | `TR = max(H-L, |H-C_prev|, |L-C_prev|)`<br>`ATR = TR.ewm(alpha=1/14, adjust=False).mean()` |
| OBV | - | `sign(close.diff()) * volume` 의 누적합 |
| **이격도** | 20, 60 | `100 * close / SMA_n` |
| 거래량비 | 20 | `volume / volume.rolling(20).mean()` |

> ⚠️ **수정주가 필수**: 액면분할·병합·유상증자 시 과거 가격을 조정하지 않으면 골든크로스가 대량 오검출됨. `adj_close`를 별도 컬럼으로 유지하고 **모든 지표는 `adj_close` 기준으로 계산**. 거래량도 분할 비율로 역조정.

#### 5.2.2 L1 스코어 산출 (룰 조합)

```python
# signals/layers/technical.py

def score_technical(df: pd.DataFrame) -> LayerResult:
    """
    df: 최소 250행의 일봉 (adj_close 기준 지표 컬럼 포함), 마지막 행이 평가 기준일
    return: LayerResult(score=-100~100, reasons=[Reason, ...])
    """
    r, reasons = 0.0, []
    cur, prev = df.iloc[-1], df.iloc[-2]

    # --- 추세 (최대 ±35) ---
    if cur.sma5 > cur.sma20 > cur.sma60:
        r += 20; reasons.append(R("정배열", "5·20·60일선 정배열 상태", +20))
    elif cur.sma5 < cur.sma20 < cur.sma60:
        r -= 20; reasons.append(R("역배열", "5·20·60일선 역배열 상태", -20))

    if prev.sma5 <= prev.sma20 and cur.sma5 > cur.sma20:
        r += 15; reasons.append(R("골든크로스", "5일선이 20일선을 상향 돌파", +15))
    if prev.sma5 >= prev.sma20 and cur.sma5 < cur.sma20:
        r -= 15; reasons.append(R("데드크로스", "5일선이 20일선을 하향 돌파", -15))

    # --- 모멘텀 (최대 ±30) ---
    if prev.macd <= prev.macd_signal and cur.macd > cur.macd_signal:
        r += 15; reasons.append(R("MACD 상향교차", "MACD가 시그널선 상향 돌파", +15))
    if prev.macd >= prev.macd_signal and cur.macd < cur.macd_signal:
        r -= 15; reasons.append(R("MACD 하향교차", "MACD가 시그널선 하향 돌파", -15))

    if cur.rsi < 30:
        r += 15; reasons.append(R("RSI 과매도", f"RSI {cur.rsi:.0f} (30 미만)", +15))
    elif cur.rsi > 70:
        r -= 15; reasons.append(R("RSI 과매수", f"RSI {cur.rsi:.0f} (70 초과)", -15))
    elif 45 <= cur.rsi <= 60 and cur.rsi > prev.rsi:
        r += 5;  reasons.append(R("RSI 상승", "중립권에서 상승 전환", +5))

    # --- 변동성/위치 (최대 ±20) ---
    if cur.pct_b < 0.05:
        r += 10; reasons.append(R("밴드 하단", "볼린저밴드 하단 이탈", +10))
    elif cur.pct_b > 0.95:
        r -= 10; reasons.append(R("밴드 상단", "볼린저밴드 상단 접근", -10))

    # 스퀴즈 후 확장 = 방향성 발생
    bw20 = df.bandwidth.rolling(120).quantile(0.15).iloc[-1]
    if prev.bandwidth < bw20 and cur.bandwidth > prev.bandwidth * 1.15:
        d = 10 if cur.close > cur.sma20 else -10
        r += d; reasons.append(R("밴드 확장", "변동성 수축 후 확장 시작", d))

    # --- 거래량 확인 (최대 ±15) ---
    if cur.vol_ratio > 2.0 and cur.close > prev.close:
        r += 15; reasons.append(R("대량 상승", f"거래량 20일 평균 대비 {cur.vol_ratio:.1f}배", +15))
    elif cur.vol_ratio > 2.0 and cur.close < prev.close:
        r -= 15; reasons.append(R("대량 하락", f"거래량 급증 동반 하락", -15))

    return LayerResult(score=clamp(r, -100, 100), reasons=reasons)
```

**과열 필터 (스코어와 별도로 반드시 적용)**
```python
# 이격도 과열 시 매수 스코어를 강제 감쇠 — 급등 추격 방지
if cur.disparity20 > 115:
    r = min(r, 20)   # 20일선 대비 15% 이상 위 → 매수 신호 상한
if cur.disparity20 > 125:
    r = min(r, -10)  # 25% 이상 → 오히려 경계
```

### 5.3 L2: 수급 레이어 (한국 시장 차별점)

```python
# signals/layers/flow.py

def score_flow(df: pd.DataFrame, mktcap: float) -> LayerResult:
    """
    df 필수 컬럼: frgn_net (외국인 순매수대금), inst_net (기관 순매수대금),
                 indi_net, short_balance_ratio (공매도 잔고비율), prog_net
    mktcap: 시가총액(원)
    """
    r, reasons = 0.0, []
    cur = df.iloc[-1]

    # 1) 연속 순매수 일수 (최대 ±25)
    frgn_streak = consecutive_positive(df.frgn_net)
    inst_streak = consecutive_positive(df.inst_net)
    if frgn_streak >= 5:
        r += 15; reasons.append(R("외국인 연속 순매수", f"{frgn_streak}일 연속", +15))
    elif frgn_streak >= 3:
        r += 8
    if inst_streak >= 5:
        r += 10; reasons.append(R("기관 연속 순매수", f"{inst_streak}일 연속", +10))
    elif inst_streak >= 3:
        r += 5

    frgn_sell_streak = consecutive_negative(df.frgn_net)
    if frgn_sell_streak >= 5:
        r -= 15; reasons.append(R("외국인 연속 순매도", f"{frgn_sell_streak}일 연속", -15))

    # 2) 순매수 강도 = 5일 누적 순매수 / 시가총액 (최대 ±30)
    #    시총 대비로 정규화해야 대형주·소형주 비교가 가능
    intensity = (df.frgn_net.tail(5).sum() + df.inst_net.tail(5).sum()) / mktcap
    if intensity > 0.010:     # 시총의 1% 이상 순매수
        r += 30; reasons.append(R("수급 강함", f"5일 순매수 시총대비 {intensity*100:.2f}%", +30))
    elif intensity > 0.003:
        r += 15; reasons.append(R("수급 양호", f"5일 순매수 시총대비 {intensity*100:.2f}%", +15))
    elif intensity < -0.010:
        r -= 30; reasons.append(R("수급 이탈", f"5일 순매도 시총대비 {intensity*100:.2f}%", -30))
    elif intensity < -0.003:
        r -= 15

    # 3) 쌍끌이 (외국인+기관 동시 순매수) 보너스 (최대 +20)
    both = ((df.frgn_net.tail(3) > 0) & (df.inst_net.tail(3) > 0)).sum()
    if both == 3:
        r += 20; reasons.append(R("쌍끌이 매수", "외국인·기관 3일 동시 순매수", +20))

    # 4) 공매도 잔고 (최대 ±15)
    sb_chg = cur.short_balance_ratio - df.short_balance_ratio.iloc[-6]
    if cur.short_balance_ratio > 3.0 and sb_chg > 0.5:
        r -= 15; reasons.append(R("공매도 증가", f"잔고비율 {cur.short_balance_ratio:.1f}%", -15))
    elif cur.short_balance_ratio > 3.0 and sb_chg < -0.5:
        r += 10; reasons.append(R("숏커버링 가능성", "공매도 잔고 감소 중", +10))

    # 5) 거래대금 유동성 필터 (스코어 아닌 게이트)
    if df.trade_value.tail(20).mean() < 500_000_000:  # 20일 평균 5억 미만
        return LayerResult(score=0, reasons=[R("유동성 부족", "거래대금 과소로 신호 미산출", 0)],
                           gate_failed=True)

    return LayerResult(score=clamp(r, -100, 100), reasons=reasons)
```

### 5.4 L3: 이벤트 레이어 (공시·뉴스) — Phase 2

#### 5.4.1 공시 규칙 기반 스코어 (DART 보고서명 매칭)

| 공시 유형 | 스코어 | 유효기간 | 비고 |
|---|---|---|---|
| 자기주식 취득 결정 | +25 | 10영업일 | 취득 규모/시총 비율로 가중 |
| 단일판매·공급계약 체결 | +20 | 5영업일 | 계약금액/매출액 비율 ≥10%일 때만 |
| 무상증자 결정 | +15 | 5영업일 | |
| 현금·현물배당 결정(증액) | +10 | 3영업일 | |
| 유상증자 결정 (일반공모/주주배정) | -25 | 10영업일 | 규모/시총 비율로 가중 |
| 전환사채(CB)·신주인수권부사채(BW) 발행 | -20 | 10영업일 | |
| 최대주주 변경 | -10 | 10영업일 | 방향 불확실 → 소폭 |
| 감사의견 거절/한정, 관리종목 지정 | **게이트 차단** | 30영업일 | 스코어 미산출, 경고 배지 |
| 횡령·배임 혐의 발생 | **게이트 차단** | 30영업일 | 동일 |
| 불성실공시법인 지정 | -30 | 20영업일 | |

```python
# 규모 가중 예시
def weighted_event_score(base: int, amount: float, mktcap: float) -> float:
    ratio = amount / mktcap
    if ratio < 0.01:  return base * 0.3
    if ratio < 0.05:  return base * 0.7
    if ratio < 0.15:  return base * 1.0
    return base * 1.3
```

#### 5.4.2 뉴스 감성 (LLM)

```
입력: 최근 24시간 해당 종목/테마 관련 뉴스 제목 + 요약 (최대 20건)
모델: claude (배치 호출, 종목당 1콜)
출력 JSON 스키마:
{
  "sentiment": -1.0 ~ 1.0,        // 주가 영향 방향
  "confidence": 0.0 ~ 1.0,
  "materiality": "high|medium|low", // 주가 영향력
  "key_topics": ["수주", "실적개선"],
  "summary_ko": "1문장 요약 (40자 이내)"
}
```
프롬프트 가드레일:
- "투자 의견이 아니라 **뉴스의 톤과 실질 영향도만** 평가하라"
- "추측 금지. 기사에 없는 내용은 만들지 마라"
- "광고성/단순 시황 기사는 materiality=low로 분류하라"

L3 스코어 = `공시 스코어 합계 + (sentiment × confidence × materiality_weight × 30)`
(materiality_weight: high=1.0, medium=0.5, low=0.15)

**뉴스 캐시 정책**: 원문 본문은 저장하지 않음. `(url_hash, 분석결과 JSON, 분석시각)`만 DB에 보관.

### 5.5 L4: ML 레이어 — Phase 3

| 항목 | 스펙 |
|---|---|
| 문제 정의 | 이진 분류 — "향후 10영업일 내 +5% 상승이 -3% 하락보다 먼저 발생하는가" |
| 라벨링 | **Triple Barrier Method** (상단 +5%, 하단 -3%, 시간 10일). 시간 배리어 도달 시 수익률 부호로 라벨 |
| 모델 | LightGBM (`binary`, `is_unbalance=True`) — 해석 가능성과 학습 속도 우선. 딥러닝은 데이터 규모상 부적합 |
| 피처 (~60개) | L1 지표 전량 + 5/10/20/60일 수익률 + 변동성(20일 표준편차) + 수급 지표(순매수 강도, 연속일수) + 시총 로그, 거래대금 로그 + 섹터 원핫 + KOSPI 상대강도 + 시장 레짐 플래그 |
| 검증 | **Purged Walk-Forward CV** — 학습 3년 / 검증 6개월 롤링, 라벨 룩어헤드 방지를 위해 학습·검증 사이 10일 embargo |
| 재학습 | 매주 토요일 03:00, 최근 5년 데이터 |
| 성능 게이트 | 검증 AUC < 0.55 이면 **배포 중단, 이전 모델 유지** (자동) |
| 출력 | `P(상승)` 확률 → `(P - 0.5) * 200` 으로 -100~100 변환 |
| 드리프트 감시 | 주간 예측 분포 PSI > 0.25 시 알림 |

> **필수 주의**: 과거 시점에 알 수 없었던 데이터(예: 정정 후 확정 시가총액, 당일 18시에야 공개되는 투자자별 실적)를 학습에 쓰면 백테스트가 비현실적으로 좋아짐. 모든 피처는 **`as_of` 타임스탬프**를 갖고, 시점 t의 예측에는 `as_of <= t` 인 데이터만 사용 (Point-in-Time 원칙).

### 5.6 시장 레짐 보정

전체 시장이 하락장일 때 개별 종목 매수 신호를 그대로 내보내면 성과가 크게 악화됨.

```python
def market_regime(kospi: pd.DataFrame) -> str:
    idx = kospi.iloc[-1]
    if idx.close > idx.sma120 and idx.sma20 > idx.sma60:  return "BULL"
    if idx.close < idx.sma120 and idx.sma20 < idx.sma60:  return "BEAR"
    return "NEUTRAL"

REGIME_ADJ = {
    "BULL":    {"buy": 1.10, "sell": 0.90},
    "NEUTRAL": {"buy": 1.00, "sell": 1.00},
    "BEAR":    {"buy": 0.70, "sell": 1.20},   # 하락장에선 매수신호 30% 감쇠
}
```

### 5.7 최종 합성 및 등급

```python
raw = (w1*L1 + w2*L2 + w3*L3 + w4*L4) / (w1+w2+w3+w4)
adj = raw * (REGIME_ADJ[regime]["buy"] if raw > 0 else REGIME_ADJ[regime]["sell"])
score = round((clamp(adj, -100, 100) + 100) / 2)   # 0~100
```

| 스코어 | 등급 | 표시 라벨 | 색상 |
|---|---|---|---|
| 80~100 | S | 매수조건 강하게 충족 | `#0F7B3E` |
| 65~79 | A | 매수조건 충족 | `#2E9E5B` |
| 55~64 | B | 매수조건 일부 충족 | `#7FB77E` |
| 45~54 | C | 중립 구간 | `#8A8F98` |
| 35~44 | D | 매도조건 일부 충족 | `#D98F6B` |
| 0~34 | E | 매도조건 충족 | `#C2472F` |

**게이트 실패 시**: 스코어 대신 `"신호 미산출"` + 사유 표시 (관리종목, 거래정지, 유동성 부족, 상장 60일 미만, 데이터 결측)

### 5.8 매도(청산) 신호 — 별도 로직

매수 신호와 매도 신호는 대칭이 아닙니다. 보유 중인 사용자에게는 **관심종목 등록 시점을 진입가로 간주**하여 별도 규칙 적용:

```python
def exit_signal(entry_price, cur, atr) -> ExitSignal | None:
    ret = (cur.close - entry_price) / entry_price
    if cur.close < entry_price - 2.0 * atr:
        return ExitSignal("손절조건 도달", f"진입가 대비 -{abs(ret)*100:.1f}% (ATR 2배 이탈)", "HIGH")
    if ret > 0.20 and cur.close < cur.sma20:
        return ExitSignal("이익보전조건", "20% 이상 상승 후 20일선 이탈", "HIGH")
    if cur.rsi > 75 and cur.pct_b > 0.95:
        return ExitSignal("과열조건", "RSI·볼린저 동시 과열", "MEDIUM")
    if consecutive_negative_flow(cur) >= 3 and ret > 0:
        return ExitSignal("수급이탈", "외국인·기관 3일 연속 순매도", "MEDIUM")
    return None
```

### 5.9 테마 스코어

```
테마 스코어 = Σ(구성종목 스코어 × 시총가중) 의 상위 70% 절사평균
테마 모멘텀  = 테마 스코어 5일 변화량
테마 랭킹    = 테마 스코어 × 0.6 + 정규화(테마 모멘텀) × 0.4
```
- 테마 마스터는 초기 **수동 큐레이션 150개**(반도체, 2차전지, 원전, 바이오시밀러, 방산, 조선, AI반도체 …)로 시작
- 종목-테마 매핑은 다대다. 신규 테마는 뉴스 클러스터링으로 후보 제안 → **운영자 승인 후 반영** (자동 반영 금지: 오분류 리스크)

---

## 6. 백테스트 엔진 명세

### 6.1 왜 중요한가
"이 신호가 실제로 통하는가"를 보여주지 못하면 제품의 신뢰가 성립하지 않습니다. **모든 신호 조건은 백테스트 성과가 붙어야 화면에 노출됩니다.**

### 6.2 비용 모델 (2026년 기준 — 반드시 반영)

```python
# backtest/costs.py — 세율은 DB(config) 값으로 주입, 하드코딩 금지
BUY_COST   = 0.00015                   # 위탁수수료 0.015% (증권사별 상이)
TAX_KOSPI  = 0.0005 + 0.0015           # 증권거래세 0.05% + 농어촌특별세 0.15% = 0.20%
TAX_KOSDAQ = 0.0020                    # 0.20% (농특세 미부과)
SELL_COST  = BUY_COST + TAX_BY_MARKET[market]
SLIPPAGE   = 0.0015                    # 시장가 슬리피지 가정 0.15%
```
> 2026-01-01 양도분부터 적용된 세율입니다 (직전 2025년은 양 시장 모두 0.15%). **세율은 세법 개정으로 바뀌므로 반드시 설정값으로 분리하고, 과거 구간 백테스트에는 해당 시점의 세율을 적용**해야 합니다 (`tax_schedule` 테이블: `effective_from, market, rate`).

왕복 비용 ≈ **0.53%** (수수료 0.03% + 세금 0.20% + 슬리피지 0.30%). 이를 반영하지 않은 백테스트는 무의미합니다.

### 6.3 시뮬레이션 규칙 (룩어헤드 방지)

| 항목 | 규칙 |
|---|---|
| 신호 산출 시점 | T일 종가 기준 |
| 체결 시점 | **T+1일 시가** (종가 신호를 종가에 체결하는 것은 불가능) |
| 상하한가 | T+1 시가가 상한가면 미체결 처리 |
| 거래정지 | 해당 기간 보유 유지, 매도 불가 |
| 유니버스 | **각 시점의 실제 상장 종목** (상폐 종목 포함 — 생존편향 제거) |
| 수정주가 | 필수 |
| 포지션 | 동일 비중, 최대 20종목, 종목당 5% |

### 6.4 산출 지표

| 지표 | 계산 |
|---|---|
| 총수익률 / CAGR | `(final/initial)^(252/days) - 1` |
| MDD | `min(equity/equity.cummax() - 1)` |
| Sharpe | `(mean(daily_ret) - rf/252) / std(daily_ret) * sqrt(252)`, rf=3.0% |
| Sortino | 하방편차 기준 |
| 승률 | 이익 거래 수 / 전체 거래 수 |
| 손익비 | 평균이익 / 평균손실 |
| 평균 보유일 | |
| 벤치마크 대비 | KOSPI/KOSDAQ 동기간 수익률, 초과수익(alpha) |
| 월별 수익률 히트맵 | 표시용 |

### 6.5 표시 규칙 (규제)
- 모든 백테스트 결과 카드에 `DISCLAIMER.BACKTEST` **분리 불가능하게 병기**
- "예상 수익률", "목표가", "기대 수익" 등의 문구 사용 금지
- 최대 손실(MDD)을 수익률과 **동일한 크기·굵기**로 표시 (수익만 강조 = 과장광고 소지)

---

## 7. 화면 정의

### 7.1 사이트맵

```
/                       홈 (오늘의 시장 + 신호 요약)
/themes                 테마 랭킹
/themes/[slug]          테마 상세 (구성종목, 수급, 히스토리)
/stocks                 종목 탐색 / 스크리너
/stocks/[ticker]        ★ 종목 상세 (핵심 화면)
/etfs                   ETF 랭킹
/etfs/[ticker]          ETF 상세 (NAV·괴리율·구성종목)
/screener               스크리너 (조건 검색)
/backtest               백테스터 (Basic 이상)
/watchlist              내 관심종목
/alerts                 알림 설정 / 히스토리
/settings               계정·플랜·결제
/guide                  지표 설명 (초보자용)
/legal/terms            이용약관
/legal/privacy          개인정보처리방침
/legal/disclaimer       투자 유의사항 (필수)
```

### 7.2 핵심 화면: 종목 상세 `/stocks/[ticker]`

```
┌───────────────────────────────────────────────────────────────┐
│  삼성전자 005930  KOSPI · 반도체                    [♡ 관심]  │
│  78,900원  ▲1,200 (+1.55%)         2026-08-14 종가 기준       │
├───────────────────────────────────────────────────────────────┤
│  ┌─ 종합 신호 ────────────────────────────────────────────┐   │
│  │            ╭────────╮                                  │   │
│  │            │   72   │  A · 매수조건 충족                │   │
│  │            ╰────────╯  전일 65 → 오늘 72 (▲7)          │   │
│  │                                                        │   │
│  │  기술적  ████████░░  +38    수급  ██████░░░░  +25      │   │
│  │  이벤트  ███░░░░░░░  +10    ML    ─ (Pro 전용)         │   │
│  │                                                        │   │
│  │  💬 "20일선을 회복하며 정배열에 진입했고, 외국인이       │   │
│  │      4일 연속 순매수 중입니다. 다만 RSI가 68로          │   │
│  │      과매수 구간에 근접해 있습니다."                     │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─ 신호 근거 ────────────────────────────────────────────┐   │
│  │ ✅ 정배열          5·20·60일선 정배열 상태        +20   │   │
│  │ ✅ MACD 상향교차   MACD가 시그널선 상향 돌파      +15   │   │
│  │ ✅ 외국인 연속매수 4일 연속 순매수 (1,240억)      +15   │   │
│  │ ⚠️ RSI 과매수 근접 RSI 68                          -5   │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                               │
│  [ 차트 ] 일봉 + 이동평균 + 볼린저 / 하단: 거래량, RSI, MACD   │
│           신호 발생 시점을 차트 위 마커로 표시                 │
│                                                               │
│  ┌─ 이 조건의 과거 성과 ──────────────────────────────────┐   │
│  │ 동일 조건 충족 사례 최근 3년 47회                       │   │
│  │ 승률 55.3%  │ 평균수익 +3.8%  │ 평균손실 -2.6%          │   │
│  │ 평균보유 8.4일 │ 최대낙폭 -12.1%                        │   │
│  │ ⓘ 과거 시뮬레이션 결과이며 실제 수익을 보장하지 않습니다│   │
│  └────────────────────────────────────────────────────────┘   │
│                                                               │
│  [수급] 외국인/기관/개인 20일 순매수 차트 + 공매도 잔고        │
│  [공시·뉴스] 최근 30일 이벤트 타임라인 (감성 배지)             │
│  [관련 테마] 반도체(3위) · AI반도체(1위) · HBM(2위)            │
└───────────────────────────────────────────────────────────────┘
        ※ 페이지 하단 고정: DISCLAIMER.GLOBAL
```

### 7.3 홈 `/`

1. **시장 요약 바** — KOSPI/KOSDAQ 지수, 등락, 시장 레짐 배지(강세장/중립/약세장), 외국인·기관 시장 전체 순매수
2. **오늘의 신호 변화** — 스코어가 크게 오른 종목 Top 10 / 크게 내린 Top 10
3. **테마 히트맵** — 트리맵, 크기=시총합, 색=테마 스코어
4. **관심종목 요약** (로그인 시) — 스코어 변화, 청산 신호 발생 종목 우선 노출
5. **신규 이벤트** — 오늘의 주요 공시 (Phase 2)

### 7.4 스크리너 `/screener`

**프리셋 (Free 3개 / 유료 전체)**
| 프리셋 | 조건 |
|---|---|
| 눌림목 후보 | 정배열 & RSI 40~55 & 20일선 ±3% & 외국인 3일 순매수 |
| 수급 집중 | 5일 순매수강도 상위 5% & 거래대금 20일평균 2배 |
| 과매도 반등 | RSI<30 & 볼린저 %b<0.05 & 거래대금 100억↑ |
| 신고가 돌파 | 52주 신고가 & 거래량 3배 & 시총 3천억↑ |
| 배당+저평가 | PER<10 & PBR<1 & 배당수익률>3% |

**커스텀 빌더 (Pro)** — 지표/수급/재무 필드에 대해 `AND/OR` 조합, 조건 저장, 조건 충족 시 알림 연결

### 7.5 알림 `/alerts`

| 알림 유형 | 트리거 | 등급 |
|---|---|---|
| 스코어 등급 상승 | C→B, B→A, A→S 전이 | Free~ |
| 스코어 등급 하락 | 관심종목이 D 이하 진입 | Free~ |
| 청산 조건 발생 | 5.8절 exit_signal | Basic~ |
| 스크리너 조건 충족 | 저장한 조건에 신규 종목 편입 | Basic~ |
| 테마 급등 | 테마 스코어 5일 변화 상위 | Basic~ |
| 주요 공시 | 관심종목 이벤트 스코어 |±20| 이상 | Basic~ |

채널: **웹푸시(Web Push API) + 이메일**. (카카오 알림톡은 Phase 3 — 발신 심사 필요)
발송 시각: 장 마감 후 배치는 **19:30 일괄**, 장중 알림(Pro)은 즉시.
**야간 발송 금지**: 21:00~08:00 발송 보류 후 익일 08:30 묶음 발송.

---

## 8. 기술 아키텍처

### 8.1 스택 선정

| 레이어 | 기술 | 선정 이유 |
|---|---|---|
| 프론트엔드 | **Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui** | SSR로 SEO 확보(종목 페이지 검색 유입이 핵심 채널), 단일 저장소 |
| 차트 | **lightweight-charts** (TradingView) | 금융 차트 전용, 번들 45KB, 성능 우수 |
| API 서버 | **FastAPI (Python 3.12) + Pydantic v2** | 시그널 계산이 pandas/numpy 기반이라 Python 통일이 유리 |
| 배치/스케줄러 | **Celery + Celery Beat + Redis** | 스케줄 + 재시도 + 분산 |
| DB | **PostgreSQL 16 + TimescaleDB 확장** | 시계열 하이퍼테이블로 일봉/분봉 압축·조회 최적화 |
| 캐시 | **Redis 7** | 스코어 캐시, 레이트리미터 토큰버킷, Celery 브로커 |
| 인증 | **Auth.js (NextAuth)** — 이메일 매직링크 + 카카오/네이버 OAuth | 국내 사용자 가입 이탈 최소화 |
| 결제 | **토스페이먼츠 정기결제** | 국내 정기구독 표준 |
| 배포 | 프론트: Vercel / 백엔드·배치: Docker on AWS ECS(또는 단일 EC2 + docker-compose로 시작) | MVP는 단일 서버로 충분 |
| 모니터링 | Sentry(에러) + Grafana/Prometheus(배치 지표) | 배치 실패 감지가 서비스 신뢰의 핵심 |

### 8.2 저장소 구조

```
signal-station/
├─ apps/
│  ├─ web/                     # Next.js
│  │  ├─ app/
│  │  │  ├─ (marketing)/       # 랜딩, 가격
│  │  │  ├─ (app)/             # 로그인 필요 영역
│  │  │  │  ├─ stocks/[ticker]/page.tsx
│  │  │  │  ├─ themes/...
│  │  │  │  ├─ screener/...
│  │  │  │  └─ backtest/...
│  │  │  └─ api/               # BFF (인증 프록시만)
│  │  ├─ components/
│  │  │  ├─ signal/            # SignalGauge, LayerBar, ReasonList
│  │  │  ├─ chart/             # PriceChart, FlowChart
│  │  │  └─ ui/                # shadcn
│  │  └─ lib/constants/copy.ts # ★ 3.3절 문구 상수
│  └─ api/                     # FastAPI
│     ├─ routers/              # stocks, themes, signals, screener, backtest, alerts, auth
│     ├─ services/
│     ├─ schemas/              # Pydantic
│     └─ deps.py               # 플랜별 권한 가드
├─ packages/
│  ├─ ingest/                  # 데이터 수집
│  │  ├─ sources/{krx,kis,dart,news}.py
│  │  ├─ common/rate_limiter.py
│  │  └─ tasks.py              # Celery task 정의
│  ├─ signals/                 # ★ 시그널 엔진
│  │  ├─ indicators.py         # 5.2.1 계산식
│  │  ├─ layers/{technical,flow,event,model}.py
│  │  ├─ regime.py
│  │  ├─ composer.py           # 5.7 합성
│  │  ├─ exit.py               # 5.8
│  │  └─ theme.py              # 5.9
│  ├─ backtest/
│  │  ├─ engine.py
│  │  ├─ costs.py              # 6.2
│  │  └─ metrics.py
│  └─ ml/                      # Phase 3
│     ├─ features.py
│     ├─ labeling.py           # triple barrier
│     ├─ train.py
│     └─ registry.py
├─ db/migrations/              # Alembic
├─ tests/
└─ docker-compose.yml
```

### 8.3 성능 목표

| 항목 | 목표 |
|---|---|
| 종목 상세 페이지 LCP | < 2.0s (P75) |
| 신호 API 응답 | < 200ms (P95, 캐시 히트) |
| 일일 전종목 배치 (약 2,700종목) | < 15분 |
| 스크리너 쿼리 | < 1.5s |
| 가용성 | 월 99.5% (장중 09:00~15:30은 99.9%) |

---

## 9. 데이터베이스 스키마

```sql
-- ========== 마스터 ==========
CREATE TABLE stocks (
  ticker          VARCHAR(6) PRIMARY KEY,          -- '005930'
  isin            VARCHAR(12),
  name_ko         VARCHAR(100) NOT NULL,
  name_en         VARCHAR(100),
  market          VARCHAR(10) NOT NULL,            -- KOSPI | KOSDAQ
  sector_code     VARCHAR(20),
  sector_name     VARCHAR(50),
  asset_type      VARCHAR(10) NOT NULL DEFAULT 'STOCK', -- STOCK | ETF | ETN
  listed_date     DATE,
  delisted_date   DATE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  is_managed      BOOLEAN NOT NULL DEFAULT FALSE,  -- 관리종목
  is_suspended    BOOLEAN NOT NULL DEFAULT FALSE,  -- 거래정지
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_stocks_market_active ON stocks(market, is_active);

-- ========== 시세 (TimescaleDB 하이퍼테이블) ==========
CREATE TABLE prices_daily (
  ticker        VARCHAR(6) NOT NULL REFERENCES stocks(ticker),
  trade_date    DATE       NOT NULL,
  open          NUMERIC(14,2), high NUMERIC(14,2),
  low           NUMERIC(14,2), close NUMERIC(14,2),
  volume        BIGINT,
  trade_value   BIGINT,                            -- 거래대금(원)
  adj_close     NUMERIC(14,4) NOT NULL,            -- ★ 수정주가 (지표 계산 기준)
  adj_factor    NUMERIC(12,8) NOT NULL DEFAULT 1,
  market_cap    BIGINT,
  shares_out    BIGINT,
  change_rate   NUMERIC(8,4),
  PRIMARY KEY (ticker, trade_date)
);
SELECT create_hypertable('prices_daily', 'trade_date', chunk_time_interval => INTERVAL '1 year');

-- ========== 수급 ==========
CREATE TABLE flows_daily (
  ticker              VARCHAR(6) NOT NULL,
  trade_date          DATE NOT NULL,
  frgn_net            BIGINT,      -- 외국인 순매수 대금(원)
  inst_net            BIGINT,      -- 기관 합계
  inst_pension_net    BIGINT,      -- 연기금
  inst_trust_net      BIGINT,      -- 투신
  indi_net            BIGINT,      -- 개인
  prog_net            BIGINT,      -- 프로그램
  frgn_hold_ratio     NUMERIC(6,3),
  short_volume        BIGINT,
  short_balance       BIGINT,
  short_balance_ratio NUMERIC(6,3),
  PRIMARY KEY (ticker, trade_date)
);
SELECT create_hypertable('flows_daily', 'trade_date', chunk_time_interval => INTERVAL '1 year');

-- ========== 지표 (사전 계산) ==========
CREATE TABLE indicators_daily (
  ticker VARCHAR(6) NOT NULL, trade_date DATE NOT NULL,
  sma5 NUMERIC(14,4), sma20 NUMERIC(14,4), sma60 NUMERIC(14,4), sma120 NUMERIC(14,4),
  ema12 NUMERIC(14,4), ema26 NUMERIC(14,4),
  rsi14 NUMERIC(6,2),
  macd NUMERIC(14,4), macd_signal NUMERIC(14,4), macd_hist NUMERIC(14,4),
  bb_mid NUMERIC(14,4), bb_upper NUMERIC(14,4), bb_lower NUMERIC(14,4),
  pct_b NUMERIC(8,4), bandwidth NUMERIC(8,4),
  stoch_k NUMERIC(6,2), stoch_d NUMERIC(6,2),
  atr14 NUMERIC(14,4), obv BIGINT,
  disparity20 NUMERIC(8,2), disparity60 NUMERIC(8,2),
  vol_ratio20 NUMERIC(8,3),
  high_52w NUMERIC(14,2), low_52w NUMERIC(14,2),
  rs_kospi NUMERIC(8,4),                            -- KOSPI 대비 상대강도
  PRIMARY KEY (ticker, trade_date)
);
SELECT create_hypertable('indicators_daily', 'trade_date', chunk_time_interval => INTERVAL '1 year');

-- ========== 시그널 ==========
CREATE TABLE signals_daily (
  ticker         VARCHAR(6) NOT NULL,
  trade_date     DATE NOT NULL,
  score          SMALLINT NOT NULL,          -- 0~100
  grade          CHAR(1)  NOT NULL,          -- S,A,B,C,D,E
  score_tech     SMALLINT, score_flow SMALLINT,
  score_event    SMALLINT, score_model SMALLINT,
  regime         VARCHAR(8) NOT NULL,        -- BULL|NEUTRAL|BEAR
  reasons        JSONB NOT NULL,             -- [{code,label,detail,delta}]
  narrative_ko   TEXT,                       -- LLM 생성 해설
  gate_failed    BOOLEAN NOT NULL DEFAULT FALSE,
  gate_reason    VARCHAR(50),
  engine_version VARCHAR(20) NOT NULL,       -- 재현성: 'v1.2.0'
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (ticker, trade_date)
);
CREATE INDEX idx_signals_date_score ON signals_daily(trade_date, score DESC);
CREATE INDEX idx_signals_reasons ON signals_daily USING GIN (reasons);

-- ========== 테마 ==========
CREATE TABLE themes (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(50) UNIQUE NOT NULL,
  name_ko VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  curated_by VARCHAR(20) NOT NULL DEFAULT 'MANUAL'  -- MANUAL | AUTO_APPROVED
);
CREATE TABLE theme_members (
  theme_id INT NOT NULL REFERENCES themes(id),
  ticker VARCHAR(6) NOT NULL REFERENCES stocks(ticker),
  weight NUMERIC(5,3) NOT NULL DEFAULT 1.0,
  is_core BOOLEAN NOT NULL DEFAULT FALSE,           -- 대장주 여부
  PRIMARY KEY (theme_id, ticker)
);
CREATE TABLE theme_signals_daily (
  theme_id INT NOT NULL, trade_date DATE NOT NULL,
  score NUMERIC(6,2) NOT NULL,
  momentum_5d NUMERIC(8,3),
  rank INT,
  member_count INT,
  top_tickers JSONB,
  PRIMARY KEY (theme_id, trade_date)
);

-- ========== 이벤트 (Phase 2) ==========
CREATE TABLE disclosures (
  id BIGSERIAL PRIMARY KEY,
  rcept_no VARCHAR(20) UNIQUE NOT NULL,      -- DART 접수번호
  ticker VARCHAR(6), corp_code VARCHAR(8),
  report_name VARCHAR(200) NOT NULL,
  event_type VARCHAR(40),                    -- 5.4.1 분류 코드
  event_score NUMERIC(6,2),
  amount BIGINT,
  received_at TIMESTAMPTZ NOT NULL,
  expires_on DATE,                           -- 유효기간
  raw_url TEXT
);
CREATE TABLE news_sentiments (
  id BIGSERIAL PRIMARY KEY,
  url_hash CHAR(64) UNIQUE NOT NULL,         -- 본문 미저장, 해시만
  ticker VARCHAR(6), theme_id INT,
  title VARCHAR(300), source VARCHAR(50), url TEXT,
  published_at TIMESTAMPTZ NOT NULL,
  sentiment NUMERIC(4,3), confidence NUMERIC(4,3),
  materiality VARCHAR(10), key_topics JSONB, summary_ko VARCHAR(200),
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========== 사용자 ==========
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  nickname VARCHAR(50),
  plan VARCHAR(10) NOT NULL DEFAULT 'FREE',        -- FREE|BASIC|PRO
  plan_expires_at TIMESTAMPTZ,
  terms_agreed_at TIMESTAMPTZ NOT NULL,
  disclaimer_ack_at TIMESTAMPTZ,                   -- ★ 투자유의사항 확인 (규제 대응)
  marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE watchlists (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticker VARCHAR(6) NOT NULL,
  memo VARCHAR(200),
  entry_price NUMERIC(14,2),                       -- 5.8 청산신호 기준가
  entry_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, ticker)
);
CREATE TABLE alert_rules (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rule_type VARCHAR(30) NOT NULL,                  -- GRADE_UP|GRADE_DOWN|EXIT|SCREENER|THEME|DISCLOSURE
  target JSONB NOT NULL,                           -- {ticker} | {screener_id} | {theme_id}
  channels VARCHAR(20)[] NOT NULL DEFAULT '{WEB_PUSH}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE alert_logs (
  id BIGSERIAL PRIMARY KEY,
  rule_id BIGINT REFERENCES alert_rules(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  title VARCHAR(200), body TEXT, payload JSONB,
  sent_at TIMESTAMPTZ, read_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'QUEUED'
);

-- ========== 백테스트 ==========
CREATE TABLE backtest_runs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100),
  config JSONB NOT NULL,           -- 조건, 기간, 유니버스, 포지션 규칙
  status VARCHAR(20) NOT NULL DEFAULT 'QUEUED',
  metrics JSONB,                   -- CAGR, MDD, Sharpe, 승률 ...
  equity_curve JSONB,              -- [[date, value], ...]
  trades JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);

-- ========== 운영 ==========
CREATE TABLE signal_weights (        -- 재배포 없이 가중치 조정
  id SERIAL PRIMARY KEY,
  layer VARCHAR(10) NOT NULL UNIQUE, -- TECH|FLOW|EVENT|MODEL
  weight NUMERIC(4,3) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE ingest_runs (           -- 배치 감시
  id BIGSERIAL PRIMARY KEY,
  job_name VARCHAR(50) NOT NULL,
  target_date DATE,
  status VARCHAR(20) NOT NULL,
  row_count INT, error TEXT,
  started_at TIMESTAMPTZ NOT NULL, finished_at TIMESTAMPTZ
);
CREATE TABLE trading_calendar (
  trade_date DATE PRIMARY KEY,
  is_open BOOLEAN NOT NULL,
  note VARCHAR(50)
);
CREATE TABLE tax_schedule (          -- 세법 개정 대응 (백테스트 시점별 세율)
  effective_from DATE NOT NULL,
  market VARCHAR(10) NOT NULL,       -- KOSPI | KOSDAQ
  tax_rate NUMERIC(7,6) NOT NULL,    -- 증권거래세+농특세 합계
  PRIMARY KEY (effective_from, market)
);
-- seed: ('2025-01-01','KOSPI',0.0015), ('2025-01-01','KOSDAQ',0.0015),
--       ('2026-01-01','KOSPI',0.0020), ('2026-01-01','KOSDAQ',0.0020)
```

---

## 10. API 명세 (FastAPI)

### 10.1 공통
- Base: `/api/v1`
- 인증: `Authorization: Bearer <JWT>`
- 오류: `{"error": {"code": "PLAN_LIMIT_EXCEEDED", "message": "...", "detail": {...}}}`
- 플랜 가드: `Depends(require_plan("BASIC"))`

### 10.2 엔드포인트

```http
### 종목
GET  /api/v1/stocks?market=KOSPI&q=삼성&limit=20
GET  /api/v1/stocks/{ticker}
GET  /api/v1/stocks/{ticker}/prices?from=2025-01-01&to=2026-08-14&interval=1d
GET  /api/v1/stocks/{ticker}/flows?days=60
GET  /api/v1/stocks/{ticker}/signal            → SignalDetail
GET  /api/v1/stocks/{ticker}/signal/history?days=90
GET  /api/v1/stocks/{ticker}/condition-stats   → 현재 조건의 과거 성과 (7.2 하단 카드)
GET  /api/v1/stocks/{ticker}/events?days=30    (BASIC+)

### 신호 랭킹
GET  /api/v1/signals/top?grade=S&market=KOSDAQ&limit=50
GET  /api/v1/signals/movers?direction=up&limit=10   # 스코어 급변

### 테마
GET  /api/v1/themes?sort=rank&limit=50
GET  /api/v1/themes/{slug}
GET  /api/v1/themes/{slug}/members
GET  /api/v1/themes/{slug}/history?days=90

### ETF
GET  /api/v1/etfs?sort=score
GET  /api/v1/etfs/{ticker}                     → NAV, 괴리율, 추적오차, PDF 구성종목

### 스크리너
GET  /api/v1/screener/presets
POST /api/v1/screener/run                      { conditions: [...], universe: {...} }
POST /api/v1/screener/saved                    (PRO) 조건 저장
GET  /api/v1/screener/saved

### 백테스트  (BASIC+)
POST /api/v1/backtest/runs                     → 202 { run_id }
GET  /api/v1/backtest/runs/{id}                → 상태/결과 폴링

### 사용자
GET/POST/DELETE /api/v1/watchlist
GET/POST/PATCH/DELETE /api/v1/alerts/rules
GET  /api/v1/alerts/logs?unread=true
POST /api/v1/push/subscribe                    { endpoint, keys }

### 시장
GET  /api/v1/market/summary                    → 지수, 레짐, 시장 수급
```

### 10.3 핵심 응답 스키마

```python
class Reason(BaseModel):
    code: str            # 'GOLDEN_CROSS'
    label: str           # '골든크로스'
    detail: str          # '5일선이 20일선을 상향 돌파'
    delta: float         # +15
    layer: Literal['TECH','FLOW','EVENT','MODEL']

class LayerScore(BaseModel):
    layer: str
    score: float | None  # None = 해당 플랜 미제공 또는 미산출
    weight: float
    locked: bool = False # 플랜 제한으로 잠김

class ConditionStats(BaseModel):
    sample_count: int
    win_rate: float
    avg_gain: float
    avg_loss: float
    avg_holding_days: float
    max_drawdown: float
    period_from: date
    period_to: date
    disclaimer: str      # ★ 항상 DISCLAIMER.BACKTEST 포함

class SignalDetail(BaseModel):
    ticker: str
    name_ko: str
    trade_date: date
    score: int                      # 0~100
    grade: Literal['S','A','B','C','D','E']
    prev_score: int | None
    label: str                      # copy.ts와 동기화된 표시 문구
    layers: list[LayerScore]
    reasons: list[Reason]
    narrative_ko: str | None
    regime: Literal['BULL','NEUTRAL','BEAR']
    exit_signal: ExitSignal | None  # 관심종목 진입가 있을 때만
    gate_failed: bool
    gate_reason: str | None
    engine_version: str
    disclaimer: str                 # ★ 항상 포함
```

---

## 11. 비기능 요구사항

| 구분 | 요구사항 |
|---|---|
| 보안 | 전 구간 HTTPS, JWT 만료 30분 + Refresh 14일, API 키는 AWS Secrets Manager, SQL 파라미터 바인딩 강제 |
| 개인정보 | 회원 탈퇴 시 30일 내 파기, 결제정보 미저장(PG 토큰만), 개인정보처리방침 게시 |
| 접근성 | WCAG 2.1 AA, 신호 등급은 색상 외 **텍스트·아이콘 병행**(색각 이상 대응) |
| 반응형 | 360px~ 대응, 모바일에서 신호 카드가 첫 화면에 완결 |
| 다크모드 | 지원. 등락 색상은 **한국 관습(상승=빨강, 하락=파랑)** 준수 — 미국식 반대 색상 금지 |
| 로깅 | 모든 시그널 산출은 `engine_version`과 함께 저장하여 **사후 재현 가능** |
| 배치 실패 대응 | 3회 재시도(지수 백오프) 후 실패 시 Slack/이메일 알림, 화면에는 "데이터 갱신 지연" 배너 |
| 테스트 | 지표 계산식은 **골든 데이터셋 기반 단위테스트 필수** (알려진 종목·기간의 RSI/MACD 값 하드코딩 비교), 커버리지 70%+ |

---

## 12. 개발 로드맵

### Phase 0 — 준비 (1주, 개발과 병행 가능)
- [ ] KRX Open API 인증키 및 서비스 활용 신청 (승인 대기 발생 → **최우선**)
- [ ] Open DART 인증키 발급
- [ ] KIS Developers 앱키 발급 (계좌 개설 필요)
- [ ] 도메인, 상호, 사업자등록
- [ ] 유사투자자문업 대표자 사전교육 신청

### Phase 1 — MVP (6~8주) · 무료 베타 출시
| 주차 | 산출물 |
|---|---|
| W1 | 인프라 구성(docker-compose, PG+Timescale, Redis), 스키마 마이그레이션, 종목 마스터 수집 |
| W2 | 일별 시세·수급 **10년치 백필** (pykrx), 정합성 검증, 수정주가 처리 |
| W3 | 지표 계산 모듈 + 골든 데이터셋 단위테스트, `indicators_daily` 배치 |
| W4 | L1·L2 시그널 엔진, 합성/레짐, `signals_daily` 배치, 게이트 로직 |
| W5 | 백테스트 엔진(비용모델 포함), 조건별 성과 통계 산출 |
| W6 | FastAPI 엔드포인트 + Next.js 종목상세/홈/테마 랭킹 |
| W7 | 인증, 관심종목, 알림(웹푸시+이메일), 스크리너 프리셋 |
| W8 | 법적 문구·약관·개인정보처리방침, QA, 무료 베타 오픈 |

**Phase 1 완료 기준(DoD)**
- 전 종목 일일 배치가 15분 내 완료되고 7일 연속 무중단
- 지표 계산값이 외부 참조값(예: 네이버 금융 RSI)과 오차 1% 이내
- 백테스트가 생존편향·룩어헤드 없이 동작 (상폐 종목 포함 검증)
- 모든 화면에 면책 문구 노출 확인

### Phase 2 — 이벤트 + 수익화 (4~6주)
- DART 공시 수집 및 이벤트 스코어, 뉴스 감성(LLM), 자연어 해설 생성
- 커스텀 스크리너, 백테스터 UI
- **유사투자자문업 신고 수리 완료** → 결제(토스페이먼츠) 오픈
- 등급별 권한 게이트 적용

### Phase 3 — ML + 확장 (6~8주)
- 피처 파이프라인, triple barrier 라벨링, LightGBM 학습·검증·배포 파이프라인
- 성능 게이트 및 드리프트 감시
- 장중 5분 갱신(KIS 실시간), 카카오 알림톡
- PWA / 모바일 앱 검토

### Phase 4 — 검토 대상
해외주식·ETF 확장, 포트폴리오 분석, 증권사 API 연동 조회(매매 아님), B2B API

---

## 13. 성공 지표 (KPI)

| 구분 | 지표 | 3개월 목표 | 6개월 목표 |
|---|---|---|---|
| 획득 | MAU | 3,000 | 15,000 |
| 획득 | 종목 상세 페이지 검색 유입 비중 | 30% | 50% |
| 참여 | 주 3회 이상 방문 사용자 비중 | 20% | 30% |
| 참여 | 관심종목 1개 이상 등록 비율 | 40% | 55% |
| 참여 | 알림 클릭률(CTR) | 15% | 20% |
| 전환 | 무료→유료 전환율 | — (무료 베타) | 3% |
| 유지 | 유료 구독 월 이탈률 | — | < 8% |
| **품질** | **S/A 등급 신호의 10일 후 승률** | **> 52%** | **> 55%** |
| 품질 | 배치 성공률 | 99% | 99.5% |

> 품질 지표는 **매일 자동 기록**하고 대시보드에 노출합니다. 이 수치가 50% 아래로 3개월 지속되면 신호 로직을 재설계해야 하며, 이는 제품 존립의 문제입니다.

---

## 14. 리스크 및 대응

| 리스크 | 영향 | 대응 |
|---|---|---|
| **유사투자자문업 신고 지연** | 유료화 불가 | 무료 베타로 먼저 출시, 신고 절차를 Phase 1과 병행 착수 |
| 시그널 성과 부진 | 제품 신뢰 붕괴 | 출시 전 최소 5년 백테스트로 검증, 승률 < 50% 조건은 노출하지 않음 |
| KRX/증권사 데이터 이용약관 위반 | 서비스 중단 | 유료화 전 각 제공처 약관 검토 및 필요 시 상업 라이선스 계약 |
| API 장애·정책 변경 | 데이터 공백 | 소스 이중화(pykrx ↔ KRX Open API ↔ KIS), 최근 5영업일 재수집으로 복구 |
| 과최적화(오버피팅) | 실전 성과 괴리 | 파라미터 탐색 최소화, walk-forward 검증, out-of-sample 기간 사수 |
| 사용자 손실에 따른 민원·소송 | 법적 리스크 | 면책 문구 상시 노출 + 가입 시 별도 동의(`disclaimer_ack_at` 기록), 지시형 문구 전면 금지 |
| LLM 환각으로 잘못된 해설 | 신뢰도 하락 | 해설은 **산출된 근거(reasons) 리스트 내에서만** 생성하도록 제약, 새로운 사실 생성 금지 프롬프트 |
| 급등 종목 추격 유도 | 사용자 손실 | 이격도 과열 필터(5.2.2), 하락장 레짐 감쇠(5.6) |

---

## 15. 부록

### A. 종목 유니버스 정의 (신호 산출 대상)
```
포함: KOSPI + KOSDAQ 보통주, 국내 상장 ETF
제외:
  - 상장 후 60영업일 미만 (지표 산출 불가)
  - 관리종목, 투자경고/위험 종목
  - 거래정지 종목
  - 20일 평균 거래대금 5억원 미만
  - 우선주 (별도 옵션으로 포함 가능)
  - 스팩(SPAC)
```

### B. 용어 정의
| 용어 | 정의 |
|---|---|
| 스코어 | 4개 레이어를 가중 합성한 0~100 값 |
| 게이트 | 스코어 산출 자체를 차단하는 조건 (관리종목 등) |
| 레짐 | 시장 전체 국면 (BULL/NEUTRAL/BEAR) |
| 순매수 강도 | 5일 누적 순매수 대금 ÷ 시가총액 |
| 쌍끌이 | 외국인·기관 동시 순매수 |
| 트리플 배리어 | 상단·하단·시간 3개 기준으로 라벨을 정하는 기법 |
| PIT (Point-in-Time) | 과거 시점에 실제로 알 수 있었던 데이터만 사용하는 원칙 |

### C. Claude Code 작업 시작 순서 (권장)
```
1. docker-compose.yml + db/migrations 로 로컬 환경 기동
2. packages/ingest/sources/krx.py — pykrx로 종목마스터 + 3년치 일봉 백필
3. packages/signals/indicators.py + tests/test_indicators.py (골든 데이터셋)
   ※ 여기서 반드시 테스트 통과를 확인하고 다음으로 넘어갈 것
4. packages/signals/layers/technical.py, flow.py
5. packages/signals/composer.py + 일일 배치 태스크
6. packages/backtest/engine.py — 신호 검증 (이 단계에서 성과가 안 나오면 4번으로 회귀)
7. apps/api — 엔드포인트
8. apps/web — 종목 상세 화면부터
```

### D. 참고 자료
- KRX Data Marketplace Open API — https://openapi.krx.co.kr/
- 한국투자증권 KIS Developers — https://apiportal.koreainvestment.com/
- Open DART — https://opendart.fss.or.kr/
- pykrx — https://github.com/sharebook-kr/pykrx

---

> **본 문서가 정의하는 서비스는 투자 참고 정보를 제공하는 도구이며, 투자 자문·권유·일임을 수행하지 않습니다. 개발 전 과정에서 3장의 규제 요건을 최우선 제약으로 준수해야 합니다.**
