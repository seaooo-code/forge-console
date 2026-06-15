import { MockCard as Card } from "@/components/common/MockSurface";
import { CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { metricIcons, metricIconToneClass } from "../constants";
import type { SummaryMetric } from "../types";

type MetricOverviewProps = {
  metrics: SummaryMetric[];
};

export function MetricOverview({ metrics }: MetricOverviewProps) {
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
      {metrics.map((metric) => {
        const Icon = metricIcons[metric.icon];

        return (
          <Card key={metric.id} className="rounded-lg py-0 shadow-none">
            <CardContent className="px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg",
                    metricIconToneClass[metric.iconTone],
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <span
                  className={cn(
                    "font-semibold text-xs",
                    metric.trendTone === "positive" ? "text-emerald-600" : "text-red-500",
                  )}
                >
                  {metric.trend}
                </span>
              </div>
              <div className="mt-4 text-slate-500 text-xs">{metric.label}</div>
              <div className="mt-1 font-semibold text-2xl text-slate-900">{metric.value}</div>
              <MiniSparkline values={metric.sparkline} />
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}

function MiniSparkline({ values }: { values: number[] }) {
  const width = 132;
  const height = 34;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values.map((value, index) => {
    const x = (index / Math.max(values.length - 1, 1)) * width;
    const y = height - ((value - min) / range) * (height - 8) - 4;

    return `${x},${y}`;
  });

  return (
    <svg className="mt-3 h-8.5 w-full" viewBox={`0 0 ${width} ${height}`} role="img">
      <title>metric trend</title>
      <polyline
        fill="none"
        points={points.join(" ")}
        stroke="#1677ff"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
