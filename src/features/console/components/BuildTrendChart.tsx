import type { EChartsOption } from "echarts";
import * as echarts from "echarts";
import { useEffect, useMemo, useRef } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { BuildTrendPoint } from "../types";

type BuildTrendChartProps = {
  data: BuildTrendPoint[];
};

export function BuildTrendChart({ data }: BuildTrendChartProps) {
  const chartRef = useRef<HTMLDivElement | null>(null);

  const option = useMemo<EChartsOption>(
    () => ({
      animationDuration: 500,
      color: ["#0f7ae5", "#11bec8"],
      grid: {
        bottom: 28,
        left: 20,
        right: 18,
        top: 24,
      },
      legend: {
        itemHeight: 8,
        itemWidth: 8,
        right: 8,
        textStyle: {
          color: "#64748b",
          fontSize: 12,
        },
        top: 0,
      },
      tooltip: {
        trigger: "axis",
      },
      xAxis: {
        axisLabel: {
          color: "#64748b",
          fontSize: 12,
        },
        axisLine: {
          lineStyle: {
            color: "#e5e7eb",
          },
        },
        axisTick: {
          show: false,
        },
        data: data.map((item) => item.date),
        type: "category",
      },
      yAxis: {
        axisLabel: {
          show: false,
        },
        axisLine: {
          show: false,
        },
        splitLine: {
          show: false,
        },
        type: "value",
      },
      series: [
        {
          barGap: "18%",
          barMaxWidth: 44,
          data: data.map((item) => item.buildCount),
          itemStyle: {
            borderRadius: [5, 5, 0, 0],
          },
          name: "构建数",
          type: "bar",
        },
        {
          barMaxWidth: 44,
          data: data.map((item) => item.successCount),
          itemStyle: {
            borderRadius: [5, 5, 0, 0],
          },
          name: "成功数",
          type: "bar",
        },
      ],
    }),
    [data],
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
    <Card className="rounded-lg py-0 shadow-none">
      <CardHeader className="h-12 border-b px-4 py-0">
        <CardTitle className="flex h-full items-center text-slate-900 text-sm">
          构建趋势（近 7 天）
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-4">
        <div ref={chartRef} className="h-[206px] w-full" />
      </CardContent>
    </Card>
  );
}
