import { RadioTower } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { applicationMetricToneClass } from "../constants";
import type { ApplicationDetailMetric } from "../types";

export function MetricCard({ metric }: { metric: ApplicationDetailMetric }) {
  return (
    <Card className="gap-3 rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium text-muted-foreground text-xs">{metric.label}</div>
          <div className="mt-2 font-semibold text-2xl text-foreground">{metric.value}</div>
        </div>
        <div
          className={cn(
            "flex size-8 items-center justify-center rounded-md",
            applicationMetricToneClass[metric.tone],
          )}
        >
          <RadioTower className="size-4" />
        </div>
      </div>
      <div className="text-muted-foreground text-xs">{metric.detail}</div>
    </Card>
  );
}
