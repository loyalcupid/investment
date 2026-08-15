// lib/data/universe.ts
// MVP 종목/테마 마스터. 실제 서비스에서는 D1(KRX Open API)·D2(pykrx)로 동기화 (PRD 4.1, 5.9).
// 여기서는 큐레이션된 실제 KOSPI/KOSDAQ 종목코드를 사용하되, 시세·수급은 시뮬레이션 데이터입니다.

export interface StockMeta {
  ticker: string;
  nameKo: string;
  market: "KOSPI" | "KOSDAQ";
  sector: string;
  basePrice: number; // 시뮬레이션 시작가
  trendBias: number; // -1..1, 시뮬레이션용 추세 편향 시드
  sharesOut: number; // 발행주식수(대략치)
}

export const UNIVERSE: StockMeta[] = [
  { ticker: "005930", nameKo: "삼성전자", market: "KOSPI", sector: "반도체", basePrice: 68000, trendBias: 0.55, sharesOut: 5_919_637_922 },
  { ticker: "000660", nameKo: "SK하이닉스", market: "KOSPI", sector: "반도체", basePrice: 175000, trendBias: 0.7, sharesOut: 728_002_365 },
  { ticker: "035420", nameKo: "NAVER", market: "KOSPI", sector: "플랫폼", basePrice: 195000, trendBias: 0.1, sharesOut: 158_887_213 },
  { ticker: "035720", nameKo: "카카오", market: "KOSPI", sector: "플랫폼", basePrice: 42000, trendBias: -0.3, sharesOut: 442_000_000 },
  { ticker: "373220", nameKo: "LG에너지솔루션", market: "KOSPI", sector: "2차전지", basePrice: 380000, trendBias: -0.2, sharesOut: 234_000_000 },
  { ticker: "006400", nameKo: "삼성SDI", market: "KOSPI", sector: "2차전지", basePrice: 330000, trendBias: -0.15, sharesOut: 68_764_530 },
  { ticker: "051910", nameKo: "LG화학", market: "KOSPI", sector: "2차전지", basePrice: 310000, trendBias: -0.1, sharesOut: 70_592_343 },
  { ticker: "247540", nameKo: "에코프로비엠", market: "KOSDAQ", sector: "2차전지", basePrice: 180000, trendBias: -0.35, sharesOut: 60_331_419 },
  { ticker: "066970", nameKo: "엘앤에프", market: "KOSDAQ", sector: "2차전지", basePrice: 95000, trendBias: -0.25, sharesOut: 32_000_000 },
  { ticker: "003670", nameKo: "포스코퓨처엠", market: "KOSPI", sector: "2차전지", basePrice: 210000, trendBias: -0.05, sharesOut: 96_690_000 },
  { ticker: "207940", nameKo: "삼성바이오로직스", market: "KOSPI", sector: "바이오", basePrice: 920000, trendBias: 0.3, sharesOut: 71_174_000 },
  { ticker: "068270", nameKo: "셀트리온", market: "KOSPI", sector: "바이오시밀러", basePrice: 185000, trendBias: 0.2, sharesOut: 217_845_000 },
  { ticker: "196170", nameKo: "알테오젠", market: "KOSDAQ", sector: "바이오", basePrice: 420000, trendBias: 0.6, sharesOut: 44_500_000 },
  { ticker: "000100", nameKo: "유한양행", market: "KOSPI", sector: "바이오", basePrice: 145000, trendBias: 0.4, sharesOut: 68_034_000 },
  { ticker: "042700", nameKo: "한미반도체", market: "KOSDAQ", sector: "AI반도체", basePrice: 145000, trendBias: 0.75, sharesOut: 113_360_000 },
  { ticker: "005380", nameKo: "현대차", market: "KOSPI", sector: "자동차", basePrice: 245000, trendBias: 0.15, sharesOut: 209_416_191 },
  { ticker: "000270", nameKo: "기아", market: "KOSPI", sector: "자동차", basePrice: 118000, trendBias: 0.1, sharesOut: 401_406_674 },
  { ticker: "005490", nameKo: "POSCO홀딩스", market: "KOSPI", sector: "철강", basePrice: 385000, trendBias: -0.1, sharesOut: 84_571_230 },
  { ticker: "034020", nameKo: "두산에너빌리티", market: "KOSPI", sector: "원전", basePrice: 42000, trendBias: 0.5, sharesOut: 685_000_000 },
  { ticker: "010140", nameKo: "삼성중공업", market: "KOSPI", sector: "조선", basePrice: 14500, trendBias: 0.35, sharesOut: 1_020_000_000 },
  { ticker: "042660", nameKo: "한화오션", market: "KOSPI", sector: "조선", basePrice: 43000, trendBias: 0.45, sharesOut: 232_000_000 },
  { ticker: "012450", nameKo: "한화에어로스페이스", market: "KOSPI", sector: "방산", basePrice: 480000, trendBias: 0.65, sharesOut: 46_570_000 },
  { ticker: "047810", nameKo: "한국항공우주", market: "KOSPI", sector: "방산", basePrice: 68000, trendBias: 0.4, sharesOut: 91_522_000 },
  { ticker: "259960", nameKo: "크래프톤", market: "KOSPI", sector: "게임", basePrice: 355000, trendBias: 0.05, sharesOut: 45_150_000 },
];

export interface ThemeMeta {
  slug: string;
  nameKo: string;
  description: string;
  members: string[]; // tickers
}

export const THEMES: ThemeMeta[] = [
  { slug: "semiconductor", nameKo: "반도체", description: "메모리·파운드리 등 반도체 밸류체인", members: ["005930", "000660", "042700"] },
  { slug: "ai-semiconductor", nameKo: "AI반도체", description: "HBM·AI 서버향 반도체 및 후공정 장비", members: ["000660", "042700", "005930"] },
  { slug: "battery", nameKo: "2차전지", description: "배터리 셀·소재 밸류체인", members: ["373220", "006400", "051910", "247540", "066970", "003670"] },
  { slug: "bio", nameKo: "바이오", description: "제약·바이오 전반", members: ["207940", "068270", "196170", "000100"] },
  { slug: "bio-similar", nameKo: "바이오시밀러", description: "바이오시밀러 위탁생산·개발", members: ["068270", "207940"] },
  { slug: "auto", nameKo: "자동차", description: "완성차 및 전동화", members: ["005380", "000270"] },
  { slug: "steel", nameKo: "철강", description: "철강·소재", members: ["005490"] },
  { slug: "nuclear", nameKo: "원전", description: "원전 기자재 및 SMR", members: ["034020"] },
  { slug: "shipbuilding", nameKo: "조선", description: "조선 및 해양플랜트", members: ["010140", "042660"] },
  { slug: "defense", nameKo: "방산", description: "방위산업 및 수출 방산", members: ["012450", "047810"] },
  { slug: "platform", nameKo: "플랫폼", description: "인터넷 플랫폼", members: ["035420", "035720"] },
  { slug: "game", nameKo: "게임", description: "게임 콘텐츠", members: ["259960"] },
];

// 스크리너 "배당+저평가" 프리셋용 간이 재무지표 (MVP: 실제 재무데이터 연동 전 결정적 시뮬레이션 값)
function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
export interface Fundamentals {
  per: number;
  pbr: number;
  dividendYield: number;
}
export function getFundamentals(ticker: string): Fundamentals {
  const h = hashSeed(ticker + "_fund");
  const per = 5 + (h % 3000) / 100; // 5.0 ~ 35.0
  const pbr = 0.4 + ((h >> 4) % 400) / 100; // 0.4 ~ 4.4
  const dividendYield = ((h >> 8) % 500) / 100; // 0.0 ~ 5.0
  return { per: round1(per), pbr: round1(pbr), dividendYield: round1(dividendYield) };
}
function round1(v: number) {
  return Math.round(v * 10) / 10;
}

export function findStock(ticker: string): StockMeta | undefined {
  return UNIVERSE.find((s) => s.ticker === ticker);
}

export function findTheme(slug: string): ThemeMeta | undefined {
  return THEMES.find((t) => t.slug === slug);
}

export function themesOfStock(ticker: string): ThemeMeta[] {
  return THEMES.filter((t) => t.members.includes(ticker));
}
