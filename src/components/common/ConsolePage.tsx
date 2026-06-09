import { type ColDef, themeQuartz } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import type { LucideIcon } from "lucide-react";
import { type ReactNode, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type SummaryCardItem = {
  detail: string;
  icon: LucideIcon;
  iconClass: string;
  id: string;
  label: string;
  value: string;
};

type PageHeaderProps = {
  actions?: ReactNode;
  description: string;
  title: string;
};

type SummaryCardsProps = {
  items: SummaryCardItem[];
};

type GridPanelProps<TData extends object> = {
  columnDefs: ColDef<TData>[];
  getRowId: (data: TData) => string;
  headerActions?: ReactNode;
  headerHeight?: number;
  rowData: TData[];
  rowHeight?: number;
  title: string;
};

type BadgeTone = "amber" | "blue" | "emerald" | "rose" | "slate" | "violet";

const badgeToneClass: Record<BadgeTone, string> = {
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rose: "border-rose-200 bg-rose-50 text-rose-700",
  slate: "border-slate-200 bg-slate-50 text-slate-600",
  violet: "border-violet-200 bg-violet-50 text-violet-700",
};

export const consoleGridTheme = themeQuartz.withParams({
  accentColor: "#1677ff",
  backgroundColor: "#ffffff",
  borderColor: "#e5eaf2",
  borderRadius: 0,
  browserColorScheme: "light",
  columnBorder: false,
  fontFamily:
    '"Roboto Flex Variable", "Noto Sans SC Variable", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
  fontSize: 13,
  foregroundColor: "#334155",
  headerBackgroundColor: "#f8fafc",
  headerFontSize: 12,
  headerFontWeight: 600,
  headerTextColor: "#64748b",
  oddRowBackgroundColor: "#ffffff",
  rowBorder: { color: "#e8edf5", style: "solid", width: 1 },
  rowHoverColor: "#f8fbff",
  selectedRowBackgroundColor: "#eff6ff",
  spacing: 7,
  wrapperBorder: false,
  wrapperBorderRadius: 0,
});

export function PageHeader({ actions, description, title }: PageHeaderProps) {
  return (
    <div className="border-slate-200 border-b bg-white px-6 py-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-semibold text-2xl text-slate-950 tracking-tight">{title}</h1>
          <p className="mt-2 text-slate-600 text-sm">{description}</p>
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

export function SummaryCards({ items }: SummaryCardsProps) {
  return (
    <section className="grid gap-3 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Card key={item.id} className="rounded-lg px-5 py-4 shadow-none">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="font-medium text-slate-500 text-sm">{item.label}</div>
                <div className="font-semibold text-3xl text-slate-950 leading-none">
                  {item.value}
                </div>
                <div className="font-medium text-slate-400 text-xs">{item.detail}</div>
              </div>
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-lg",
                  item.iconClass,
                )}
              >
                <Icon className="size-5" />
              </div>
            </div>
          </Card>
        );
      })}
    </section>
  );
}

export function GridPanel<TData extends object>({
  columnDefs,
  getRowId,
  headerActions,
  headerHeight = 46,
  rowData,
  rowHeight = 54,
  title,
}: GridPanelProps<TData>) {
  const defaultColDef = useMemo<ColDef<TData>>(
    () => ({
      cellClass: "flex items-center",
      cellStyle: {
        alignItems: "center",
        display: "flex",
      },
      resizable: false,
      sortable: false,
      suppressHeaderMenuButton: true,
      suppressMovable: true,
    }),
    [],
  );

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <Card className="gap-0 rounded-none border-0 py-0 shadow-none">
        <CardHeader className="h-12 justify-center border-slate-200 border-b px-4">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="font-semibold text-slate-900 text-sm">{title}</CardTitle>
            {headerActions}
          </div>
        </CardHeader>
        <CardContent className="px-0 py-0">
          <AgGridReact<TData>
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            domLayout="autoHeight"
            headerHeight={headerHeight}
            rowHeight={rowHeight}
            theme={consoleGridTheme}
            suppressCellFocus
            suppressContextMenu
            getRowId={({ data }) => getRowId(data)}
          />
        </CardContent>
      </Card>
    </section>
  );
}

export function ToneBadge({ children, tone = "slate" }: { children: ReactNode; tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded border px-2 font-medium text-xs leading-none",
        badgeToneClass[tone],
      )}
    >
      {children}
    </span>
  );
}

export function MonoBadge({ children, tone = "blue" }: { children: ReactNode; tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex rounded border px-2 py-0.5 font-mono font-semibold text-xs",
        badgeToneClass[tone],
      )}
    >
      {children}
    </span>
  );
}

export function LinkAction({ children }: { children: ReactNode }) {
  return (
    <Button variant="link" type="button" className="h-auto p-0 text-blue-600 text-xs">
      {children}
    </Button>
  );
}
