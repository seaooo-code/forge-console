import type { ColDef } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useMemo } from "react";

import { MockCard as Card } from "@/components/common/MockSurface";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { dashboardSummaryGridTheme, recentTaskStatusClass } from "../constants";
import type { DevTask } from "../types";

type RecentTasksTableProps = {
  tasks: DevTask[];
};

export function RecentTasksTable({ tasks }: RecentTasksTableProps) {
  const columnDefs = useMemo<ColDef<DevTask>[]>(
    () => [
      {
        cellRenderer: ({ data }: { data?: DevTask }) =>
          data ? (
            <span className="font-medium text-slate-800">
              <span className="text-slate-500">{data.id}</span> {data.title}
            </span>
          ) : null,
        field: "title",
        flex: 1.6,
        headerName: "任务",
        minWidth: 220,
      },
      {
        field: "developer",
        flex: 0.8,
        headerName: "开发",
        minWidth: 110,
      },
      {
        field: "moduleCount",
        flex: 0.5,
        headerName: "模块",
        minWidth: 80,
      },
      {
        cellRenderer: ({ value }: { value?: DevTask["status"] }) =>
          value ? (
            <span
              className={cn(
                "inline-flex rounded px-2 py-0.5 font-medium text-xs",
                recentTaskStatusClass[value],
              )}
            >
              {value}
            </span>
          ) : null,
        field: "status",
        flex: 0.6,
        headerName: "状态",
        minWidth: 90,
      },
    ],
    [],
  );

  const defaultColDef = useMemo<ColDef<DevTask>>(
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
        <CardTitle className="text-slate-900 text-sm">最近开发任务</CardTitle>
        <Button
          variant="link"
          type="button"
          className="h-auto p-0 font-medium text-blue-600 text-xs"
        >
          查看全部 →
        </Button>
      </CardHeader>
      <CardContent className="px-0 py-0">
        <AgGridReact<DevTask>
          rowData={tasks}
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
