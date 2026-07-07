import type { ColDef } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useMemo } from "react";
import { Link } from "react-router";

import { EnvironmentBadge } from "@/components/common/EnvironmentBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import {
  dashboardSummaryGridTheme,
  recentBuildStatusClass,
  recentBuildStatusLabel,
} from "../constants";
import type { RecentBuildRecord } from "../types";

type RecentBuildsTableProps = {
  builds: RecentBuildRecord[];
};

export function RecentBuildsTable({ builds }: RecentBuildsTableProps) {
  const columnDefs = useMemo<ColDef<RecentBuildRecord>[]>(
    () => [
      {
        cellRenderer: ({ data }: { data?: RecentBuildRecord }) =>
          data ? (
            <div className="min-w-0 leading-tight">
              <div className="truncate font-medium text-foreground">{data.module}</div>
              <div className="truncate text-muted-foreground text-xs">{data.application}</div>
            </div>
          ) : null,
        field: "module",
        flex: 1.5,
        headerName: "模块",
        minWidth: 180,
      },
      {
        field: "id",
        flex: 1.1,
        headerName: "构建",
        minWidth: 150,
      },
      {
        cellRenderer: ({ value }: { value?: RecentBuildRecord["environment"] }) =>
          value ? (
            <EnvironmentBadge className="h-5 px-2 py-0.5 font-medium" environment={value} />
          ) : null,
        field: "environment",
        flex: 0.8,
        headerName: "环境",
        minWidth: 100,
      },
      {
        cellRenderer: ({ value }: { value?: RecentBuildRecord["status"] }) =>
          value ? (
            <span
              className={cn(
                "inline-flex rounded px-2 py-0.5 font-medium text-xs",
                recentBuildStatusClass[value],
              )}
            >
              {recentBuildStatusLabel[value]}
            </span>
          ) : null,
        field: "status",
        flex: 0.7,
        headerName: "状态",
        minWidth: 90,
      },
      {
        field: "duration",
        flex: 0.7,
        headerName: "耗时",
        minWidth: 90,
      },
      {
        field: "operator",
        flex: 0.8,
        headerName: "发起人",
        minWidth: 100,
      },
    ],
    [],
  );

  const defaultColDef = useMemo<ColDef<RecentBuildRecord>>(
    () => ({
      resizable: false,
      sortable: false,
      suppressHeaderMenuButton: true,
      suppressMovable: true,
    }),
    [],
  );

  return (
    <Card className="gap-0 rounded-xl border-border py-0 shadow-xs">
      <CardHeader className="flex h-12 flex-row items-center justify-between border-b px-4 py-0">
        <div className="min-w-0">
          <CardTitle className="text-foreground text-sm">最近构建</CardTitle>
          <div className="mt-1 text-muted-foreground text-xs">最新构建记录和执行状态</div>
        </div>
        <Button asChild variant="outline" size="sm" className="h-8 shrink-0 border-border">
          <Link to="/builds">打开构建</Link>
        </Button>
      </CardHeader>
      <CardContent className="px-0 py-0">
        {builds.length > 0 ? (
          <AgGridReact<RecentBuildRecord>
            rowData={builds}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            domLayout="autoHeight"
            headerHeight={40}
            rowHeight={48}
            theme={dashboardSummaryGridTheme}
            suppressCellFocus
            suppressContextMenu
            getRowId={({ data }) => data.id}
          />
        ) : (
          <div className="grid h-52 place-items-center text-muted-foreground text-sm">
            暂无构建记录
          </div>
        )}
      </CardContent>
    </Card>
  );
}
