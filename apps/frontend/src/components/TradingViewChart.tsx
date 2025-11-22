"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, LineSeries } from "lightweight-charts";
import type { IChartApi, ISeriesApi } from "lightweight-charts";
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
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart: IChartApi = createChart(chartContainerRef.current, {
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

    // In lightweight-charts v5, use addSeries with LineSeries definition
    try {
      const lineSeries = chart.addSeries(LineSeries, {
        color: "#10b981",
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
      });
      seriesRef.current = lineSeries;
    } catch (error) {
      console.error("Error creating line series:", error);
    }

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
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [height]);

  const lastDataLengthRef = useRef<number>(0);

  useEffect(() => {
    if (!seriesRef.current || !data.length) return;

    // Convert PriceTick[] to chart data format
    // lightweight-charts expects Unix timestamp in seconds
    const chartData = data.map((tick) => ({
      time: Math.floor(tick.timestamp / 1000) as any,
      value: tick.price,
    }));

    try {
      // If we have new data points (data length increased), use update for incremental updates
      if (
        data.length > lastDataLengthRef.current &&
        lastDataLengthRef.current > 0
      ) {
        // Only update with new data points
        const newPoints = chartData.slice(lastDataLengthRef.current);
        newPoints.forEach((point) => {
          seriesRef.current?.update(point);
        });
      } else {
        // Initial load or full refresh - set all data
        seriesRef.current.setData(chartData);
      }

      lastDataLengthRef.current = data.length;

      // Auto-scroll to the end
      if (chartRef.current) {
        chartRef.current.timeScale().scrollToPosition(-1, false);
      }
    } catch (error) {
      console.error("Error setting chart data:", error);
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
