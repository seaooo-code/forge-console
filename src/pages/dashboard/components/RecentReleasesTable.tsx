import type { ColDef } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useMemo } from "react";

import { EnvironmentBadge } from "@/components/common/EnvironmentBadge";
import { MockCard as Card } from "@/components/common/MockSurface";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { dashboardSummaryGridTheme, recentReleaseStatusClass } from "../constants";
import type { ReleaseRecord } from "../types";

type RecentReleasesTableProps = {
  releases: ReleaseRecord[];
};

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
            <EnvironmentBadge className="h-5 px-2 py-0.5 font-medium" environment={value} />
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
                "inline-flex rounded px-2 py-0.5 font-medium text-xs",
                recentReleaseStatusClass[value],
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
        <Button
          variant="link"
          type="button"
          className="h-auto p-0 font-medium text-blue-600 text-xs"
        >
          查看全部 →
        </Button>
      </CardHeader>
      <CardContent className="px-0 py-0">
        <AgGridReact<ReleaseRecord>
          rowData={releases}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          domLayout="autoHeight"
          headerHeight={40}
          rowHeight={44}
          theme={dashboardSummaryGridTheme}
          suppressCellFocus
          suppressContextMenu
          getRowId={({ data }) => data.id}
        />
      </CardContent>
    </Card>
  );
}
