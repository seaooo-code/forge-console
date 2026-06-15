import { useQuery } from "@tanstack/react-query";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import {
  Beaker,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Code2,
  Download,
  FlaskConical,
  GitBranch,
  ListFilter,
  MoreHorizontal,
  Plus,
  RefreshCw,
  UserRound,
  UsersRound,
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

import { fetchDevTasksSnapshot } from "./api/dev-tasks-snapshot";
import { moduleStatusClass, pipelineRunClass, taskStatusClass } from "./constants";
import type { DevTaskRecord, DevTaskStatus } from "./types";

export function DevTasksPage() {
  const { data: snapshot } = useQuery({
    queryFn: fetchDevTasksSnapshot,
    queryKey: ["dev-tasks-snapshot"],
  });
  const stats = useMemo(
    () => [
      { detail: "点击查看", icon: ClipboardList, id: "todo", label: "待开发", value: 18 },
      { detail: "点击查看", icon: Code2, id: "dev", label: "开发中", value: 32 },
      { detail: "点击查看", icon: UsersRound, id: "joint", label: "联调中", value: 14 },
      { detail: "点击查看", icon: Beaker, id: "test", label: "测试中", value: 21 },
      { detail: "点击查看", icon: CheckCircle2, id: "release", label: "待发布", value: 9 },
    ],
    [],
  );

  const columnDefs = useMemo<ColDef<DevTaskRecord>[]>(
    () => [
      {
        cellRenderer: CheckboxCell,
        headerComponent: CheckboxHeader,
        maxWidth: 48,
        minWidth: 48,
        pinned: "left",
        resizable: false,
        sortable: false,
        suppressHeaderMenuButton: true,
        suppressMovable: true,
      },
      {
        cellRenderer: TaskIdCell,
        field: "id",
        flex: 0.75,
        headerName: "任务编号",
        minWidth: 120,
      },
      {
        cellRenderer: TaskNameCell,
        field: "title",
        flex: 1.25,
        headerName: "任务名称",
        minWidth: 220,
      },
      {
        cellRenderer: RelatedModulesCell,
        field: "moduleBadges",
        flex: 0.8,
        headerName: "关联模块",
        minWidth: 130,
      },
      {
        cellRenderer: PersonCell,
        field: "developer",
        flex: 0.75,
        headerName: "开发",
        minWidth: 110,
      },
      {
        cellRenderer: TesterCell,
        field: "tester",
        flex: 0.75,
        headerName: "测试",
        minWidth: 110,
      },
      {
        cellRenderer: ProgressCell,
        field: "progress",
        flex: 1,
        headerName: "进度",
        minWidth: 170,
      },
      {
        cellRenderer: StatusCell,
        field: "status",
        flex: 0.75,
        headerName: "状态",
        minWidth: 110,
      },
      {
        field: "createdAt",
        flex: 0.75,
        headerName: "创建",
        minWidth: 112,
      },
      {
        cellRenderer: ActionsCell,
        colId: "actions",
        flex: 0.7,
        headerName: "操作",
        minWidth: 128,
        sortable: false,
      },
    ],
    [],
  );

  const defaultColDef = useMemo<ColDef<DevTaskRecord>>(
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
        <div>
          <h1 className="font-semibold text-2xl text-slate-950 tracking-tight">开发任务</h1>
          <p className="mt-2 text-slate-600 text-sm">
            一个任务关联多个模块，记录分支、开发、测试与流水线
          </p>
        </div>
      </div>

      <div className="space-y-4 px-6 py-5">
        <section className="grid gap-3 xl:grid-cols-5">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.id} className="rounded-lg px-5 py-4 shadow-none">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-medium text-slate-500 text-sm">
                    <Icon className="size-4 text-slate-400" />
                    {item.label}
                  </div>
                  <div className="font-semibold text-3xl text-slate-950 leading-none">
                    {item.value}
                  </div>
                  <div className="font-medium text-slate-400 text-xs">{item.detail} ›</div>
                </div>
              </Card>
            );
          })}
        </section>

        <Card className="rounded-lg p-0 shadow-none">
          <div className="flex items-center justify-between border-slate-200 border-b px-4 py-3">
            <div className="font-semibold text-slate-900 text-sm">
              {snapshot.featuredTask.id} · {snapshot.featuredTask.title}
            </div>
            <Button
              variant="link"
              type="button"
              className="h-auto p-0 font-semibold text-blue-600 text-xs"
            >
              查看完整详情 →
            </Button>
          </div>
          <div className="grid gap-4 p-4 xl:grid-cols-3">
            <div>
              <div className="mb-2 font-semibold text-slate-500 text-xs">关联模块 · 分支</div>
              <div className="space-y-2">
                {snapshot.featuredTask.relatedModules.map((module) => (
                  <div
                    key={module.module}
                    className="flex items-center gap-3 rounded-md bg-slate-50 px-3 py-2"
                  >
                    <span className="w-28 shrink-0 font-semibold text-slate-800 text-sm">
                      {module.module}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-mono text-slate-600 text-xs">
                      <GitBranch className="mr-1 inline size-3 text-slate-400" />
                      {module.branch}
                    </span>
                    <span
                      className={cn(
                        "inline-flex h-6 items-center rounded border px-2 font-semibold text-xs",
                        moduleStatusClass[module.status],
                      )}
                    >
                      {module.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 font-semibold text-slate-500 text-xs">人员配置</div>
              <div className="space-y-2">
                {snapshot.featuredTask.members.map((member) => (
                  <div
                    key={member.label}
                    className="flex items-center justify-between gap-4 rounded-md bg-slate-50 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-slate-500">{member.label}</span>
                    <span className="font-semibold text-slate-800">{member.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 font-semibold text-slate-500 text-xs">最近 Pipeline Run</div>
              <div className="space-y-2">
                {snapshot.featuredTask.pipelineRuns.map((run) => (
                  <div
                    key={run.id}
                    className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-xs"
                  >
                    <span className="w-16 shrink-0 font-mono font-semibold text-slate-700">
                      {run.id}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-semibold text-slate-700">
                      {run.module}
                    </span>
                    <span className="w-16 shrink-0 text-right text-slate-500">{run.duration}</span>
                    <span
                      className={cn(
                        "inline-flex h-6 items-center rounded border px-2 font-semibold leading-none",
                        pipelineRunClass[run.status],
                      )}
                    >
                      {run.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

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
                  { label: "开发中", value: "dev" },
                  { label: "联调中", value: "joint" },
                  { label: "测试中", value: "test" },
                ]}
              />
              <ConsoleFilterSelect
                icon={Code2}
                label="开发"
                value="all"
                options={[
                  { label: "全部开发", value: "all" },
                  { label: "li.ming", value: "li.ming" },
                  { label: "wang.fang", value: "wang.fang" },
                  { label: "zhao.lei", value: "zhao.lei" },
                ]}
              />
              <ConsoleFilterSelect
                icon={FlaskConical}
                label="测试"
                value="all"
                options={[
                  { label: "全部测试", value: "all" },
                  { label: "qa.zhao", value: "qa.zhao" },
                  { label: "qa.li", value: "qa.li" },
                  { label: "qa.sun", value: "qa.sun" },
                ]}
              />
              <ConsoleFilterSelect
                icon={BriefcaseBusiness}
                label="模块"
                value="all"
                options={[
                  { label: "全部模块", value: "all" },
                  { label: "home", value: "home" },
                  { label: "ai-assistant", value: "ai" },
                  { label: "message", value: "message" },
                ]}
              />
              <ConsoleFilterSelect
                icon={CalendarDays}
                label="创建时间"
                value="all"
                options={[
                  { label: "全部时间", value: "all" },
                  { label: "近 7 天", value: "7d" },
                  { label: "近 30 天", value: "30d" },
                ]}
              />
              <ConsoleSearchInput />
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline" size="icon" aria-label="刷新开发任务">
                <RefreshCw className="size-4" />
              </Button>
              <Button variant="outline" size="icon" aria-label="下载开发任务">
                <Download className="size-4" />
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="size-4" />
                新建任务
              </Button>
            </div>
          </div>

          <AgGridReact<DevTaskRecord>
            rowData={snapshot.tasks}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            domLayout="autoHeight"
            headerHeight={44}
            rowHeight={62}
            theme={consoleGridTheme}
            suppressCellFocus
            suppressContextMenu
            getRowId={({ data }) => data.id}
          />

          <ConsoleTableFooter total={snapshot.tasks.length} />
        </MockSurface>
      </div>
    </>
  );
}

function CheckboxHeader() {
  return <Checkbox aria-label="选择全部开发任务" />;
}

function CheckboxCell() {
  return (
    <div className="flex h-full items-center">
      <Checkbox aria-label="选择开发任务" />
    </div>
  );
}

function TaskIdCell({ value }: ICellRendererParams<DevTaskRecord, string>) {
  return value ? <span className="font-semibold text-blue-600 text-sm">{value}</span> : null;
}

function TaskNameCell({ data }: ICellRendererParams<DevTaskRecord>) {
  if (!data) {
    return null;
  }

  return (
    <div className="min-w-0 leading-tight">
      <div className="truncate font-semibold text-slate-900">{data.title}</div>
      <div className="font-mono text-slate-500 text-xs">{data.requirement}</div>
    </div>
  );
}

function RelatedModulesCell({ data }: ICellRendererParams<DevTaskRecord>) {
  if (!data) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5">
      {data.moduleBadges.map((badge) => (
        <span
          key={badge}
          className="inline-flex size-5 items-center justify-center rounded-full bg-blue-500 font-semibold text-white text-xs leading-none"
        >
          {badge}
        </span>
      ))}
      <span className="font-semibold text-slate-600 text-xs">{data.moduleCount}</span>
    </div>
  );
}

function PersonCell({ value }: ICellRendererParams<DevTaskRecord, string>) {
  return value ? (
    <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 text-sm">
      <UserRound className="size-3.5 text-slate-400" />
      {value}
    </span>
  ) : null;
}

function TesterCell({ value }: ICellRendererParams<DevTaskRecord, string>) {
  return value ? (
    <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 text-sm">
      <FlaskConical className="size-3.5 text-slate-400" />
      {value}
    </span>
  ) : null;
}

function ProgressCell({ value }: ICellRendererParams<DevTaskRecord, number>) {
  if (typeof value !== "number") {
    return null;
  }

  return (
    <div className="flex w-full items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-blue-600" style={{ width: `${value}%` }} />
      </div>
      <span className="w-9 text-slate-500 text-xs">{value}%</span>
    </div>
  );
}

function StatusCell({ value }: ICellRendererParams<DevTaskRecord, DevTaskStatus>) {
  if (!value) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded border px-2 font-semibold text-xs leading-none",
        taskStatusClass[value],
      )}
    >
      {value}
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
        详情
      </Button>
      <Button
        variant="link"
        type="button"
        className="h-auto p-0 text-blue-600 text-xs hover:text-blue-700"
      >
        构建
      </Button>
      <Button variant="ghost" type="button" size="icon" className="size-6 text-slate-500">
        <MoreHorizontal className="size-4" />
      </Button>
    </div>
  );
}
