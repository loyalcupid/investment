export function formatEok(won: number): string {
  const eok = won / 100_000_000;
  const sign = eok >= 0 ? "+" : "";
  return `${sign}${eok.toLocaleString("ko-KR", { maximumFractionDigits: 0 })}억원`;
}

export function formatPrice(v: number): string {
  return v.toLocaleString("ko-KR", { maximumFractionDigits: 0 });
}

export function formatPct(v: number, withSign = true): string {
  const sign = withSign && v > 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}

export function formatDate(d: string): string {
  return d;
}
