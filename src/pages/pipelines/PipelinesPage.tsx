import { useQuery } from "@tanstack/react-query";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import {
  Circle,
  Download,
  GitBranch,
  Hammer,
  ListFilter,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Rocket,
  ServerCog,
  UserRound,
} from "lucide-react";
import { useMemo } from "react";

import {
  ConsoleFilterSelect,
  ConsoleSearchInput,
  ConsoleTableFooter,
} from "@/components/common/ConsoleControls";
import { consoleGridTheme } from "@/components/common/console-grid-theme";
import { MockCard as Card, MockSurface } from "@/components/common/MockSurface";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

import { fetchPipelinesSnapshot } from "./api/pipelines-snapshot";
import { pipelineStatusClass, pipelineStepLabels } from "./constants";
import type { PipelineDefinitionRecord, PipelineDefinitionStatus, PipelineStepType } from "./types";

export function PipelinesPage() {
  const { data: snapshot } = useQuery({
    queryFn: fetchPipelinesSnapshot,
    queryKey: ["pipelines-snapshot"],
  });
  const stats = useMemo(
    () =>
      snapshot
        ? [
            { id: "total", label: "流水线", value: snapshot.summary.total, tone: "sky" },
            { id: "enabled", label: "启用中", value: snapshot.summary.enabled, tone: "emerald" },
            {
              id: "build",
              label: "含构建能力",
              value: snapshot.summary.buildEnabled,
              tone: "blue",
            },
            {
              id: "deploy",
              label: "含部署能力",
              value: snapshot.summary.deployEnabled,
              tone: "amber",
            },
          ]
        : [],
    [snapshot],
  );
  const columnDefs = useMemo<ColDef<PipelineDefinitionRecord>[]>(
    () => [
      {
        cellRenderer: CheckboxCell,
        headerComponent: CheckboxHeader,
        maxWidth: 44,
        minWidth: 44,
        pinned: "left",
        resizable: false,
        sortable: false,
        suppressHeaderMenuButton: true,
        suppressMovable: true,
      },
      {
        cellRenderer: PipelineCell,
        field: "name",
        flex: 1.3,
        headerName: "流水线",
        minWidth: 240,
      },
      {
        cellRenderer: StepsCell,
        field: "steps",
        flex: 1.25,
        headerName: "原子能力",
        minWidth: 220,
      },
      {
        field: "triggerMode",
        flex: 1.05,
        headerName: "触发方式",
        minWidth: 180,
      },
      {
        field: "owner",
        flex: 0.75,
        headerName: "负责人",
        minWidth: 110,
      },
      {
        cellRenderer: StatusCell,
        field: "status",
        flex: 0.65,
        headerName: "状态",
        minWidth: 92,
      },
      {
        field: "lastRunAt",
        flex: 0.76,
        headerName: "最近运行",
        minWidth: 112,
      },
      {
        field: "updatedAt",
        flex: 0.9,
        headerName: "更新时间",
        minWidth: 136,
      },
      {
        cellRenderer: ActionsCell,
        colId: "actions",
        flex: 0.74,
        headerName: "操作",
        minWidth: 112,
        sortable: false,
      },
    ],
    [],
  );
  const defaultColDef = useMemo<ColDef<PipelineDefinitionRecord>>(
    () => ({
      cellClass: "flex items-center",
      cellStyle: {
        alignItems: "center",
        display: "flex",
      },
      resizable: false,
      sortable: false,
      suppressHeaderMenuButton: true,
      suppressMovable: true,
    }),
    [],
  );

  if (!snapshot) {
    return null;
  }

  return (
    <>
      <div className="border-slate-200 border-b bg-white px-6 py-5">
        <h1 className="font-semibold text-2xl text-slate-950 tracking-tight">流水线管理</h1>
        <p className="mt-2 text-slate-600 text-sm">
          管理可独立运行的流水线定义，构建与部署作为流水线原子能力编排
        </p>
      </div>

      <div className="space-y-4 px-6 py-5">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <Card key={item.id} className="rounded-lg px-5 py-4 shadow-none">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium text-slate-500 text-sm">{item.label}</div>
                  <div className="mt-2 font-semibold text-3xl text-slate-950 leading-none">
                    {item.value}
                  </div>
                </div>
                <div
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded border",
                    item.tone === "emerald" && "border-emerald-200 bg-emerald-50 text-emerald-600",
                    item.tone === "amber" && "border-amber-200 bg-amber-50 text-amber-600",
                    item.tone === "blue" && "border-blue-200 bg-blue-50 text-blue-600",
                    item.tone === "sky" && "border-sky-200 bg-sky-50 text-sky-600",
                  )}
                >
                  <Circle className="size-2 fill-current" />
                </div>
              </div>
            </Card>
          ))}
        </section>

        <MockSurface
          as="section"
          className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-slate-200 border-b px-4 py-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <ConsoleFilterSelect
                icon={ListFilter}
                label="状态"
                value="all"
                options={[
                  { label: "全部状态", value: "all" },
                  { label: "启用中", value: "enabled" },
                  { label: "已停用", value: "disabled" },
                ]}
              />
              <ConsoleFilterSelect
                icon={ServerCog}
                label="能力"
                value="all"
                options={[
                  { label: "全部能力", value: "all" },
                  { label: "构建", value: "build" },
                  { label: "部署", value: "deploy" },
                  { label: "测试", value: "test" },
                ]}
              />
              <ConsoleFilterSelect
                icon={UserRound}
                label="负责人"
                value="all"
                options={[
                  { label: "全部负责人", value: "all" },
                  { label: "platform.bot", value: "platform.bot" },
                  { label: "release.bot", value: "release.bot" },
                ]}
              />
              <ConsoleSearchInput />
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline" size="icon" aria-label="刷新流水线">
                <RefreshCw className="size-4" />
              </Button>
              <Button variant="outline" size="icon" aria-label="下载流水线">
                <Download className="size-4" />
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="size-4" />
                新建流水线
              </Button>
            </div>
          </div>

          <AgGridReact<PipelineDefinitionRecord>
            rowData={snapshot.pipelines}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            domLayout="autoHeight"
            headerHeight={44}
            rowHeight={58}
            theme={consoleGridTheme}
            suppressCellFocus
            suppressContextMenu
            getRowId={({ data }) => data.id}
          />

          <ConsoleTableFooter total={snapshot.pipelines.length} />
        </MockSurface>
      </div>
    </>
  );
}

function CheckboxHeader() {
  return <Checkbox aria-label="选择全部流水线" />;
}

function CheckboxCell() {
  return (
    <div className="flex h-full items-center">
      <Checkbox aria-label="选择流水线" />
    </div>
  );
}

function PipelineCell({ data }: ICellRendererParams<PipelineDefinitionRecord>) {
  if (!data) {
    return null;
  }

  return (
    <div className="min-w-0 leading-tight">
      <div className="truncate font-semibold text-blue-600 text-sm">{data.name}</div>
      <div className="mt-1 truncate text-slate-600 text-xs">
        {data.id} · {data.description}
      </div>
    </div>
  );
}

function StepsCell({ value }: ICellRendererParams<PipelineDefinitionRecord, PipelineStepType[]>) {
  if (!value) {
    return null;
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      {value.map((step) => {
        const Icon = step === "build" ? Hammer : step === "deploy" ? Rocket : GitBranch;

        return (
          <span
            key={step}
            className="inline-flex h-6 items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 font-medium text-slate-600 text-xs"
          >
            <Icon className="size-3" />
            {pipelineStepLabels[step]}
          </span>
        );
      })}
    </div>
  );
}

function StatusCell({
  value,
}: ICellRendererParams<PipelineDefinitionRecord, PipelineDefinitionStatus>) {
  if (!value) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded border px-2 font-semibold text-xs leading-none",
        pipelineStatusClass[value],
      )}
    >
      {value === "enabled" ? "启用中" : "已停用"}
    </span>
  );
}

function ActionsCell() {
  return (
    <div className="flex h-full items-center gap-2 whitespace-nowrap font-medium text-blue-600 text-xs">
      <Button
        variant="link"
        type="button"
        className="h-auto p-0 text-blue-600 text-xs hover:text-blue-700"
      >
        运行
      </Button>
      <Button
        variant="link"
        type="button"
        className="h-auto p-0 text-blue-600 text-xs hover:text-blue-700"
      >
        编辑
      </Button>
      <Button variant="ghost" type="button" size="icon" className="size-6 text-slate-500">
        <MoreHorizontal className="size-4" />
      </Button>
    </div>
  );
}
