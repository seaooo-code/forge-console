import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import {
  Box,
  Boxes,
  CircleDot,
  CirclePause,
  Download,
  GitBranch,
  GitFork,
  Layers3,
  type LucideIcon,
  MoreHorizontal,
  Package,
  Plus,
  RefreshCw,
  Search,
  UserRound,
  Workflow,
} from "lucide-react";
import { useMemo } from "react";

import { consoleGridTheme } from "@/components/common/ConsolePage";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import type { ModuleRecord, ModuleStatus, ModulesSnapshot } from "./types";

type ModulesPageProps = {
  snapshot: ModulesSnapshot;
};

const statusClass: Record<ModuleStatus, string> = {
  冻结: "border-slate-200 bg-slate-50 text-slate-600",
  活跃: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const kindClass: Record<ModuleRecord["kind"], string> = {
  Common: "border-amber-200 bg-amber-50 text-amber-700",
  Feature: "border-sky-200 bg-sky-50 text-sky-700",
};

export function ModulesPage({ snapshot }: ModulesPageProps) {
  const stats = useMemo(
    () => [
      {
        detail: "覆盖 8 个应用",
        icon: Boxes,
        iconClass: "bg-blue-50 text-blue-600",
        id: "total",
        label: "模块总数",
        value: 42,
      },
      {
        detail: "依赖基础",
        icon: Layers3,
        iconClass: "bg-amber-50 text-amber-600",
        id: "common",
        label: "Common Bundle",
        value: 8,
      },
      {
        detail: "业务模块",
        icon: Package,
        iconClass: "bg-sky-50 text-sky-600",
        id: "feature",
        label: "Feature Bundle",
        value: 34,
      },
      {
        detail: "近 7 天有构建",
        icon: GitBranch,
        iconClass: "bg-emerald-50 text-emerald-600",
        id: "active",
        label: "活跃模块",
        value: 38,
      },
      {
        detail: "暂停研发",
        icon: CirclePause,
        iconClass: "bg-slate-100 text-slate-500",
        id: "frozen",
        label: "冻结模块",
        value: 4,
      },
    ],
    [],
  );

  const columnDefs = useMemo<ColDef<ModuleRecord>[]>(
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
        cellRenderer: ModuleCell,
        field: "name",
        flex: 1.05,
        headerName: "模块",
        minWidth: 190,
      },
      {
        cellRenderer: KindCell,
        field: "kind",
        flex: 0.7,
        headerName: "类型",
        minWidth: 110,
      },
      {
        cellRenderer: RepositoryCell,
        field: "repository",
        flex: 1.55,
        headerName: "仓库",
        minWidth: 260,
      },
      { field: "owner", flex: 0.75, headerName: "负责人", minWidth: 110 },
      {
        field: "defaultPipeline",
        flex: 0.8,
        headerName: "默认流水线",
        minWidth: 130,
        wrapText: true,
      },
      {
        cellRenderer: VersionCell,
        field: "productionVersion",
        flex: 0.7,
        headerName: "线上版本",
        minWidth: 105,
      },
      {
        cellRenderer: StatusCell,
        field: "status",
        flex: 0.55,
        headerName: "状态",
        minWidth: 86,
      },
      {
        cellRenderer: ActionsCell,
        colId: "actions",
        flex: 0.9,
        headerName: "操作",
        minWidth: 150,
        sortable: false,
      },
    ],
    [],
  );

  const defaultColDef = useMemo<ColDef<ModuleRecord>>(
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

  return (
    <>
      <div className="border-slate-200 border-b bg-white px-6 py-5">
        <div>
          <h1 className="font-semibold text-2xl text-slate-950 tracking-tight">模块管理</h1>
          <p className="mt-2 text-slate-600 text-sm">管理 RN 模块仓库、流水线模板与 Bundle 产物</p>
        </div>
      </div>

      <div className="space-y-4 px-6 py-5">
        <section className="grid gap-3 xl:grid-cols-5">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.id} className="rounded-lg px-5 py-4 shadow-none">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="font-medium text-slate-500 text-sm">{item.label}</div>
                    <div className="font-semibold text-3xl text-slate-950 leading-none">
                      {item.value}
                    </div>
                    <div className="font-medium text-slate-400 text-xs">{item.detail}</div>
                  </div>
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-lg",
                      item.iconClass,
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                </div>
              </Card>
            );
          })}
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-slate-200 border-b px-4 py-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <FilterSelect
                icon={Boxes}
                label="类型"
                value="all"
                options={[
                  { label: "全部类型", value: "all" },
                  { label: "Common", value: "common" },
                  { label: "Feature", value: "feature" },
                ]}
              />
              <FilterSelect
                icon={CircleDot}
                label="状态"
                value="all"
                options={[
                  { label: "全部状态", value: "all" },
                  { label: "活跃", value: "active" },
                  { label: "冻结", value: "frozen" },
                ]}
              />
              <FilterSelect
                icon={UserRound}
                label="负责人"
                value="all"
                options={[
                  { label: "全部负责人", value: "all" },
                  { label: "li.ming", value: "li.ming" },
                  { label: "wang.fang", value: "wang.fang" },
                  { label: "zhao.lei", value: "zhao.lei" },
                ]}
              />
              <FilterSelect
                icon={Workflow}
                label="流水线模板"
                value="all"
                options={[
                  { label: "全部流水线模板", value: "all" },
                  { label: "RN Standard Pipeline", value: "rn" },
                  { label: "Vehicle Pipeline", value: "vehicle" },
                  { label: "AI Pipeline", value: "ai" },
                ]}
              />
              <div className="flex h-9 min-w-60 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-slate-500">
                <Search className="size-4 shrink-0" />
                <Input
                  className="h-auto min-w-0 flex-1 border-0 bg-transparent px-0 py-0 text-sm shadow-none placeholder:text-slate-400 focus-visible:ring-0"
                  placeholder="搜索..."
                />
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline" size="icon" aria-label="刷新模块列表">
                <RefreshCw className="size-4" />
              </Button>
              <Button variant="outline" size="icon" aria-label="下载模块列表">
                <Download className="size-4" />
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="size-4" />
                新建模块
              </Button>
            </div>
          </div>

          <AgGridReact<ModuleRecord>
            rowData={snapshot.modules}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            domLayout="autoHeight"
            headerHeight={44}
            rowHeight={64}
            theme={consoleGridTheme}
            suppressCellFocus
            suppressContextMenu
            getRowId={({ data }) => data.id}
          />

          <div className="flex flex-col gap-3 border-slate-200 border-t px-4 py-3 text-slate-500 text-sm md:flex-row md:items-center md:justify-between">
            <span>共 {snapshot.modules.length} 条</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                type="button"
                size="icon"
                className="size-8 border-slate-200 bg-white text-slate-400"
              >
                ‹
              </Button>
              <Button
                type="button"
                size="icon"
                className="size-8 border border-blue-600 bg-blue-600 font-medium text-white hover:bg-blue-700"
              >
                1
              </Button>
              <Button
                variant="outline"
                type="button"
                size="icon"
                className="size-8 border-slate-200 bg-white text-slate-400"
              >
                ›
              </Button>
              <Select defaultValue="20">
                <SelectTrigger className="h-8 w-27 border-slate-200 bg-white px-3 text-slate-600 text-xs shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20 条/页</SelectItem>
                  <SelectItem value="50">50 条/页</SelectItem>
                  <SelectItem value="100">100 条/页</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

type FilterSelectProps = {
  icon: LucideIcon;
  label: string;
  options: Array<{
    label: string;
    value: string;
  }>;
  value: string;
};

function FilterSelect({ icon: Icon, label, options, value }: FilterSelectProps) {
  return (
    <Select defaultValue={value}>
      <SelectTrigger
        className="h-9 w-auto min-w-28 gap-2 border-slate-200 bg-white px-3 font-medium text-slate-600 shadow-sm"
        aria-label={`${label}筛选`}
      >
        <Icon className="size-3.5 shrink-0 text-slate-400" />
        <span>{label}</span>
        <SelectValue className="hidden" />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function CheckboxHeader() {
  return <Checkbox aria-label="选择全部模块" />;
}

function CheckboxCell() {
  return (
    <div className="flex h-full items-center">
      <Checkbox aria-label="选择模块" />
    </div>
  );
}

function ModuleCell({ data }: ICellRendererParams<ModuleRecord>) {
  if (!data) {
    return null;
  }

  const Icon = data.kind === "Common" ? Box : Package;

  return (
    <div className="flex h-full items-center gap-3">
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-md shadow-sm",
          data.kind === "Common" ? "bg-amber-100 text-amber-600" : "bg-sky-100 text-sky-600",
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 leading-tight">
        <div className="truncate font-semibold text-slate-900">{data.name}</div>
        <div className="text-slate-500 text-xs">{data.kind} Bundle</div>
      </div>
    </div>
  );
}

function KindCell({ value }: ICellRendererParams<ModuleRecord, ModuleRecord["kind"]>) {
  if (!value) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded border px-2 font-semibold text-xs leading-none",
        kindClass[value],
      )}
    >
      {value}
    </span>
  );
}

function RepositoryCell({ value }: ICellRendererParams<ModuleRecord, string>) {
  if (!value) {
    return null;
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <GitFork className="size-3.5 shrink-0 text-slate-400" />
      <span className="truncate font-mono text-slate-600 text-xs">{value}</span>
    </div>
  );
}

function VersionCell({ value }: ICellRendererParams<ModuleRecord, string>) {
  return value ? (
    <span className="inline-flex h-6 items-center rounded border border-emerald-200 bg-emerald-50 px-2 font-mono font-semibold text-emerald-700 text-xs leading-none">
      {value}
    </span>
  ) : null;
}

function StatusCell({ value }: ICellRendererParams<ModuleRecord, ModuleStatus>) {
  if (!value) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded border px-2 font-medium text-xs leading-none",
        statusClass[value],
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
        Bundle
      </Button>
      <Button
        variant="link"
        type="button"
        className="h-auto p-0 text-blue-600 text-xs hover:text-blue-700"
      >
        流水线
      </Button>
      <Button variant="ghost" type="button" size="icon" className="size-6 text-slate-500">
        <MoreHorizontal className="size-4" />
      </Button>
    </div>
  );
}
