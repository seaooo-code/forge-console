import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { BuildTrendChart } from "./components/BuildTrendChart";
import { MetricOverview } from "./components/MetricOverview";
import { PipelineSuccessPanel } from "./components/PipelineSuccessPanel";
import { RecentReleasesTable } from "./components/RecentReleasesTable";
import { RecentTasksTable } from "./components/RecentTasksTable";
import { useDashboardContextStore } from "./model/use-dashboard-context-store";
import type { DashboardSnapshot } from "./types";

type DashboardPageProps = {
  snapshot: DashboardSnapshot;
};

export function DashboardPage({ snapshot }: DashboardPageProps) {
  return (
    <>
      <div className="border-slate-200 border-b bg-white px-6 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="font-semibold text-2xl text-slate-950 tracking-tight">研发效能总览</h1>
            <p className="mt-2 text-slate-600 text-sm">
              实时掌握 RN Bundle 研发、构建、发布全链路指标
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 xl:items-end">
            <DashboardContextControls />
            <div className="text-slate-400 text-xs">
              数据更新时间 {formatUpdatedAt(snapshot.updatedAt)}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-6 py-5">
        <MetricOverview metrics={snapshot.metrics} />

        <section className="grid gap-4 xl:grid-cols-4">
          <div className="xl:col-span-3">
            <BuildTrendChart data={snapshot.buildTrend} />
          </div>
          <PipelineSuccessPanel rates={snapshot.pipelineRates} />
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <RecentTasksTable tasks={snapshot.tasks} />
          <RecentReleasesTable releases={snapshot.releases} />
        </section>
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
      <Button
        variant="outline"
        type="button"
        className="h-10 shrink-0 gap-2 border-slate-200 bg-white px-4 font-semibold text-slate-700 shadow-sm"
      >
        <span className="size-2.5 rounded-full bg-emerald-500" />
        {project}
        <ChevronDown className="size-4 text-slate-400" />
      </Button>

      <Select
        value={environment}
        onValueChange={(value) => setEnvironment(value as "prod" | "pre" | "test")}
      >
        <SelectTrigger className="h-10 shrink-0 gap-2 border-slate-200 bg-white px-4 font-medium text-slate-700 shadow-sm">
          <span>环境:</span>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="prod">prod</SelectItem>
          <SelectItem value="pre">pre</SelectItem>
          <SelectItem value="test">test</SelectItem>
        </SelectContent>
      </Select>
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
