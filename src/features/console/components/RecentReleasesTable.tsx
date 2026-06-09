import { type ColDef, themeQuartz } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { ReleaseRecord } from "../types";

type RecentReleasesTableProps = {
  releases: ReleaseRecord[];
};

const releaseStatusClass: Record<ReleaseRecord["status"], string> = {
  已回滚: "bg-red-100 text-red-700",
  已完成: "bg-emerald-100 text-emerald-700",
  灰度中: "bg-amber-100 text-amber-700",
};

const envClass: Record<ReleaseRecord["environment"], string> = {
  pre: "bg-slate-100 text-slate-600",
  prod: "bg-slate-200 text-slate-700",
  test: "bg-blue-100 text-blue-700",
};

const summaryGridTheme = themeQuartz.withParams({
  accentColor: "#1677ff",
  backgroundColor: "#ffffff",
  borderColor: "#eef2f7",
  borderRadius: 0,
  browserColorScheme: "light",
  columnBorder: false,
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  fontSize: 13,
  foregroundColor: "#334155",
  headerBackgroundColor: "#ffffff",
  headerFontSize: 12,
  headerFontWeight: 500,
  headerTextColor: "#64748b",
  oddRowBackgroundColor: "#ffffff",
  rowBorder: { color: "#eef2f7", style: "solid", width: 1 },
  rowHoverColor: "#f8fafc",
  selectedRowBackgroundColor: "#eff6ff",
  spacing: 6,
  wrapperBorder: false,
  wrapperBorderRadius: 0,
});

export function RecentReleasesTable({ releases }: RecentReleasesTableProps) {
  const columnDefs = useMemo<ColDef<ReleaseRecord>[]>(
    () => [
      {
        field: "id",
        flex: 1.1,
        headerName: "发布单",
        minWidth: 150,
      },
      {
        cellRenderer: ({ value }: { value?: ReleaseRecord["environment"] }) =>
          value ? (
            <span
              className={cn(
                "inline-flex rounded px-2 py-0.5 font-medium text-[12px]",
                envClass[value],
              )}
            >
              {value}
            </span>
          ) : null,
        field: "environment",
        flex: 0.7,
        headerName: "环境",
        minWidth: 90,
      },
      {
        field: "gray",
        flex: 0.7,
        headerName: "灰度",
        minWidth: 90,
      },
      {
        cellRenderer: ({ value }: { value?: ReleaseRecord["status"] }) =>
          value ? (
            <span
              className={cn(
                "inline-flex rounded px-2 py-0.5 font-medium text-[12px]",
                releaseStatusClass[value],
              )}
            >
              {value}
            </span>
          ) : null,
        field: "status",
        flex: 0.8,
        headerName: "状态",
        minWidth: 100,
      },
    ],
    [],
  );

  const defaultColDef = useMemo<ColDef<ReleaseRecord>>(
    () => ({
      resizable: false,
      sortable: false,
      suppressHeaderMenuButton: true,
      suppressMovable: true,
    }),
    [],
  );

  return (
    <Card className="rounded-lg py-0 shadow-none">
      <CardHeader className="flex h-12 flex-row items-center justify-between border-b px-4 py-0">
        <CardTitle className="text-slate-900 text-sm">最近发布</CardTitle>
        <button type="button" className="font-medium text-blue-600 text-xs">
          查看全部 →
        </button>
      </CardHeader>
      <CardContent className="px-0 py-0">
        <AgGridReact<ReleaseRecord>
          rowData={releases}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          domLayout="autoHeight"
          headerHeight={40}
          rowHeight={44}
          theme={summaryGridTheme}
          suppressCellFocus
          suppressContextMenu
          getRowId={({ data }) => data.id}
        />
      </CardContent>
    </Card>
  );
}
