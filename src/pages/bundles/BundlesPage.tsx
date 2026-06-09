import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import {
  Box,
  CloudUpload,
  Download,
  GitBranch,
  ListFilter,
  type LucideIcon,
  MoreHorizontal,
  PackageSearch,
  RefreshCw,
  Search,
  UserRound,
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

import type { BundleRecord, BundleStatus, BundlesSnapshot } from "./types";

type BundlesPageProps = {
  snapshot: BundlesSnapshot;
};

const bundleStatusClass: Record<BundleStatus, string> = {
  已发布: "border-emerald-200 bg-emerald-50 text-emerald-700",
  已归档: "border-slate-200 bg-slate-50 text-slate-600",
  已驳回: "border-red-200 bg-red-50 text-red-600",
  草稿: "border-sky-200 bg-sky-50 text-sky-700",
};

const environmentClass: Record<string, string> = {
  dev: "border-sky-200 bg-sky-50 text-sky-700",
  pre: "border-amber-200 bg-amber-50 text-amber-700",
  prod: "border-red-200 bg-red-50 text-red-600",
  test: "border-blue-200 bg-blue-50 text-blue-700",
};

export function BundlesPage({ snapshot }: BundlesPageProps) {
  const stats = useMemo(
    () => [
      {
        detail: "覆盖 42 个模块",
        id: "total",
        label: "Bundle 总数",
        value: "3,284",
      },
      {
        detail: "+14.2%",
        id: "today",
        label: "今日新增",
        value: "126",
      },
      {
        detail: "下降 3.6%",
        id: "size",
        label: "平均体积",
        value: "412 KB",
      },
      {
        detail: "超过 600 KB 阈值",
        id: "warning",
        label: "体积告警",
        value: "8",
      },
    ],
    [],
  );

  const columnDefs = useMemo<ColDef<BundleRecord>[]>(
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
        cellRenderer: ModuleCell,
        field: "module",
        flex: 0.75,
        headerName: "模块",
        minWidth: 92,
      },
      {
        cellRenderer: VersionCell,
        field: "version",
        flex: 0.82,
        headerName: "版本号",
        minWidth: 104,
      },
      {
        field: "build",
        flex: 0.55,
        headerName: "BUILD",
        minWidth: 76,
      },
      {
        cellRenderer: CommitCell,
        field: "commit",
        flex: 0.65,
        headerName: "COMMIT",
        minWidth: 86,
      },
      {
        cellRenderer: BranchCell,
        field: "branch",
        flex: 1.35,
        headerName: "分支",
        minWidth: 176,
      },
      {
        cellRenderer: SizeCell,
        field: "sizeKb",
        flex: 0.65,
        headerName: "体积",
        minWidth: 84,
      },
      {
        cellRenderer: EnvironmentsCell,
        field: "environments",
        flex: 0.8,
        headerName: "部署环境",
        minWidth: 96,
      },
      {
        field: "creator",
        flex: 0.65,
        headerName: "创建人",
        minWidth: 84,
      },
      {
        field: "createdAt",
        flex: 0.86,
        headerName: "创建时间",
        minWidth: 112,
      },
      {
        cellRenderer: StatusCell,
        field: "status",
        flex: 0.55,
        headerName: "状态",
        minWidth: 76,
      },
      {
        cellRenderer: ActionsCell,
        colId: "actions",
        flex: 0.62,
        headerName: "操作",
        minWidth: 86,
        sortable: false,
      },
    ],
    [],
  );

  const defaultColDef = useMemo<ColDef<BundleRecord>>(
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
          <h1 className="font-semibold text-2xl text-slate-950 tracking-tight">Bundle 版本</h1>
          <p className="mt-2 text-slate-600 text-sm">所有模块构建产物的完整版本库</p>
        </div>
      </div>

      <div className="space-y-4 px-6 py-5">
        <section className="grid gap-3 xl:grid-cols-4">
          {stats.map((item) => (
            <Card key={item.id} className="rounded-lg px-5 py-4 shadow-none">
              <div className="space-y-2">
                <div className="font-medium text-slate-500 text-sm">{item.label}</div>
                <div className="font-semibold text-3xl text-slate-950 leading-none">
                  {item.value}
                </div>
                <div className="font-medium text-slate-400 text-xs">{item.detail}</div>
              </div>
            </Card>
          ))}
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-slate-200 border-b px-4 py-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <FilterSelect
                icon={PackageSearch}
                label="模块"
                value="all"
                options={[
                  { label: "全部模块", value: "all" },
                  { label: "common", value: "common" },
                  { label: "home", value: "home" },
                  { label: "vehicle", value: "vehicle" },
                ]}
              />
              <FilterSelect
                icon={ListFilter}
                label="状态"
                value="all"
                options={[
                  { label: "全部状态", value: "all" },
                  { label: "草稿", value: "draft" },
                  { label: "已发布", value: "published" },
                  { label: "已驳回", value: "rejected" },
                ]}
              />
              <FilterSelect
                icon={Box}
                label="环境"
                value="all"
                options={[
                  { label: "全部环境", value: "all" },
                  { label: "dev", value: "dev" },
                  { label: "test / pre", value: "test-pre" },
                  { label: "prod", value: "prod" },
                ]}
              />
              <FilterSelect
                icon={GitBranch}
                label="分支"
                value="all"
                options={[
                  { label: "全部分支", value: "all" },
                  { label: "feature", value: "feature" },
                  { label: "release", value: "release" },
                ]}
              />
              <FilterSelect
                icon={UserRound}
                label="创建人"
                value="all"
                options={[
                  { label: "全部创建人", value: "all" },
                  { label: "li.ming", value: "li.ming" },
                  { label: "wang.fang", value: "wang.fang" },
                  { label: "zhao.lei", value: "zhao.lei" },
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
              <Button variant="outline" size="icon" aria-label="刷新 Bundle 版本">
                <RefreshCw className="size-4" />
              </Button>
              <Button variant="outline" size="icon" aria-label="下载 Bundle 版本">
                <Download className="size-4" />
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <CloudUpload className="size-4" />
                手动上传
              </Button>
            </div>
          </div>

          <AgGridReact<BundleRecord>
            rowData={snapshot.bundles}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            domLayout="autoHeight"
            headerHeight={44}
            rowHeight={58}
            theme={consoleGridTheme}
            suppressCellFocus
            suppressContextMenu
            getRowId={({ data }) => `${data.module}-${data.version}-${data.build}`}
          />

          <div className="flex flex-col gap-3 border-slate-200 border-t px-4 py-3 text-slate-500 text-sm md:flex-row md:items-center md:justify-between">
            <span>共 {snapshot.bundles.length} 条</span>
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
  return <Checkbox aria-label="选择全部 Bundle 版本" />;
}

function CheckboxCell() {
  return (
    <div className="flex h-full items-center">
      <Checkbox aria-label="选择 Bundle 版本" />
    </div>
  );
}

function ModuleCell({ value }: ICellRendererParams<BundleRecord, string>) {
  return value ? (
    <span className="inline-flex items-center gap-2 font-semibold text-slate-900 text-sm">
      <span className="flex size-7 items-center justify-center rounded-md bg-cyan-100 text-cyan-600">
        <Box className="size-4" />
      </span>
      {value}
    </span>
  ) : null;
}

function VersionCell({ value }: ICellRendererParams<BundleRecord, string>) {
  return value ? (
    <span className="font-mono font-semibold text-slate-900 text-sm">{value}</span>
  ) : null;
}

function CommitCell({ value }: ICellRendererParams<BundleRecord, string>) {
  return value ? <span className="font-mono text-slate-700 text-xs">→ {value}</span> : null;
}

function BranchCell({ value }: ICellRendererParams<BundleRecord, string>) {
  return value ? <span className="truncate font-mono text-slate-700 text-xs">{value}</span> : null;
}

function SizeCell({ value }: ICellRendererParams<BundleRecord, number>) {
  if (typeof value !== "number") {
    return null;
  }

  const barColor = value > 600 ? "bg-red-500" : value > 400 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="flex w-full items-center gap-2">
      <span className="w-12 font-semibold text-slate-700 text-xs">{value} KB</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn("h-full rounded-full", barColor)}
          style={{ width: `${Math.min(value / 7, 100)}%` }}
        />
      </div>
    </div>
  );
}

function EnvironmentsCell({ value }: ICellRendererParams<BundleRecord, string[]>) {
  if (!value || value.length === 0) {
    return <span className="text-slate-400">—</span>;
  }

  return (
    <div className="flex items-center gap-1">
      {value.map((environment) => (
        <span
          key={environment}
          className={cn(
            "inline-flex h-6 items-center rounded border px-2 font-semibold text-xs leading-none",
            environmentClass[environment],
          )}
        >
          {environment}
        </span>
      ))}
    </div>
  );
}

function StatusCell({ value }: ICellRendererParams<BundleRecord, BundleStatus>) {
  if (!value) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded border px-2 font-semibold text-xs leading-none",
        bundleStatusClass[value],
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
        下载
      </Button>
      <Button variant="ghost" type="button" size="icon" className="size-6 text-slate-500">
        <MoreHorizontal className="size-4" />
      </Button>
    </div>
  );
}
