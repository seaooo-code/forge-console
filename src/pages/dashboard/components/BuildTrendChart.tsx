import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type EChartsOption, echarts } from "@/lib/echarts";
import { getThemeChartColors } from "@/lib/theme-colors";
import { useThemeStore } from "@/store/use-theme-store";

import type { BuildTrendPoint } from "../types";

type BuildTrendChartProps = {
  data: BuildTrendPoint[];
};

export function BuildTrendChart({ data }: BuildTrendChartProps) {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);

  // resolvedTheme is a required dep: getThemeChartColors() reads CSS variables
  // off the DOM, so colors must be recomputed whenever the theme flips.
  // biome-ignore lint/correctness/useExhaustiveDependencies: theme-driven color re-read
  const option = useMemo<EChartsOption>(() => {
    const colors = getThemeChartColors();

    return {
      animationDuration: 500,
      color: [colors.primary, colors.accent],
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
          color: colors.mutedForeground,
          fontSize: 12,
        },
        axisLine: {
          lineStyle: {
            color: colors.border,
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
          color: colors.mutedForeground,
          fontSize: 11,
        },
        axisLine: {
          show: false,
        },
        splitLine: {
          lineStyle: {
            color: colors.border,
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
    };
  }, [data, resolvedTheme]);

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
    <Card className="gap-0 rounded-xl border-border py-0 shadow-xs">
      <CardHeader className="flex min-h-16 flex-row items-center justify-between border-b px-5 py-3">
        <div className="min-w-0">
          <CardTitle className="text-foreground text-sm">构建趋势</CardTitle>
          <div className="mt-1 text-muted-foreground text-xs">近 7 天构建总量与成功数</div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden items-center gap-3 font-medium text-muted-foreground text-xs sm:flex">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary" />
              构建数
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-chart-2" />
              成功数
            </span>
          </div>
          <Button asChild variant="outline" size="sm" className="h-8">
            <Link to="/builds">打开构建</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 py-4">
        {data.length > 0 ? (
          <div ref={chartRef} className="h-64 w-full" />
        ) : (
          <div className="grid h-60 place-items-center rounded-md bg-muted text-muted-foreground text-sm">
            暂无构建数据
          </div>
        )}
      </CardContent>
    </Card>
  );
}
