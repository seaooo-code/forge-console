import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import {
  Activity,
  AppWindow,
  ArchiveX,
  CircleDot,
  LoaderCircle,
  MonitorSmartphone,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Smartphone,
  UserRound,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  ConsoleFilterSelect,
  ConsoleSearchInput,
  ConsoleTableFooter,
} from "@/components/common/ConsoleControls";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { themeQuartz } from "@/lib/ag-grid";
import { cn } from "@/lib/utils";
import { useApplicationOptionsStore } from "@/store/use-application-options-store";

import { searchFeishuUsers } from "./api/applications-snapshot";
import type {
  ApplicationOption,
  ApplicationSummary,
  FeishuUserSearchResult,
  HostApplication,
} from "./types";

type ApplicationsPageProps = {
  applications: HostApplication[];
  isFetching: boolean;
  onConfigureApplication: (applicationSlug: string) => void;
  onCreateApplication: () => void;
  onOpenApplication: (applicationSlug: string) => void;
  onRefresh: () => void;
  summary: ApplicationSummary;
};

const appStatusClass: Record<HostApplication["status"], string> = {
  已下线: "border-slate-200 bg-slate-50 text-slate-600",
  维护中: "border-amber-200 bg-amber-50 text-amber-700",
  运行中: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const fallbackStatusFilterOptions: ApplicationOption[] = [
  { label: "运行中", value: "running" },
  { label: "维护中", value: "maintenance" },
  { label: "已下线", value: "offline" },
];

const fallbackPlatformFilterOptions: ApplicationOption[] = [
  { label: "iOS", value: "iOS" },
  { label: "Android", value: "Android" },
  { label: "HarmonyOS", value: "HarmonyOS" },
];

const appGridTheme = themeQuartz.withParams({
  accentColor: "#1677ff",
  backgroundColor: "#ffffff",
  borderColor: "#e5eaf2",
  borderRadius: 0,
  browserColorScheme: "light",
  columnBorder: false,
  fontFamily:
    '"Roboto Flex Variable", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", system-ui, sans-serif',
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

export function ApplicationsPage({
  applications,
  isFetching,
  onConfigureApplication,
  onCreateApplication,
  onOpenApplication,
  onRefresh,
  summary,
}: ApplicationsPageProps) {
  const applicationOptions = useApplicationOptionsStore((state) => state.options);
  const stats = useMemo(
    () => [
      {
        detail: "全部启用",
        icon: AppWindow,
        iconClass: "bg-blue-50 text-blue-600",
        id: "total",
        label: "应用总数",
        value: summary.total,
      },
      {
        detail: percentage(summary.running, summary.total),
        icon: Activity,
        iconClass: "bg-emerald-50 text-emerald-600",
        id: "running",
        label: "运行中",
        value: summary.running,
      },
      {
        detail: percentage(summary.maintenance, summary.total),
        icon: Wrench,
        iconClass: "bg-amber-50 text-amber-600",
        id: "maintenance",
        label: "维护中",
        value: summary.maintenance,
      },
      {
        detail: "归档",
        icon: ArchiveX,
        iconClass: "bg-slate-100 text-slate-500",
        id: "offline",
        label: "已下线",
        value: summary.offline,
      },
    ],
    [summary],
  );
  const platformFilterOptions = useMemo(
    () => withAllOption("全部平台", applicationOptions?.platforms ?? fallbackPlatformFilterOptions),
    [applicationOptions?.platforms],
  );
  const statusFilterOptions = useMemo(
    () =>
      withAllOption(
        "全部状态",
        applicationOptions?.applicationStatuses ?? fallbackStatusFilterOptions,
      ),
    [applicationOptions?.applicationStatuses],
  );

  const columnDefs = useMemo<ColDef<HostApplication>[]>(
    () => [
      {
        cellRenderer: CheckboxCell,
        headerComponent: CheckboxHeader,
        maxWidth: 48,
        minWidth: 48,
        pinned: "left",
        resizable: false,
        sortable: false,
        suppressHeaderMenuButton: true,
        suppressMovable: true,
      },
      {
        cellRenderer: AppNameCell,
        field: "name",
        flex: 1.45,
        headerName: "应用",
        minWidth: 260,
      },
      {
        field: "platform",
        flex: 1.05,
        headerName: "平台",
        minWidth: 210,
      },
      {
        cellRenderer: OwnerCell,
        field: "owner",
        flex: 0.8,
        headerName: "负责人",
        minWidth: 160,
      },
      {
        field: "moduleCount",
        flex: 0.55,
        headerName: "模块数",
        minWidth: 92,
      },
      {
        field: "environmentCount",
        flex: 0.55,
        headerName: "环境数",
        minWidth: 92,
      },
      {
        field: "createdAt",
        flex: 0.85,
        headerName: "创建时间",
        minWidth: 130,
      },
      {
        cellRenderer: StatusCell,
        field: "status",
        flex: 0.7,
        headerName: "状态",
        minWidth: 112,
      },
      {
        cellRenderer: ActionsCell,
        cellRendererParams: { onConfigureApplication, onOpenApplication },
        colId: "actions",
        flex: 0.75,
        headerName: "操作",
        minWidth: 132,
        sortable: false,
      },
    ],
    [onConfigureApplication, onOpenApplication],
  );

  const defaultColDef = useMemo<ColDef<HostApplication>>(
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
    <>
      <div className="border-slate-200 border-b bg-white px-6 py-5">
        <div>
          <h1 className="font-semibold text-2xl text-slate-950 tracking-tight">应用管理</h1>
          <p className="mt-2 text-slate-600 text-sm">管理 RN Bundle 平台接入的所有宿主应用</p>
        </div>
      </div>

      <div className="space-y-4 px-6 py-5">
        <section className="grid gap-3 xl:grid-cols-4">
          {stats.map((item) => {
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

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-slate-200 border-b px-4 py-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <ConsoleFilterSelect
                icon={MonitorSmartphone}
                label="平台"
                value="all"
                options={platformFilterOptions}
              />
              <ConsoleFilterSelect
                icon={CircleDot}
                label="状态"
                value="all"
                options={statusFilterOptions}
              />
              <OwnerSearchFilter />
              <ConsoleSearchInput />
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline" size="icon" aria-label="刷新应用列表" onClick={onRefresh}>
                <RefreshCw className={isFetching ? "size-4 animate-spin" : "size-4"} />
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={onCreateApplication}>
                <Plus className="size-4" />
                新建应用
              </Button>
            </div>
          </div>

          <AgGridReact<HostApplication>
            rowData={applications}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            domLayout="autoHeight"
            headerHeight={44}
            rowHeight={58}
            theme={appGridTheme}
            suppressCellFocus
            suppressContextMenu
            getRowId={({ data }) => data.id}
          />

          <ConsoleTableFooter total={applications.length} />
        </section>
      </div>
    </>
  );
}

function OwnerSearchFilter() {
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<FeishuUserSearchResult | null>(null);
  const [users, setUsers] = useState<FeishuUserSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const keyword = query.trim();
    if (!isOpen || keyword.length < 2) {
      setUsers([]);
      setIsLoading(false);
      return;
    }

    let disposed = false;
    setIsLoading(true);
    const handle = window.setTimeout(() => {
      void searchFeishuUsers(keyword)
        .then((result) => {
          if (!disposed) {
            setUsers(result);
          }
        })
        .catch(() => {
          if (!disposed) {
            setUsers([]);
          }
        })
        .finally(() => {
          if (!disposed) {
            setIsLoading(false);
          }
        });
    }, 280);

    return () => {
      disposed = true;
      window.clearTimeout(handle);
    };
  }, [isOpen, query]);

  const label = selectedUser ? getFeishuUserDisplayName(selectedUser) : "负责人";

  return (
    <fieldset
      className="relative m-0 min-w-0 border-0 p-0"
      onBlur={() => window.setTimeout(() => setIsOpen(false), 150)}
    >
      <Button
        variant="outline"
        type="button"
        className="h-9 min-w-28 justify-start gap-2 border-slate-200 bg-white px-3 font-medium text-slate-600 shadow-sm hover:bg-white hover:text-slate-900"
        aria-label="负责人筛选"
        onClick={() => setIsOpen((current) => !current)}
      >
        <UserRound className="size-3.5 shrink-0 text-slate-400" />
        <span className="max-w-24 truncate">{label}</span>
      </Button>

      {isOpen ? (
        <div className="absolute z-30 mt-1 w-72 rounded-md border border-slate-200 bg-white p-2 shadow-lg">
          <Input
            value={query}
            placeholder="搜索姓名、邮箱或账号"
            className="h-8"
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setIsOpen(true)}
          />
          <div className="mt-2 max-h-72 overflow-auto">
            <Button
              variant="ghost"
              type="button"
              className="h-8 w-full justify-start rounded-sm px-2 font-normal text-slate-600 text-sm"
              onClick={() => {
                setSelectedUser(null);
                setQuery("");
                setUsers([]);
                setIsOpen(false);
              }}
            >
              全部负责人
            </Button>
            {isLoading ? (
              <div className="flex h-9 items-center gap-2 px-2 text-slate-500 text-sm">
                <LoaderCircle className="size-4 animate-spin" />
                搜索中
              </div>
            ) : null}
            {!isLoading && query.trim().length >= 2 && users.length === 0 ? (
              <div className="px-2 py-2 text-slate-500 text-sm">未找到匹配人员</div>
            ) : null}
            {users.map((user) => {
              const name = getFeishuUserDisplayName(user);

              return (
                <Button
                  key={user.id || user.unionId || user.openId}
                  variant="ghost"
                  type="button"
                  className="h-auto w-full justify-start gap-2 rounded-sm px-2 py-2 text-left font-normal"
                  onClick={() => {
                    setSelectedUser(user);
                    setQuery(name);
                    setIsOpen(false);
                  }}
                >
                  <OwnerAvatar name={name} src={user.avatarUrl} />
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-slate-900 text-sm">
                      {name}
                    </span>
                    {user.email ? (
                      <span className="block truncate text-slate-500 text-xs">{user.email}</span>
                    ) : null}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>
      ) : null}
    </fieldset>
  );
}

function getFeishuUserDisplayName(user: FeishuUserSearchResult) {
  return user.name || user.enName || user.email || "";
}

function CheckboxHeader() {
  return <Checkbox aria-label="选择全部应用" />;
}

function CheckboxCell() {
  return (
    <div className="flex h-full items-center">
      <Checkbox aria-label="选择应用" />
    </div>
  );
}

function AppNameCell({ data }: ICellRendererParams<HostApplication>) {
  if (!data) {
    return null;
  }

  return (
    <div className="flex h-full items-center gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-rose-500 text-white shadow-sm">
        <Smartphone className="size-4" />
      </div>
      <div className="min-w-0 leading-tight">
        <div className="truncate font-semibold text-slate-900">{data.name}</div>
        <div className="font-mono text-slate-500 text-xs">{data.slug}</div>
      </div>
    </div>
  );
}

function StatusCell({ value }: ICellRendererParams<HostApplication, HostApplication["status"]>) {
  if (!value) {
    return null;
  }

  return (
    <div className="flex h-full items-center">
      <span
        className={cn(
          "inline-flex h-6 items-center rounded border px-2 font-medium text-xs leading-none",
          appStatusClass[value],
        )}
      >
        {value}
      </span>
    </div>
  );
}

function OwnerCell({ data }: ICellRendererParams<HostApplication>) {
  if (!data) {
    return null;
  }

  const owner = data.owner || "-";

  return (
    <div className="flex h-full min-w-0 items-center gap-2">
      <OwnerAvatar name={owner} src={data.ownerAvatarUrl} />
      <div className="min-w-0">
        <div className="truncate font-medium text-slate-800 text-sm">{owner}</div>
        {data.ownerEmail ? (
          <div className="truncate text-slate-500 text-xs">{data.ownerEmail}</div>
        ) : null}
      </div>
    </div>
  );
}

function OwnerAvatar({ name, src }: { name: string; src: string }) {
  if (src) {
    return <img src={src} alt={name} className="size-7 shrink-0 rounded-full object-cover" />;
  }

  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-rose-500 font-semibold text-white text-xs">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function ActionsCell({
  data,
  onConfigureApplication,
  onOpenApplication,
}: ICellRendererParams<HostApplication> & {
  onConfigureApplication?: (applicationSlug: string) => void;
  onOpenApplication?: (applicationSlug: string) => void;
}) {
  return (
    <div className="flex h-full items-center gap-2 whitespace-nowrap font-medium text-blue-600 text-xs">
      <Button
        variant="link"
        type="button"
        className="h-auto p-0 text-blue-600 text-xs hover:text-blue-700"
        onClick={() => {
          if (data) {
            onOpenApplication?.(data.slug);
          }
        }}
      >
        详情
      </Button>
      <Button
        variant="link"
        type="button"
        className="h-auto p-0 text-blue-600 text-xs hover:text-blue-700"
        onClick={() => {
          if (data) {
            onConfigureApplication?.(data.slug);
          }
        }}
      >
        配置
      </Button>
      <Button variant="ghost" type="button" size="icon" className="size-6 text-slate-500">
        <MoreHorizontal className="size-4" />
      </Button>
    </div>
  );
}

function percentage(value: number, total: number) {
  if (total === 0) {
    return "0%";
  }

  return `${Math.round((value / total) * 100)}%`;
}

function withAllOption(label: string, options: ApplicationOption[]) {
  return [{ label, value: "all" }, ...options.filter((option) => option.value !== "all")];
}
