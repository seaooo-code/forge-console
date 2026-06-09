import { useQuery } from "@tanstack/react-query";

import { consoleSnapshotQueryKey, fetchConsoleSnapshot } from "./api/console-snapshot";
import { AppSidebar } from "./components/AppSidebar";
import { BuildTrendChart } from "./components/BuildTrendChart";
import { MetricOverview } from "./components/MetricOverview";
import { PipelineSuccessPanel } from "./components/PipelineSuccessPanel";
import { RecentReleasesTable } from "./components/RecentReleasesTable";
import { RecentTasksTable } from "./components/RecentTasksTable";
import { TopToolbar } from "./components/TopToolbar";
import type { ConsoleSnapshot } from "./types";

const emptySnapshot: ConsoleSnapshot = {
  buildTrend: [],
  metrics: [],
  navGroups: [],
  pipelineRates: [],
  releases: [],
  tasks: [],
  updatedAt: "",
};

export function ConsoleDashboard() {
  const { data, isFetching, refetch } = useQuery({
    queryKey: consoleSnapshotQueryKey,
    queryFn: fetchConsoleSnapshot,
    refetchInterval: 18_000,
  });

  const snapshot = data ?? emptySnapshot;

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[248px_minmax(0,1fr)]">
        <AppSidebar navGroups={snapshot.navGroups} />

        <section className="min-w-0">
          <TopToolbar isFetching={isFetching} onRefresh={() => void refetch()} />

          <div className="border-slate-200 border-b bg-white px-6 py-5">
            <div className="text-slate-500 text-xs">小米汽车 / 仪表盘</div>
            <div className="mt-2 flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h1 className="font-semibold text-2xl text-slate-950 tracking-tight">
                  研发效能总览
                </h1>
                <p className="mt-2 text-slate-600 text-sm">
                  实时掌握 RN Bundle 研发、构建、发布全链路指标
                </p>
              </div>
              <div className="text-right text-slate-400 text-xs">
                数据更新时间 {formatUpdatedAt(snapshot.updatedAt)}
              </div>
            </div>
          </div>

          <div className="space-y-4 px-6 py-5">
            <MetricOverview metrics={snapshot.metrics} />

            <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
              <BuildTrendChart data={snapshot.buildTrend} />
              <PipelineSuccessPanel rates={snapshot.pipelineRates} />
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
              <RecentTasksTable tasks={snapshot.tasks} />
              <RecentReleasesTable releases={snapshot.releases} />
            </section>
          </div>
        </section>
      </div>
    </main>
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
