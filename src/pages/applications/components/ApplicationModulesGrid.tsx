import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { Boxes } from "lucide-react";
import { useMemo } from "react";

import { consoleGridTheme } from "@/components/common/console-grid-theme";
import { SectionCard } from "@/components/layout";
import { cn } from "@/lib/utils";

import { applicationModuleKindClass } from "../constants";
import type { ApplicationModuleRecord } from "../types";

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

function ModuleNameCell({ data }: ICellRendererParams<ApplicationModuleRecord>) {
  if (!data) {
    return null;
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-info/10 text-info">
        <Boxes className="size-3.5" />
      </div>
      <div className="min-w-0 font-semibold text-foreground">{data.name}</div>
    </div>
  );
}

function ModuleKindCell({
  value,
}: ICellRendererParams<ApplicationModuleRecord, ApplicationModuleRecord["kind"]>) {
  if (!value) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-md px-2 font-semibold text-xs leading-none",
        applicationModuleKindClass[value],
      )}
    >
      {value}
    </span>
  );
}

function ModuleCommonCell({ data }: ICellRendererParams<ApplicationModuleRecord>) {
  if (!data || data.kind === "Common") {
    return <span className="text-muted-foreground text-xs">-</span>;
  }

  return (
    <span className="truncate text-foreground text-sm">
      {data.commonModuleName || data.commonModuleId || "-"}
    </span>
  );
}

type ApplicationModulesGridProps = {
  modules: ApplicationModuleRecord[];
};

export function ApplicationModulesGrid({ modules }: ApplicationModulesGridProps) {
  const moduleColumnDefs = useMemo<ColDef<ApplicationModuleRecord>[]>(
    () => [
      {
        cellRenderer: ModuleNameCell,
        field: "name",
        flex: 1.1,
        headerName: "模块",
        minWidth: 180,
      },
      {
        cellRenderer: ModuleKindCell,
        field: "kind",
        flex: 0.7,
        headerName: "类型",
        minWidth: 110,
      },
      {
        cellRenderer: ModuleCommonCell,
        field: "commonModuleName",
        flex: 0.9,
        headerName: "通用模块",
        minWidth: 130,
      },
      { field: "repository", flex: 1.6, headerName: "仓库", minWidth: 240 },
      { field: "owner", flex: 0.8, headerName: "负责人", minWidth: 120 },
    ],
    [],
  );

  return (
    <SectionCard title="接入模块" description="当前应用关联的 RN Bundle 模块" padding="none">
      <div className="px-2 pb-2">
        <AgGridReact<ApplicationModuleRecord>
          rowData={modules}
          columnDefs={moduleColumnDefs}
          defaultColDef={defaultColDef}
          domLayout="autoHeight"
          headerHeight={40}
          rowHeight={58}
          theme={consoleGridTheme}
          suppressCellFocus
          suppressContextMenu
          getRowId={({ data }) => data.id}
        />
      </div>
    </SectionCard>
  );
}
