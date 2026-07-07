import { KpiCard } from "@/components/layout";
import { cn } from "@/lib/utils";

import { metricIcons, metricIconToneClass } from "../constants";
import type { SummaryMetric } from "../types";

type MetricOverviewProps = {
  metrics: SummaryMetric[];
};

export function MetricOverview({ metrics }: MetricOverviewProps) {
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {metrics.map((metric) => {
        const Icon = metricIcons[metric.icon];
        const trendTone = metric.trendTone ?? "neutral";

        return (
          <KpiCard
            key={metric.id}
            icon={Icon}
            label={metric.label}
            value={metric.value}
            detail={metric.description}
            toneClassName={metricIconToneClass[metric.iconTone]}
            trend={
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 font-semibold text-[11px]",
                  trendTone === "positive" && "bg-success/15 text-success",
                  trendTone === "negative" && "bg-destructive/15 text-destructive",
                  trendTone === "neutral" && "bg-muted text-muted-foreground",
                )}
              >
                {metric.trend}
              </span>
            }
          >
            <MiniSparkline values={metric.sparkline} />
          </KpiCard>
        );
      })}
    </section>
  );
}

function MiniSparkline({ values }: { values: number[] }) {
  const width = 132;
  const height = 34;
  if (values.length === 0) {
    return <div className="h-8.5 rounded bg-muted" />;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * width;
      const y = height - ((value - min) / range) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg className="h-8.5 w-full text-primary" role="img" viewBox={`0 0 ${width} ${height}`}>
      <title>metric trend</title>
      <polyline
        fill="none"
        points={points}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
