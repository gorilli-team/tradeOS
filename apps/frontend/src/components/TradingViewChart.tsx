"use client";

import { useEffect, useRef } from "react";
import { createChart, IChartApi, ISeriesApi, ColorType } from "lightweight-charts";
import { PriceTick } from "@tradeOS/types";

interface TradingViewChartProps {
  data: PriceTick[];
  height?: number;
}

export default function TradingViewChart({
  data,
  height = 500,
}: TradingViewChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#0a0e27" },
        textColor: "#9ca3af",
      },
      grid: {
        vertLines: { color: "#1a1f3a", style: 1 },
        horzLines: { color: "#1a1f3a", style: 1 },
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: "#1a1f3a",
      },
      rightPriceScale: {
        borderColor: "#1a1f3a",
      },
      crosshair: {
        mode: 0,
      },
    });

    chartRef.current = chart;

    // Create area series
    const areaSeries = chart.addAreaSeries({
      lineColor: "#10b981",
      topColor: "rgba(16, 185, 129, 0.2)",
      bottomColor: "rgba(16, 185, 129, 0)",
      lineWidth: 2,
    });

    seriesRef.current = areaSeries;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [height]);

  useEffect(() => {
    if (!seriesRef.current || !data.length) return;

    // Convert PriceTick[] to chart data format
    // lightweight-charts expects Unix timestamp in seconds
    const chartData = data.map((tick) => ({
      time: Math.floor(tick.timestamp / 1000) as any,
      value: tick.price,
    }));

    seriesRef.current.setData(chartData);
    
    // Auto-scroll to the end
    if (chartRef.current) {
      chartRef.current.timeScale().scrollToPosition(-1, false);
    }
  }, [data]);

  return (
    <div
      ref={chartContainerRef}
      className="w-full"
      style={{ height: `${height}px` }}
    />
  );
}

