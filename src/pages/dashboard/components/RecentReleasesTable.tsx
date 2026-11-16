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
  recentReleaseStatusClass,
  recentReleaseStatusLabel,
} from "../constants";
import type { EnvironmentTone, ReleaseRecord } from "../types";

type RecentReleasesTableProps = {
  releases: ReleaseRecord[];
  environmentTones: ReadonlyMap<string, EnvironmentTone>;
};

export function RecentReleasesTable({ releases, environmentTones }: RecentReleasesTableProps) {
  const columnDefs = useMemo<ColDef<ReleaseRecord>[]>(
    () => [
      {
        cellRenderer: ({ data }: { data?: ReleaseRecord }) =>
          data ? (
            <div className="min-w-0 leading-tight">
              <div className="truncate font-medium text-foreground">{data.module}</div>
              <div className="truncate text-muted-foreground text-xs">{data.application}</div>
            </div>
          ) : null,
        field: "module",
        flex: 1.4,
        headerName: "模块",
        minWidth: 170,
      },
      {
        field: "id",
        flex: 1,
        headerName: "发布记录",
        minWidth: 140,
      },
      {
        cellRenderer: ({ value }: { value?: ReleaseRecord["environment"] }) =>
          value ? (
            <EnvironmentBadge
              className="h-5 px-2 py-0.5 font-medium"
              environment={value}
              tone={environmentTones.get(value)}
            />
          ) : null,
        field: "environment",
        flex: 0.7,
        headerName: "环境",
        minWidth: 90,
      },
      {
        field: "gray",
        flex: 0.6,
        headerName: "灰度",
        minWidth: 90,
      },
      {
        cellRenderer: ({ value }: { value?: ReleaseRecord["status"] }) =>
          value ? (
            <span
              className={cn(
                "inline-flex rounded px-2 py-0.5 font-medium text-xs",
                recentReleaseStatusClass[value],
              )}
            >
              {recentReleaseStatusLabel[value]}
            </span>
          ) : null,
        field: "status",
        flex: 0.7,
        headerName: "状态",
        minWidth: 100,
      },
      {
        field: "updatedAt",
        flex: 0.6,
        headerName: "更新",
        minWidth: 80,
      },
    ],
    [environmentTones],
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
    <Card className="gap-0 rounded-xl border-border py-0 shadow-xs">
      <CardHeader className="flex min-h-16 flex-row items-center justify-between border-b px-5 py-3">
        <div className="min-w-0">
          <CardTitle className="text-foreground text-sm">最近发布</CardTitle>
          <div className="mt-1 text-muted-foreground text-xs">发布记录与当前生效状态</div>
        </div>
        <Button asChild variant="outline" size="sm" className="h-8 shrink-0 border-border">
          <Link to="/release-records">打开发布</Link>
        </Button>
      </CardHeader>
      <CardContent className="px-0 py-0">
        {releases.length > 0 ? (
          <AgGridReact<ReleaseRecord>
            rowData={releases}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            domLayout="autoHeight"
            headerHeight={44}
            rowHeight={56}
            theme={dashboardSummaryGridTheme}
            suppressCellFocus
            suppressContextMenu
            getRowId={({ data }) => data.id}
          />
        ) : (
          <div className="grid h-52 place-items-center text-muted-foreground text-sm">
            暂无发布记录
          </div>
        )}
      </CardContent>
    </Card>
  );
}
