import { useQuery } from "@tanstack/react-query";
import { Activity, Clock3, Layers3, type LucideIcon } from "lucide-react";
import { useMemo } from "react";

import { PageErrorState, PageHeader, PageSkeleton } from "@/components/layout";
import { environmentsSnapshotQueryKey, fetchEnvironmentsSnapshot } from "@/pages/environments";

import { dashboardSnapshotQueryKey, fetchDashboardSnapshot } from "./api/dashboard-snapshot";
import { BuildTrendChart } from "./components/BuildTrendChart";
import { MetricOverview } from "./components/MetricOverview";
import { RecentBuildsTable } from "./components/RecentBuildsTable";
import { RecentReleasesTable } from "./components/RecentReleasesTable";
import { ReleaseOverviewPanel } from "./components/ReleaseOverviewPanel";
import { ResourceOverviewPanel } from "./components/ResourceOverviewPanel";

export function DashboardPage() {
  const {
    data: snapshot,
    error,
    isError,
    refetch,
  } = useQuery({
    queryFn: fetchDashboardSnapshot,
    queryKey: dashboardSnapshotQueryKey,
  });
  // 环境徽标按环境配置的 tone 着色；环境列表与其他页面共用同一个缓存。
  const { data: environmentSnapshot } = useQuery({
    queryFn: fetchEnvironmentsSnapshot,
    queryKey: environmentsSnapshotQueryKey,
  });
  const environmentTones = useMemo(
    () =>
      new Map(
        environmentSnapshot?.environments.map((environment) => [
          environment.id,
          environment.tone,
        ]) ?? [],
      ),
    [environmentSnapshot],
  );

  if (!snapshot && !isError) {
    return <PageSkeleton withHeader withKpis rows={3} kpiCount={6} />;
  }

  if (!snapshot) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="平台运行概览"
          description="关注当前已接入的应用、模块、构建、发布和平台资源状态"
        />
        <PageErrorState
          title="仪表盘数据加载失败"
          message={error instanceof Error ? error.message : "无法获取仪表盘聚合数据"}
          onRetry={() => {
            void refetch();
          }}
        />
      </div>
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
    <div className="flex flex-col gap-6">
      <PageHeader
        title="平台运行概览"
        description="关注当前已接入的应用、模块、构建、发布和平台资源状态"
        below={
          <div className="grid gap-3 md:grid-cols-3">
            <SummaryPill icon={Activity} label="构建成功率" value={buildSuccessRate} />
            <SummaryPill icon={Layers3} label="生效发布" value={`${activeReleaseCount} 个`} />
            <SummaryPill
              icon={Clock3}
              label="最近构建"
              value={snapshot.builds[0]?.startedAt ?? "-"}
            />
          </div>
        }
      />

      <MetricOverview metrics={snapshot.metrics} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <BuildTrendChart data={snapshot.buildTrend} />
        <ReleaseOverviewPanel environmentTones={environmentTones} releases={snapshot.releases} />
      </div>

      <ResourceOverviewPanel resources={snapshot.resources} />

      <div className="grid gap-6 xl:grid-cols-2">
        <RecentBuildsTable builds={snapshot.builds} environmentTones={environmentTones} />
        <RecentReleasesTable releases={snapshot.releases} environmentTones={environmentTones} />
      </div>

      <div className="text-right text-muted-foreground text-xs">
        数据更新时间 {formatUpdatedAt(snapshot.updatedAt)}
      </div>
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
    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-3 py-2.5">
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
