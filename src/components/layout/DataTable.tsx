import type { ColDef, GridApi, RowClickedEvent } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { type ReactNode, useEffect, useRef } from "react";

import { consoleGridTheme } from "@/components/common/console-grid-theme";
import { EmptyState } from "@/components/common/StateBlock";
import { cn } from "@/lib/utils";

type DataTableProps<TRow> = {
  rows: TRow[];
  columnDefs: ColDef<TRow>[];
  getRowId?: (params: { data: TRow }) => string;
  onRowClicked?: (event: RowClickedEvent<TRow>) => void;
  /** Lets the row-click handler ignore clicks bubbling from action cells. */
  rowActionSelector?: string;
  emptyState?: ReactNode;
  className?: string;
  loading?: boolean;
  /** 详情面板当前打开的那一行，需要同时传 getRowId。 */
  selectedRowId?: string;
};

/**
 * Thin shell around AgGridReact that locks in row height, header height and
 * styling. Kept intentionally small so consumers keep using `columnDefs` /
 * `cellRenderer` directly — this is the visual contract, not a new abstraction.
 *
 * Uses `autoHeight` so the grid sizes itself to its content. Long lists still
 * scroll inside the page's vertical rhythm — this matches the rest of the
 * console, which is short-page-oriented.
 */
export function DataTable<TRow>({
  rows,
  columnDefs,
  getRowId,
  onRowClicked,
  rowActionSelector,
  emptyState,
  className,
  loading,
  selectedRowId,
}: DataTableProps<TRow>) {
  const apiRef = useRef<GridApi<TRow> | null>(null);
  // AG Grid 不会因为 rowClassRules 的闭包变化重新计算行样式，选中项变了要手动重绘。
  // biome-ignore lint/correctness/useExhaustiveDependencies: selectedRowId 只作为重绘时机
  useEffect(() => {
    apiRef.current?.redrawRows();
  }, [selectedRowId]);

  if (rows.length === 0 && !loading) {
    return (
      <div className={cn("rounded-xl bg-card shadow-edge", className)}>
        <div className="grid place-items-center p-10">
          {emptyState ?? (
            <EmptyState title="暂无数据" description="调整筛选条件，或等待数据接入后自动出现。" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-xl bg-card shadow-edge", className)}>
      <AgGridReact<TRow>
        onGridReady={(event) => {
          apiRef.current = event.api;
        }}
        rowData={rows}
        columnDefs={columnDefs}
        theme={consoleGridTheme}
        defaultColDef={{
          cellClass: "flex items-center",
          cellStyle: {
            alignItems: "center",
            display: "flex",
          },
        }}
        domLayout="autoHeight"
        headerHeight={40}
        rowHeight={56}
        getRowId={getRowId}
        suppressCellFocus
        suppressContextMenu
        rowClass={onRowClicked ? "cursor-pointer" : undefined}
        rowClassRules={
          selectedRowId && getRowId
            ? {
                "bg-primary-wash!": (params) =>
                  params.data ? getRowId({ data: params.data }) === selectedRowId : false,
              }
            : undefined
        }
        onRowClicked={(event) => {
          if (!onRowClicked) {
            return;
          }
          if (rowActionSelector) {
            const target = event.event?.target;
            if (target instanceof Element && target.closest(rowActionSelector)) {
              return;
            }
          }
          onRowClicked(event);
        }}
      />
    </div>
  );
}
