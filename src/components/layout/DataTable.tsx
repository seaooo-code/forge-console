import type { ColDef, RowClickedEvent } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import type { ReactNode } from "react";

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
}: DataTableProps<TRow>) {
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
