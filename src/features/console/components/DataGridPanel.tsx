import { type ColDef, type RowClickedEvent, themeQuartz } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useMemo } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { useConsoleStore } from "../model/use-console-store";
import type { PipelineRow } from "../types";
import { StatusBadge } from "./StatusBadge";

type DataGridPanelProps = {
  rows: PipelineRow[];
};

const gridTheme = themeQuartz.withParams({
  accentColor: "#2563eb",
  borderColor: "#d8dee9",
  borderRadius: 6,
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  headerFontWeight: 600,
  wrapperBorderRadius: 6,
});

export function DataGridPanel({ rows }: DataGridPanelProps) {
  const density = useConsoleStore((state) => state.density);
  const selectedPipelineId = useConsoleStore((state) => state.selectedPipelineId);
  const setSelectedPipelineId = useConsoleStore((state) => state.setSelectedPipelineId);

  const columnDefs = useMemo<ColDef<PipelineRow>[]>(
    () => [
      {
        field: "service",
        headerName: "Service",
        minWidth: 180,
        flex: 1.3,
      },
      {
        field: "status",
        headerName: "Status",
        width: 118,
        cellRenderer: ({ value }: { value: PipelineRow["status"] }) => (
          <StatusBadge status={value} />
        ),
      },
      {
        field: "owner",
        headerName: "Owner",
        minWidth: 130,
        flex: 1,
      },
      {
        field: "environment",
        headerName: "Env",
        width: 96,
      },
      {
        field: "deploys",
        headerName: "Deploys",
        width: 112,
        type: "numericColumn",
      },
      {
        field: "failureRate",
        headerName: "Fail %",
        width: 112,
        type: "numericColumn",
        valueFormatter: ({ value }) => `${Number(value).toFixed(1)}%`,
      },
      {
        field: "latency",
        headerName: "P95",
        width: 104,
        type: "numericColumn",
        valueFormatter: ({ value }) => `${Number(value)} ms`,
      },
      {
        field: "cost",
        headerName: "Cost",
        width: 116,
        type: "numericColumn",
        valueFormatter: ({ value }) =>
          new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
          }).format(Number(value)),
      },
      {
        field: "region",
        headerName: "Region",
        minWidth: 132,
        flex: 1,
      },
      {
        field: "lastRun",
        headerName: "Last run",
        width: 112,
      },
    ],
    [],
  );

  const defaultColDef = useMemo<ColDef<PipelineRow>>(
    () => ({
      filter: true,
      resizable: true,
      sortable: true,
    }),
    [],
  );

  const rowHeight = density === "compact" ? 38 : 48;
  const headerHeight = density === "compact" ? 42 : 50;

  return (
    <Card className="min-h-[460px]">
      <CardHeader className="grid-cols-[1fr_auto] items-start">
        <div>
          <CardTitle>Pipelines</CardTitle>
          <CardDescription>{rows.length} services under active automation</CardDescription>
        </div>
        <div className="rounded-md border px-2.5 py-1 text-xs text-muted-foreground">
          {selectedPipelineId ?? "none"}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[380px] min-w-0">
          <AgGridReact<PipelineRow>
            rowData={rows}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            rowHeight={rowHeight}
            headerHeight={headerHeight}
            theme={gridTheme}
            animateRows
            getRowId={({ data }) => data.id}
            onRowClicked={(event: RowClickedEvent<PipelineRow>) => {
              if (event.data) {
                setSelectedPipelineId(event.data.id);
              }
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
