"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, type IChartApi } from "lightweight-charts";

export interface ChartBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma20: number | null;
  sma60: number | null;
}

export interface SignalMarker {
  date: string;
  text: string;
  positive: boolean;
}

export function PriceChart({ bars, markers }: { bars: ChartBar[]; markers?: SignalMarker[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 360,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: isDark ? "#a3a3a3" : "#525252",
      },
      grid: {
        vertLines: { color: isDark ? "#262626" : "#f0f0f0" },
        horzLines: { color: isDark ? "#262626" : "#f0f0f0" },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, timeVisible: false },
    });
    chartRef.current = chart;

    // 한국 시장 관습: 상승=빨강, 하락=파랑 (PRD 11장)
    const candle = chart.addCandlestickSeries({
      upColor: "#D64541",
      downColor: "#2B6CB0",
      borderVisible: false,
      wickUpColor: "#D64541",
      wickDownColor: "#2B6CB0",
    });
    candle.setData(bars.map((b) => ({ time: b.date, open: b.open, high: b.high, low: b.low, close: b.close })));

    if (markers && markers.length > 0) {
      candle.setMarkers(
        markers.map((m) => ({
          time: m.date,
          position: m.positive ? "belowBar" : "aboveBar",
          color: m.positive ? "#D64541" : "#2B6CB0",
          shape: m.positive ? "arrowUp" : "arrowDown",
          text: m.text,
        }))
      );
    }

    const sma20 = chart.addLineSeries({ color: "#F5A623", lineWidth: 1 });
    sma20.setData(bars.filter((b) => b.sma20 != null).map((b) => ({ time: b.date, value: b.sma20! })));

    const sma60 = chart.addLineSeries({ color: "#7F5AF0", lineWidth: 1 });
    sma60.setData(bars.filter((b) => b.sma60 != null).map((b) => ({ time: b.date, value: b.sma60! })));

    const volume = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "",
      color: "#a3a3a3",
    });
    volume.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    volume.setData(
      bars.map((b, i) => ({
        time: b.date,
        value: b.volume,
        color: i > 0 && b.close < bars[i - 1].close ? "rgba(43,108,176,0.5)" : "rgba(214,69,65,0.5)",
      }))
    );

    chart.timeScale().fitContent();

    const onResize = () => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth });
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      chart.remove();
    };
  }, [bars, markers]);

  return <div ref={containerRef} className="w-full" />;
}
