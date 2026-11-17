import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useMemo } from "react";

import { consoleGridTheme } from "@/components/common/console-grid-theme";
import { EnvironmentBadge } from "@/components/common/EnvironmentBadge";
import { SectionCard } from "@/components/layout";
import { cn } from "@/lib/utils";

import { applicationEnvironmentStatusClass } from "../constants";
import type { ApplicationEnvironmentRecord } from "../types";

const defaultColDef = {
  cellClass: "flex items-center",
  cellStyle: {
    alignItems: "center",
    display: "flex",
  },
  resizable: false,
  sortable: false,
  suppressHeaderMenuButton: true,
  suppressMovable: true,
};

function EnvironmentCell({
  value,
}: ICellRendererParams<ApplicationEnvironmentRecord, ApplicationEnvironmentRecord["environment"]>) {
  if (!value) {
    return null;
  }

  return <EnvironmentBadge environment={value} />;
}

function EnvironmentStatusCell({
  value,
}: ICellRendererParams<ApplicationEnvironmentRecord, ApplicationEnvironmentRecord["status"]>) {
  if (!value) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-md px-2 font-semibold text-xs leading-none",
        applicationEnvironmentStatusClass[value],
      )}
    >
      {value}
    </span>
  );
}

type ApplicationEnvironmentsGridProps = {
  environments: ApplicationEnvironmentRecord[];
};

export function ApplicationEnvironmentsGrid({ environments }: ApplicationEnvironmentsGridProps) {
  const environmentColumnDefs = useMemo<ColDef<ApplicationEnvironmentRecord>[]>(
    () => [
      {
        cellRenderer: EnvironmentCell,
        field: "environment",
        flex: 0.9,
        headerName: "环境",
        minWidth: 130,
      },
      { field: "traffic", flex: 0.85, headerName: "流量", minWidth: 120 },
      { field: "updatedAt", flex: 0.8, headerName: "更新", minWidth: 120 },
      {
        cellRenderer: EnvironmentStatusCell,
        field: "status",
        flex: 0.8,
        headerName: "状态",
        minWidth: 120,
      },
    ],
    [],
  );

  return (
    <SectionCard title="环境绑定" description="宿主应用已启用环境" padding="none">
      <div className="px-2 pb-2">
        <AgGridReact<ApplicationEnvironmentRecord>
          rowData={environments}
          columnDefs={environmentColumnDefs}
          defaultColDef={defaultColDef}
          domLayout="autoHeight"
          headerHeight={40}
          rowHeight={54}
          theme={consoleGridTheme}
          suppressCellFocus
          suppressContextMenu
          getRowId={({ data }) => data.id}
        />
      </div>
    </SectionCard>
  );
}
