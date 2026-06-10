import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { ArrowRight, Clock3, type LucideIcon, Server, Waves } from "lucide-react";
import { useMemo } from "react";

import { miCarEnvironmentBadgeClass } from "@/components/common/EnvironmentBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { themeQuartz } from "@/lib/ag-grid";
import { cn } from "@/lib/utils";
import type { MiCarEnvironmentCode } from "@/types/environments";

import type {
  BundleVersionMatrixRow,
  EnvironmentCardTone,
  EnvironmentStatus,
  EnvironmentsSnapshot,
  RuntimeEnvironment,
} from "./types";

type EnvironmentsPageProps = {
  snapshot: EnvironmentsSnapshot;
};

const environmentToneClass: Record<EnvironmentCardTone, string> = {
  amber: "border-t-amber-500",
  blue: "border-t-blue-500",
  emerald: "border-t-emerald-500",
  rose: "border-t-rose-500",
  sky: "border-t-sky-500",
};

const statusClass: Record<EnvironmentStatus, string> = {
  健康: "border-emerald-200 bg-emerald-50 text-emerald-700",
  灰度中: "border-amber-200 bg-amber-50 text-amber-700",
};

type VersionTone = MiCarEnvironmentCode;

const environmentGridTheme = themeQuartz.withParams({
  accentColor: "#1677ff",
  backgroundColor: "#ffffff",
  borderColor: "#e5eaf2",
  borderRadius: 0,
  browserColorScheme: "light",
  columnBorder: false,
  fontFamily:
    '"Roboto Flex Variable", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", system-ui, sans-serif',
  fontSize: 13,
  foregroundColor: "#334155",
  headerBackgroundColor: "#f8fafc",
  headerFontSize: 12,
  headerFontWeight: 600,
  headerTextColor: "#64748b",
  oddRowBackgroundColor: "#ffffff",
  rowBorder: { color: "#e8edf5", style: "solid", width: 1 },
  rowHoverColor: "#f8fbff",
  selectedRowBackgroundColor: "#eff6ff",
  spacing: 7,
  wrapperBorder: false,
  wrapperBorderRadius: 0,
});

export function EnvironmentsPage({ snapshot }: EnvironmentsPageProps) {
  const columnDefs = useMemo<ColDef<BundleVersionMatrixRow>[]>(
    () => [
      {
        cellRenderer: ModuleCell,
        field: "moduleName",
        flex: 1.35,
        headerName: "模块",
        minWidth: 220,
      },
      {
        cellRenderer: VersionCell,
        cellRendererParams: { tone: "dev" },
        field: "dev",
        flex: 1,
        headerName: "DEV",
        minWidth: 140,
      },
      {
        cellRenderer: VersionCell,
        cellRendererParams: { tone: "staging" },
        field: "staging",
        flex: 1,
        headerName: "STAGING",
        minWidth: 140,
      },
      {
        cellRenderer: VersionCell,
        cellRendererParams: { tone: "preview" },
        field: "preview",
        flex: 1,
        headerName: "PREVIEW",
        minWidth: 140,
      },
      {
        cellRenderer: VersionCell,
        cellRendererParams: { tone: "preProduct" },
        field: "preProduct",
        flex: 1,
        headerName: "PREPRODUCT",
        minWidth: 150,
      },
      {
        cellRenderer: VersionCell,
        cellRendererParams: { tone: "product" },
        field: "product",
        flex: 1,
        headerName: "PRODUCT",
        minWidth: 140,
      },
    ],
    [],
  );

  const defaultColDef = useMemo<ColDef<BundleVersionMatrixRow>>(
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
          <h1 className="font-semibold text-2xl text-slate-950 tracking-tight">环境管理</h1>
          <p className="mt-2 text-slate-600 text-sm">
            管理 dev / staging / preview / preProduct / product 五套环境的当前 Bundle Combination
          </p>
        </div>
      </div>

      <div className="space-y-4 px-6 py-5">
        <section className="grid gap-3 xl:grid-cols-5">
          {snapshot.environments.map((environment) => (
            <EnvironmentCard key={environment.id} environment={environment} />
          ))}
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <Card className="gap-0 rounded-none border-0 py-0 shadow-none">
            <CardHeader className="h-12 justify-center border-slate-200 border-b px-4">
              <CardTitle className="font-semibold text-slate-900 text-sm">
                环境对比 · Bundle 版本矩阵
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 py-0">
              <AgGridReact<BundleVersionMatrixRow>
                rowData={snapshot.matrix}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                domLayout="autoHeight"
                headerHeight={46}
                rowHeight={54}
                theme={environmentGridTheme}
                suppressCellFocus
                suppressContextMenu
                getRowId={({ data }) => data.id}
              />
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
}

function EnvironmentCard({ environment }: { environment: RuntimeEnvironment }) {
  return (
    <Card
      className={cn(
        "gap-4 rounded-lg border-t-4 px-4 py-4 shadow-none",
        environmentToneClass[environment.tone],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
            <Server className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 text-sm">{environment.name}</div>
            <div className="font-mono text-slate-500 text-xs">{environment.code}</div>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex h-6 shrink-0 items-center rounded border px-2 font-medium text-xs leading-none",
            statusClass[environment.status],
          )}
        >
          {environment.status}
        </span>
      </div>

      <p className="min-h-10 text-slate-600 text-sm leading-5">{environment.description}</p>

      <div className="space-y-2">
        <div className="font-medium text-slate-500 text-xs">当前 Combination</div>
        <div className="rounded-md bg-slate-100 px-3 py-2 font-mono font-semibold text-slate-700 text-xs">
          {environment.currentCombination}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <InfoMetric icon={Waves} label="流量" value={environment.traffic} />
        <InfoMetric icon={Clock3} label="更新" value={environment.updatedAt} />
      </div>

      <Button
        variant="outline"
        type="button"
        className="h-9 w-full border-slate-200 bg-white font-medium text-blue-600 text-xs hover:bg-blue-50 hover:text-blue-700"
      >
        进入环境详情
        <ArrowRight className="size-3.5" />
      </Button>
    </Card>
  );
}

function InfoMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <div className="flex items-center gap-1 text-slate-500">
        <Icon className="size-3.5 shrink-0" />
        <span>{label}</span>
      </div>
      <div className="truncate font-semibold text-slate-800">{value}</div>
    </div>
  );
}

function ModuleCell({ data }: ICellRendererParams<BundleVersionMatrixRow>) {
  if (!data) {
    return null;
  }

  return (
    <div className="min-w-0 leading-tight">
      <div className="truncate font-semibold text-slate-900">{data.moduleName}</div>
      <div className="text-slate-500 text-xs">{data.moduleType}</div>
    </div>
  );
}

function VersionCell({
  value,
  tone,
}: ICellRendererParams<BundleVersionMatrixRow, string> & {
  tone?: VersionTone;
}) {
  if (!value || !tone) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex rounded border px-2 py-0.5 font-mono font-semibold text-xs",
        miCarEnvironmentBadgeClass[tone],
      )}
    >
      {value}
    </span>
  );
}
