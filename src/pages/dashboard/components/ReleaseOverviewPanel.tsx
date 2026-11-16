import { Link } from "react-router";

import { EnvironmentBadge } from "@/components/common/EnvironmentBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { recentReleaseStatusClass, recentReleaseStatusLabel } from "../constants";
import type { EnvironmentTone, ReleaseRecord } from "../types";

type ReleaseOverviewPanelProps = {
  environmentTones: ReadonlyMap<string, EnvironmentTone>;
  releases: ReleaseRecord[];
};

export function ReleaseOverviewPanel({ environmentTones, releases }: ReleaseOverviewPanelProps) {
  const activeCount = releases.filter((release) => release.status === "active").length;
  const inactiveCount = releases.length - activeCount;
  const latestRelease = releases[0];

  return (
    <Card className="gap-0 rounded-xl border-border py-0 shadow-xs">
      <CardHeader className="flex min-h-16 flex-row items-center justify-between border-b px-5 py-3">
        <div className="min-w-0">
          <CardTitle className="text-foreground text-sm">发布概览</CardTitle>
          <div className="mt-1 text-muted-foreground text-xs">当前发布目标与状态分布</div>
        </div>
        <Button asChild variant="outline" size="sm" className="h-8 shrink-0 border-border">
          <Link to="/release-records">打开发布</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          <StatusTile label="生效中" value={activeCount} className="bg-success/15 text-success" />
          <StatusTile
            label="已失效"
            value={inactiveCount}
            className="bg-muted text-muted-foreground"
          />
        </div>

        {latestRelease ? (
          <div className="rounded-lg border border-border bg-muted px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-medium text-foreground text-sm">
                  {latestRelease.module}
                </div>
                <div className="mt-1 truncate text-muted-foreground text-xs">
                  {latestRelease.application} / {latestRelease.id}
                </div>
              </div>
              <span
                className={cn(
                  "inline-flex shrink-0 rounded px-2 py-0.5 font-medium text-xs",
                  recentReleaseStatusClass[latestRelease.status],
                )}
              >
                {recentReleaseStatusLabel[latestRelease.status]}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
              <EnvironmentBadge
                className="h-5 px-2 py-0.5 font-medium"
                environment={latestRelease.environment}
                tone={environmentTones.get(latestRelease.environment)}
              />
              <span>灰度 {latestRelease.gray}</span>
              <span>更新 {latestRelease.updatedAt}</span>
            </div>
          </div>
        ) : (
          <div className="grid h-24 place-items-center rounded-lg bg-muted text-muted-foreground text-sm">
            暂无发布记录
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusTile({
  className,
  label,
  value,
}: {
  className: string;
  label: string;
  value: number;
}) {
  return (
    <div className={cn("rounded-lg px-3 py-3", className)}>
      <div className="font-semibold text-2xl">{value}</div>
      <div className="mt-1 text-xs">{label}</div>
    </div>
  );
}
