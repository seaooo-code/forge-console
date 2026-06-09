import type { EChartsOption } from "echarts";
import * as echarts from "echarts";
import { useEffect, useMemo, useRef } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { useConsoleStore } from "../model/use-console-store";
import type { MetricPoint } from "../types";

type ChartPanelProps = {
  metrics: MetricPoint[];
};

export function ChartPanel({ metrics }: ChartPanelProps) {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const theme = useConsoleStore((state) => state.theme);

  const option = useMemo<EChartsOption>(
    () => ({
      backgroundColor: "transparent",
      color: ["#2563eb", "#16a34a", "#dc2626"],
      grid: {
        top: 36,
        right: 42,
        bottom: 28,
        left: 42,
      },
      legend: {
        top: 0,
        textStyle: {
          color: theme === "dark" ? "#cbd5e1" : "#475569",
        },
      },
      tooltip: {
        trigger: "axis",
      },
      xAxis: {
        type: "category",
        data: metrics.map((item) => item.day),
        axisLine: { lineStyle: { color: theme === "dark" ? "#334155" : "#cbd5e1" } },
        axisLabel: { color: theme === "dark" ? "#cbd5e1" : "#475569" },
      },
      yAxis: [
        {
          type: "value",
          name: "Minutes",
          axisLabel: { color: theme === "dark" ? "#cbd5e1" : "#475569" },
          splitLine: { lineStyle: { color: theme === "dark" ? "#1e293b" : "#e2e8f0" } },
        },
        {
          type: "value",
          name: "Rate",
          min: 90,
          max: 100,
          axisLabel: {
            color: theme === "dark" ? "#cbd5e1" : "#475569",
            formatter: "{value}%",
          },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: "Build minutes",
          type: "bar",
          data: metrics.map((item) => item.buildMinutes),
          barWidth: 18,
          borderRadius: [4, 4, 0, 0],
        },
        {
          name: "Success rate",
          type: "line",
          yAxisIndex: 1,
          smooth: true,
          symbolSize: 8,
          data: metrics.map((item) => item.successRate),
        },
        {
          name: "Incidents",
          type: "line",
          smooth: true,
          symbolSize: 8,
          data: metrics.map((item) => item.incidents * 80),
        },
      ],
    }),
    [metrics, theme],
  );

  useEffect(() => {
    if (!chartRef.current) {
      return;
    }

    const chart = echarts.init(chartRef.current);
    chart.setOption(option);

    const resize = () => chart.resize();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      chart.dispose();
    };
  }, [option]);

  return (
    <Card className="min-h-[340px]">
      <CardHeader>
        <CardTitle>Execution mix</CardTitle>
        <CardDescription>Build capacity, release quality, and incidents</CardDescription>
      </CardHeader>
      <CardContent>
        <div ref={chartRef} className="h-[260px] w-full min-w-0" />
      </CardContent>
    </Card>
  );
}
