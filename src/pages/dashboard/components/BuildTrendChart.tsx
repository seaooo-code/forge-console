import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type EChartsOption, echarts } from "@/lib/echarts";

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
        bottom: 30,
        left: 28,
        right: 18,
        top: 28,
      },
      legend: {
        show: false,
      },
      tooltip: {
        axisPointer: {
          type: "shadow",
        },
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
          color: "#94a3b8",
          fontSize: 11,
        },
        axisLine: {
          show: false,
        },
        splitLine: {
          lineStyle: {
            color: "#eef2f7",
          },
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
    <Card className="gap-0 rounded-lg border-slate-200 py-0 shadow-sm">
      <CardHeader className="flex h-12 flex-row items-center justify-between border-b px-4 py-0">
        <div className="min-w-0">
          <CardTitle className="text-slate-900 text-sm">构建趋势</CardTitle>
          <div className="mt-1 text-slate-500 text-xs">近 7 天构建总量与成功数</div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden items-center gap-3 font-medium text-slate-500 text-xs sm:flex">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-blue-600" />
              构建数
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-cyan-500" />
              成功数
            </span>
          </div>
          <Button asChild variant="outline" size="sm" className="h-8 border-slate-200">
            <Link to="/builds">打开构建</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 py-4">
        {data.length > 0 ? (
          <div ref={chartRef} className="h-60 w-full" />
        ) : (
          <div className="grid h-60 place-items-center rounded-md bg-slate-50 text-slate-500 text-sm">
            暂无构建数据
          </div>
        )}
      </CardContent>
    </Card>
  );
}
