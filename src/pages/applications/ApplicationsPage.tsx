import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import {
  Activity,
  AppWindow,
  ArchiveX,
  CircleDot,
  LoaderCircle,
  type LucideIcon,
  MonitorSmartphone,
  Plus,
  RefreshCw,
  Smartphone,
  Trash2,
  UserRound,
  Wrench,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { searchFeishuUsers } from "@/api/feishu-user-search";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  ConsoleFilterSelect,
  ConsoleSearchInput,
  ConsoleTableFooter,
} from "@/components/common/ConsoleControls";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { FeishuUserSearchResult } from "@/types/feishu";

import { applicationsSnapshotQueryKey } from "./api/application-list-filters";
import { deleteApplication, fetchApplicationsSnapshot } from "./api/applications-snapshot";
import {
  applicationStatusClass,
  applicationsGridTheme,
  emptyApplicationListFilters,
} from "./constants";
import { useApplicationOptions } from "./hooks";
import type {
  ApplicationListFilters,
  ApplicationOption,
  ApplicationStatusCode,
  HostApplication,
} from "./types";

type ApplicationsPageProps = {
  onConfigureApplication: (applicationSlug: string) => void;
  onCreateApplication: () => void;
  onOpenApplication: (applicationSlug: string) => void;
};

export function ApplicationsPage({
  onConfigureApplication,
  onCreateApplication,
  onOpenApplication,
}: ApplicationsPageProps) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ApplicationListFilters>(emptyApplicationListFilters);
  const {
    data: snapshot,
    isFetching,
    refetch,
  } = useQuery({
    queryFn: () => fetchApplicationsSnapshot(filters),
    queryKey: applicationsSnapshotQueryKey(filters),
  });
  const { data: applicationOptions } = useApplicationOptions();
  const [keywordInput, setKeywordInput] = useState(filters.keyword);
  const [deleteTarget, setDeleteTarget] = useState<HostApplication | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const handleRequestDeleteApplication = useCallback((application: HostApplication) => {
    setDeleteTarget(application);
    setDeleteError("");
  }, []);
  const updateFilters = useCallback(
    (patch: Partial<ApplicationListFilters>) => {
      setFilters({
        ...filters,
        ...patch,
      });
    },
    [filters],
  );

  useEffect(() => {
    setKeywordInput(filters.keyword);
  }, [filters.keyword]);

  useEffect(() => {
    const nextKeyword = keywordInput.trim();
    if (nextKeyword === filters.keyword) {
      return;
    }

    const handle = window.setTimeout(() => {
      updateFilters({ keyword: nextKeyword });
    }, 360);

    return () => window.clearTimeout(handle);
  }, [filters.keyword, keywordInput, updateFilters]);

  const stats = useMemo(() => {
    if (!snapshot) {
      return [];
    }

    const { summary } = snapshot;

    return [
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
    ];
  }, [snapshot]);
  const platformFilterOptions = useMemo(
    () => applicationOptions?.platforms ?? [],
    [applicationOptions?.platforms],
  );
  const statusFilterOptions = useMemo(
    () => applicationOptions?.applicationStatuses ?? [],
    [applicationOptions?.applicationStatuses],
  );

  const columnDefs = useMemo<ColDef<HostApplication>[]>(
    () => [
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
        cellRendererParams: {
          onConfigureApplication,
          onDeleteApplication: handleRequestDeleteApplication,
          onOpenApplication,
        },
        colId: "actions",
        flex: 0.85,
        headerName: "操作",
        minWidth: 156,
        sortable: false,
      },
    ],
    [handleRequestDeleteApplication, onConfigureApplication, onOpenApplication],
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

  if (!snapshot) {
    return <ApplicationsPageLoading />;
  }

  const { applications } = snapshot;

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
              <ClearableFilterSelect
                icon={MonitorSmartphone}
                label="平台"
                value={filters.platform}
                options={platformFilterOptions}
                clearLabel="清空平台筛选"
                onClear={() => updateFilters({ platform: "" })}
                onValueChange={(value) => updateFilters({ platform: value })}
              />
              <ClearableFilterSelect
                icon={CircleDot}
                label="状态"
                value={filters.status}
                options={statusFilterOptions}
                clearLabel="清空状态筛选"
                onClear={() => updateFilters({ status: "" })}
                onValueChange={(value) => updateFilters({ status: value as ApplicationStatusCode })}
              />
              <OwnerSearchFilter
                value={filters.owner}
                onChange={(owner) => updateFilters({ owner })}
              />
              <ConsoleSearchInput
                value={keywordInput}
                placeholder="搜索应用名称"
                onChange={setKeywordInput}
              />
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                type="button"
                size="icon"
                aria-label="刷新应用列表"
                onClick={() => {
                  void refetch();
                }}
              >
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
            theme={applicationsGridTheme}
            suppressCellFocus
            suppressContextMenu
            getRowId={({ data }) => data.id}
          />

          <ConsoleTableFooter total={applications.length} />
        </section>
      </div>
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        isPending={isDeleting}
        title="删除应用"
        description={
          deleteTarget ? `确认删除「${deleteTarget.name}」？删除后应用将标记为已下线。` : ""
        }
        confirmLabel="删除应用"
        tone="danger"
        onCancel={() => {
          if (isDeleting) {
            return;
          }
          setDeleteTarget(null);
          setDeleteError("");
        }}
        onConfirm={async () => {
          if (!deleteTarget) {
            return;
          }

          setIsDeleting(true);
          setDeleteError("");
          try {
            await deleteApplication(deleteTarget.slug);
            await queryClient.invalidateQueries({ queryKey: applicationsSnapshotQueryKey() });
            setDeleteTarget(null);
          } catch (_error) {
            setDeleteError("删除应用失败，请稍后重试");
          } finally {
            setIsDeleting(false);
          }
        }}
      >
        {deleteError ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-rose-600 text-sm">
            {deleteError}
          </div>
        ) : null}
      </ConfirmDialog>
    </>
  );
}

function ApplicationsPageLoading() {
  return (
    <>
      <div className="border-slate-200 border-b bg-white px-6 py-5">
        <h1 className="font-semibold text-2xl text-slate-950 tracking-tight">应用管理</h1>
        <p className="mt-2 text-slate-600 text-sm">管理 RN Bundle 平台接入的所有宿主应用</p>
      </div>
      <div className="space-y-4 px-6 py-5">
        <section className="grid gap-3 xl:grid-cols-4">
          {["total", "running", "maintenance", "offline"].map((item) => (
            <Card key={item} className="h-32 animate-pulse rounded-lg bg-white shadow-none" />
          ))}
        </section>
        <Card className="h-96 animate-pulse rounded-lg border-slate-200 bg-white shadow-none" />
      </div>
    </>
  );
}

type OwnerSearchFilterProps = {
  onChange: (owner: string) => void;
  value: string;
};

type ClearableFilterSelectProps = {
  clearLabel: string;
  icon: LucideIcon;
  label: string;
  onClear: () => void;
  onValueChange: (value: string) => void;
  options: ApplicationOption[];
  value: string;
};

function ClearableFilterSelect({
  clearLabel,
  icon,
  label,
  onClear,
  onValueChange,
  options,
  value,
}: ClearableFilterSelectProps) {
  return (
    <div className="flex items-center gap-1">
      <ConsoleFilterSelect
        icon={icon}
        label={label}
        value={value}
        options={options}
        onValueChange={onValueChange}
      />
      {value ? (
        <Button
          variant="outline"
          type="button"
          size="icon"
          className="size-9 shrink-0 border-slate-200 bg-white text-slate-500"
          aria-label={clearLabel}
          onClick={onClear}
        >
          <X className="size-3.5" />
        </Button>
      ) : null}
    </div>
  );
}

function OwnerSearchFilter({ onChange, value }: OwnerSearchFilterProps) {
  const [query, setQuery] = useState(value);
  const [users, setUsers] = useState<FeishuUserSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setQuery(value);
  }, [value]);

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

  const label = value || "负责人";

  return (
    <fieldset
      className="relative m-0 min-w-0 border-0 p-0"
      onBlur={(event) => {
        const nextTarget = event.relatedTarget;
        if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
          return;
        }

        window.setTimeout(() => setIsOpen(false), 150);
      }}
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
          <div className="flex items-center gap-2">
            <Input
              value={query}
              placeholder="搜索姓名、邮箱或账号"
              className="h-8"
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setIsOpen(true)}
            />
            {value ? (
              <Button
                variant="outline"
                type="button"
                size="icon"
                className="size-8 shrink-0 border-slate-200 bg-white text-slate-500"
                aria-label="清空负责人筛选"
                onClick={() => {
                  setQuery("");
                  setUsers([]);
                  setIsOpen(false);
                  onChange("");
                }}
              >
                <X className="size-3.5" />
              </Button>
            ) : null}
          </div>
          <div className="mt-2 max-h-72 overflow-auto">
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
                  key={user.id}
                  variant="ghost"
                  type="button"
                  className="h-auto w-full justify-start gap-2 rounded-sm px-2 py-2 text-left font-normal"
                  onClick={() => {
                    setQuery(name);
                    setIsOpen(false);
                    onChange(name);
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
  return user.name;
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
          applicationStatusClass[value],
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

  const owner = data.owner;

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
  onDeleteApplication,
  onOpenApplication,
}: ICellRendererParams<HostApplication> & {
  onConfigureApplication?: (applicationSlug: string) => void;
  onDeleteApplication?: (application: HostApplication) => void;
  onOpenApplication?: (applicationSlug: string) => void;
}) {
  const isDeleted = data?.status === "已下线";

  return (
    <div className="flex h-full items-center gap-3 whitespace-nowrap font-medium text-xs">
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
      <Button
        variant="link"
        type="button"
        className="h-auto gap-1 p-0 text-rose-600 text-xs hover:text-rose-700 disabled:text-slate-400"
        disabled={isDeleted}
        onClick={() => {
          if (data) {
            onDeleteApplication?.(data);
          }
        }}
      >
        <Trash2 className="size-3.5" />
        删除
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
