import { useQuery } from "@tanstack/react-query";
import { Activity, Clock3, Layers3, type LucideIcon, RotateCw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type MiCarEnvironmentCode, miCarEnvironmentFilterOptions } from "@/types/environments";
import { dashboardSnapshotQueryKey, fetchDashboardSnapshot } from "./api/dashboard-snapshot";
import { BuildTrendChart } from "./components/BuildTrendChart";
import { MetricOverview } from "./components/MetricOverview";
import { RecentBuildsTable } from "./components/RecentBuildsTable";
import { RecentReleasesTable } from "./components/RecentReleasesTable";
import { ReleaseOverviewPanel } from "./components/ReleaseOverviewPanel";
import { ResourceOverviewPanel } from "./components/ResourceOverviewPanel";
import { useDashboardContextStore } from "./model/use-dashboard-context-store";

const metricSkeletonKeys = ["apps", "modules", "builds", "success", "releases", "resources"];

export function DashboardPage() {
  const {
    data: snapshot,
    error,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryFn: fetchDashboardSnapshot,
    queryKey: dashboardSnapshotQueryKey,
  });

  if (!snapshot && !isError) {
    return <DashboardSkeleton />;
  }

  if (!snapshot) {
    return (
      <DashboardErrorState
        error={error}
        isFetching={isFetching}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  const totalBuilds = snapshot.buildTrend.reduce((total, item) => total + item.buildCount, 0);
  const successfulBuilds = snapshot.buildTrend.reduce(
    (total, item) => total + item.successCount,
    0,
  );
  const buildSuccessRate =
    totalBuilds > 0 ? `${((successfulBuilds / totalBuilds) * 100).toFixed(1)}%` : "-";
  const activeReleaseCount = snapshot.releases.filter(
    (release) => release.status === "active",
  ).length;

  return (
    <>
      <div className="border-border border-b bg-card px-6 py-5">
        <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
          <div>
            <h1 className="font-semibold text-2xl text-foreground tracking-tight">平台运行概览</h1>
            <p className="mt-2 text-muted-foreground text-sm">
              关注当前已接入的应用、模块、构建、发布和平台资源状态
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 2xl:items-end">
            <DashboardContextControls />
            <div className="text-muted-foreground text-xs">
              数据更新时间 {formatUpdatedAt(snapshot.updatedAt)}
            </div>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <SummaryPill icon={Activity} label="构建成功率" value={buildSuccessRate} />
          <SummaryPill icon={Layers3} label="生效发布" value={`${activeReleaseCount} 个`} />
          <SummaryPill
            icon={Clock3}
            label="最近构建"
            value={snapshot.builds[0]?.startedAt ?? "-"}
          />
        </div>
      </div>

      <div className="space-y-4 px-6 py-5">
        <MetricOverview metrics={snapshot.metrics} />

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">
            <BuildTrendChart data={snapshot.buildTrend} />
          </div>
          <ReleaseOverviewPanel releases={snapshot.releases} />
        </section>

        <ResourceOverviewPanel resources={snapshot.resources} />

        <section className="grid gap-4 xl:grid-cols-2">
          <RecentBuildsTable builds={snapshot.builds} />
          <RecentReleasesTable releases={snapshot.releases} />
        </section>
      </div>
    </>
  );
}

function DashboardErrorState({
  error,
  isFetching,
  onRetry,
}: {
  error: unknown;
  isFetching: boolean;
  onRetry: () => void;
}) {
  return (
    <>
      <div className="border-border border-b bg-card px-6 py-5">
        <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
          <div>
            <h1 className="font-semibold text-2xl text-foreground tracking-tight">平台运行概览</h1>
            <p className="mt-2 text-muted-foreground text-sm">
              关注当前已接入的应用、模块、构建、发布和平台资源状态
            </p>
          </div>
          <DashboardContextControls />
        </div>
      </div>
      <div className="px-6 py-5">
        <Card className="rounded-lg border-warning/40 bg-warning/10 px-5 py-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-card text-warning">
                <TriangleAlert className="size-5" />
              </span>
              <div className="min-w-0">
                <div className="font-semibold text-foreground text-sm">仪表盘数据加载失败</div>
                <div className="mt-1 text-muted-foreground text-sm">
                  {error instanceof Error ? error.message : "无法获取仪表盘聚合数据"}
                </div>
              </div>
            </div>
            <Button
              className="h-9 shrink-0"
              disabled={isFetching}
              onClick={onRetry}
              size="sm"
              variant="outline"
            >
              <RotateCw className="size-4" />
              重试
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}

function DashboardContextControls() {
  const environment = useDashboardContextStore((state) => state.environment);
  const project = useDashboardContextStore((state) => state.project);
  const setEnvironment = useDashboardContextStore((state) => state.setEnvironment);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex h-10 shrink-0 items-center gap-2 rounded-md border border-border bg-card px-4 font-semibold text-foreground text-sm shadow-sm">
        <span className="size-2.5 rounded-full bg-success" />
        {project}
      </div>

      <Select
        value={environment}
        onValueChange={(value) => setEnvironment(value as MiCarEnvironmentCode)}
      >
        <SelectTrigger className="h-10 shrink-0 gap-2 border-border bg-card px-4 font-medium text-foreground shadow-sm">
          <span>环境:</span>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {miCarEnvironmentFilterOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function SummaryPill({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-muted px-3 py-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-card text-muted-foreground shadow-xs">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <div className="truncate text-muted-foreground text-xs">{label}</div>
        <div className="mt-0.5 truncate font-semibold text-foreground text-sm">{value}</div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="border-border border-b bg-card px-6 py-5">
        <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
          <div>
            <div className="h-7 w-42 animate-pulse rounded bg-muted" />
            <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-muted" />
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="h-10 w-32 animate-pulse rounded bg-muted" />
            <div className="h-10 w-36 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <Card className="h-16 animate-pulse rounded-lg border-border bg-muted shadow-none" />
          <Card className="h-16 animate-pulse rounded-lg border-border bg-muted shadow-none" />
          <Card className="h-16 animate-pulse rounded-lg border-border bg-muted shadow-none" />
        </div>
      </div>
      <div className="space-y-4 px-6 py-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {metricSkeletonKeys.map((key) => (
            <Card
              key={`metric-skeleton-${key}`}
              className="h-39 animate-pulse rounded-lg border-border bg-card shadow-sm"
            />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="h-86 animate-pulse rounded-lg border-border bg-card shadow-sm" />
          <Card className="h-86 animate-pulse rounded-lg border-border bg-card shadow-sm" />
        </div>
      </div>
    </>
  );
}

function formatUpdatedAt(value: string) {
  if (!value) {
    return "加载中";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}
