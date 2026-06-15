import { useQuery } from "@tanstack/react-query";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import {
  Box,
  Boxes,
  CheckCircle2,
  Download,
  GitBranch,
  ListFilter,
  LockKeyhole,
  MoreHorizontal,
  Plus,
  RefreshCw,
  TimerReset,
  UserRound,
} from "lucide-react";
import { useMemo } from "react";

import {
  ConsoleFilterSelect,
  ConsoleSearchInput,
  ConsoleTableFooter,
} from "@/components/common/ConsoleControls";
import { consoleGridTheme } from "@/components/common/console-grid-theme";
import { EnvironmentBadge } from "@/components/common/EnvironmentBadge";
import { MockSurface } from "@/components/common/MockSurface";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { miCarEnvironmentFilterOptions } from "@/types/environments";

import { fetchCombinationsSnapshot } from "./api/combinations-snapshot";
import type {
  BundleCompositionKind,
  BundleCompositionRecord,
  CombinationEnvironment,
  CombinationRecord,
  CombinationStatus,
} from "./types";

const statusClass: Record<CombinationStatus, string> = {
  历史版本: "border-slate-200 bg-slate-50 text-slate-600",
  已回滚: "border-rose-200 bg-rose-50 text-rose-600",
  滚动更新: "border-blue-200 bg-blue-50 text-blue-700",
  运行中: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const bundleKindClass: Record<BundleCompositionKind, string> = {
  Common: "border-amber-200 bg-amber-50 text-amber-700",
  Feature: "border-blue-200 bg-blue-50 text-blue-700",
};

export function CombinationsPage() {
  const { data: snapshot } = useQuery({
    queryFn: fetchCombinationsSnapshot,
    queryKey: ["combinations-snapshot"],
  });
  const compositionColumnDefs = useMemo<ColDef<BundleCompositionRecord>[]>(
    () => [
      {
        cellRenderer: CompositionModuleCell,
        field: "module",
        flex: 1.2,
        headerName: "模块",
        minWidth: 150,
      },
      {
        cellRenderer: BundleKindCell,
        field: "kind",
        flex: 0.75,
        headerName: "类型",
        minWidth: 96,
      },
      {
        cellRenderer: VersionCell,
        field: "version",
        flex: 0.8,
        headerName: "版本",
        minWidth: 96,
      },
      {
        cellRenderer: SizeCell,
        field: "sizeKb",
        flex: 0.7,
        headerName: "体积",
        minWidth: 86,
      },
    ],
    [],
  );

  const combinationColumnDefs = useMemo<ColDef<CombinationRecord>[]>(
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
        cellRenderer: CombinationNameCell,
        field: "name",
        flex: 1.35,
        headerName: "COMBINATION 名称",
        minWidth: 230,
      },
      {
        cellRenderer: EnvironmentCell,
        field: "environment",
        flex: 0.5,
        headerName: "环境",
        minWidth: 82,
      },
      {
        field: "bundleCount",
        flex: 0.6,
        headerName: "BUNDLE 数",
        minWidth: 94,
      },
      {
        field: "creator",
        flex: 0.75,
        headerName: "创建人",
        minWidth: 110,
      },
      {
        field: "createdAt",
        flex: 0.95,
        headerName: "创建时间",
        minWidth: 138,
      },
      {
        cellRenderer: StatusCell,
        field: "status",
        flex: 0.68,
        headerName: "状态",
        minWidth: 104,
      },
      {
        cellRenderer: ActionsCell,
        colId: "actions",
        flex: 0.78,
        headerName: "操作",
        minWidth: 118,
        sortable: false,
      },
    ],
    [],
  );

  const compositionDefaultColDef = useMemo<ColDef<BundleCompositionRecord>>(
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

  const combinationDefaultColDef = useMemo<ColDef<CombinationRecord>>(
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

  const featureBundles = snapshot.current.bundles.filter((bundle) => bundle.kind === "Feature");
  const commonBundle = snapshot.current.bundles.find((bundle) => bundle.kind === "Common");

  return (
    <>
      <div className="border-slate-200 border-b bg-white px-6 py-5">
        <div>
          <h1 className="font-semibold text-2xl text-slate-950 tracking-tight">Bundle 组合</h1>
          <p className="mt-2 text-slate-600 text-sm">
            一个 Combination 表示某个环境实际运行的一组 Bundle
          </p>
        </div>
      </div>

      <div className="space-y-4 px-6 py-5">
        <MockSurface
          as="section"
          className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
        >
          <div className="flex flex-col gap-2 border-slate-200 border-b px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate font-semibold text-slate-900 text-sm">
                {snapshot.current.name} · {snapshot.current.environmentLabel}
              </span>
              <StatusBadge status={snapshot.current.status} />
            </div>
            <div className="flex shrink-0 items-center gap-2 font-medium text-slate-500 text-xs">
              <UserRound className="size-3.5" />
              <span>
                由 {snapshot.current.creator} 创建于 {snapshot.current.createdAt}
              </span>
            </div>
          </div>

          <div className="grid gap-4 p-4 xl:grid-cols-2">
            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-2 font-semibold text-slate-700 text-sm">
                <Boxes className="size-4 text-slate-400" />
                Bundle 组成 ({snapshot.current.bundleCount})
              </div>
              <div className="overflow-hidden rounded-md border border-slate-200">
                <AgGridReact<BundleCompositionRecord>
                  rowData={snapshot.current.bundles}
                  columnDefs={compositionColumnDefs}
                  defaultColDef={compositionDefaultColDef}
                  domLayout="autoHeight"
                  headerHeight={34}
                  rowHeight={38}
                  theme={consoleGridTheme}
                  suppressCellFocus
                  suppressContextMenu
                  getRowId={({ data }) => data.id}
                />
              </div>
            </div>

            <div className="min-w-0">
              <div className="mb-3 font-semibold text-slate-700 text-sm">依赖关系</div>
              <div className="rounded-md border border-slate-200 p-5">
                <div className="mx-auto flex w-fit flex-col items-center">
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-6 py-3 text-center shadow-sm">
                    <div className="font-mono font-semibold text-amber-700 text-sm">
                      {commonBundle ? `${commonBundle.module}@${commonBundle.version}` : "common"}
                    </div>
                  </div>
                  <div className="mt-2 font-medium text-slate-500 text-xs">
                    Common Bundle · 所有 Feature 依赖
                  </div>
                </div>

                <div className="my-4 border-slate-200 border-t border-dashed" />

                <div className="grid gap-3 md:grid-cols-4">
                  {featureBundles.map((bundle) => (
                    <div
                      key={bundle.id}
                      className="rounded-md border border-slate-200 bg-white px-3 py-2 text-center"
                    >
                      <div className="truncate font-semibold text-slate-800 text-xs">
                        {bundle.module}
                      </div>
                      <div className="font-mono text-slate-500 text-xs">{bundle.version}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 font-semibold text-emerald-700 text-xs">
                  <CheckCircle2 className="size-4 shrink-0" />
                  依赖检查通过 · 总体积 3.9 MB · 健康度 100%
                </div>
              </div>
            </div>
          </div>
        </MockSurface>

        <MockSurface
          as="section"
          className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-slate-200 border-b px-4 py-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <ConsoleFilterSelect
                icon={Box}
                label="环境"
                value="all"
                options={[{ label: "全部环境", value: "all" }, ...miCarEnvironmentFilterOptions]}
              />
              <ConsoleFilterSelect
                icon={ListFilter}
                label="状态"
                value="all"
                options={[
                  { label: "全部状态", value: "all" },
                  { label: "运行中", value: "running" },
                  { label: "滚动更新", value: "rolling" },
                  { label: "历史版本", value: "history" },
                  { label: "已回滚", value: "rollback" },
                ]}
              />
              <ConsoleFilterSelect
                icon={UserRound}
                label="创建人"
                value="all"
                options={[
                  { label: "全部创建人", value: "all" },
                  { label: "release.bot", value: "release.bot" },
                  { label: "li.ming", value: "li.ming" },
                  { label: "qa.zhao", value: "qa.zhao" },
                ]}
              />
              <ConsoleFilterSelect
                icon={TimerReset}
                label="时间范围"
                value="all"
                options={[
                  { label: "全部时间", value: "all" },
                  { label: "今天", value: "today" },
                  { label: "近 7 天", value: "7d" },
                ]}
              />
              <ConsoleSearchInput />
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline" size="icon" aria-label="刷新 Bundle 组合">
                <RefreshCw className="size-4" />
              </Button>
              <Button variant="outline" size="icon" aria-label="下载 Bundle 组合">
                <Download className="size-4" />
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="size-4" />
                新建组合
              </Button>
            </div>
          </div>

          <AgGridReact<CombinationRecord>
            rowData={snapshot.combinations}
            columnDefs={combinationColumnDefs}
            defaultColDef={combinationDefaultColDef}
            domLayout="autoHeight"
            headerHeight={44}
            rowHeight={58}
            theme={consoleGridTheme}
            suppressCellFocus
            suppressContextMenu
            getRowId={({ data }) => data.id}
          />

          <ConsoleTableFooter total={snapshot.combinations.length} />
        </MockSurface>
      </div>
    </>
  );
}

function CheckboxHeader() {
  return <Checkbox aria-label="选择全部 Bundle 组合" />;
}

function CheckboxCell() {
  return (
    <div className="flex h-full items-center">
      <Checkbox aria-label="选择 Bundle 组合" />
    </div>
  );
}

function CompositionModuleCell({ data }: ICellRendererParams<BundleCompositionRecord>) {
  if (!data) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-semibold text-slate-900 text-sm">{data.module}</span>
      {data.required ? (
        <span className="inline-flex h-5 items-center rounded border border-amber-200 bg-amber-50 px-1.5 font-semibold text-amber-700 text-xs">
          必选
        </span>
      ) : null}
    </div>
  );
}

function BundleKindCell({
  value,
}: ICellRendererParams<BundleCompositionRecord, BundleCompositionKind>) {
  if (!value) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded border px-2 font-semibold text-xs leading-none",
        bundleKindClass[value],
      )}
    >
      {value}
    </span>
  );
}

function VersionCell({ value }: ICellRendererParams<BundleCompositionRecord, string>) {
  return value ? (
    <span className="inline-flex h-6 items-center rounded border border-blue-200 bg-blue-50 px-2 font-mono font-semibold text-blue-700 text-xs">
      {value}
    </span>
  ) : null;
}

function SizeCell({ value }: ICellRendererParams<BundleCompositionRecord, number>) {
  return typeof value === "number" ? (
    <span className="font-semibold text-slate-700 text-xs">{value} KB</span>
  ) : null;
}

function CombinationNameCell({ data }: ICellRendererParams<CombinationRecord>) {
  if (!data) {
    return null;
  }

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex size-5 shrink-0 items-center justify-center rounded text-blue-600">
        <GitBranch className="size-4" />
      </span>
      <div className="min-w-0 leading-tight">
        <div className="truncate font-mono font-semibold text-slate-900 text-sm">{data.name}</div>
        <div className="mt-1 flex items-center gap-1.5 text-slate-500 text-xs">
          {data.locked ? <LockKeyhole className="size-3" /> : null}
          <span>{data.locked ? "已锁定" : "可编辑"}</span>
        </div>
      </div>
    </div>
  );
}

function EnvironmentCell({
  value,
}: ICellRendererParams<CombinationRecord, CombinationEnvironment>) {
  if (!value) {
    return null;
  }

  return <EnvironmentBadge environment={value} />;
}

function StatusCell({ value }: ICellRendererParams<CombinationRecord, CombinationStatus>) {
  return value ? <StatusBadge status={value} /> : null;
}

function StatusBadge({ status }: { status: CombinationStatus }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded border px-2 font-semibold text-xs leading-none",
        statusClass[status],
      )}
    >
      {status}
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
        克隆
      </Button>
      <Button
        variant="link"
        type="button"
        className="h-auto p-0 text-blue-600 text-xs hover:text-blue-700"
      >
        发布
      </Button>
      <Button variant="ghost" type="button" size="icon" className="size-6 text-slate-500">
        <MoreHorizontal className="size-4" />
      </Button>
    </div>
  );
}
