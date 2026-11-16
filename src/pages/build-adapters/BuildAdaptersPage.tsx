import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Blocks, Plus, RotateCw } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState, ErrorState } from "@/components/common/StateBlock";
import { DataTable, FilterBar, PageHeader } from "@/components/layout";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/store/use-auth-store";

import {
  BuildAdapterAPIError,
  buildAdaptersQueryKey,
  buildAdaptersRootQueryKey,
  fetchBuildAdapters,
  setBuildAdapterStatus,
} from "./api/build-adapters-snapshot";
import { BuildAdapterStatusDialog } from "./components/BuildAdapterStatusDialog";
import { buildBuildAdaptersColumnDefs } from "./components/BuildAdaptersColumns";
import { buildAdapterStatusFilterOptions, emptySelectValue } from "./constants";
import type { BuildAdapter, BuildAdapterStatusFilter } from "./types";

type BuildAdaptersPageProps = {
  onCreateBuildAdapter: () => void;
  onOpenBuildAdapter: (adapterId: string) => void;
};

export function BuildAdaptersPage({
  onCreateBuildAdapter,
  onOpenBuildAdapter,
}: BuildAdaptersPageProps) {
  const queryClient = useQueryClient();
  const canManage = Boolean(
    useAuthStore((state) => state.session?.capabilities.canManageBuildAdapters),
  );
  const [statusFilter, setStatusFilter] = useState<BuildAdapterStatusFilter>("");
  const adaptersQuery = useQuery({
    placeholderData: keepPreviousData,
    queryFn: () => fetchBuildAdapters(statusFilter),
    queryKey: buildAdaptersQueryKey(statusFilter),
  });
  const [message, setMessage] = useState("");
  const [statusTarget, setStatusTarget] = useState<BuildAdapter | null>(null);
  const [statusError, setStatusError] = useState("");
  const [isStatusPending, setIsStatusPending] = useState(false);
  const columnDefs = useMemo(
    () =>
      buildBuildAdaptersColumnDefs({
        canManage,
        onOpen: onOpenBuildAdapter,
        onToggleStatus: (adapter) => {
          setMessage("");
          setStatusError("");
          setStatusTarget(adapter);
        },
      }),
    [canManage, onOpenBuildAdapter],
  );
  const adapters = adaptersQuery.data ?? [];

  const handleToggleStatus = async (adapter: BuildAdapter) => {
    setIsStatusPending(true);
    setStatusError("");
    try {
      const updated = await setBuildAdapterStatus(
        adapter.id,
        adapter.status === "active" ? "disable" : "enable",
      );
      await queryClient.invalidateQueries({ queryKey: buildAdaptersRootQueryKey });
      setMessage(`适配器「${updated.name}」已${updated.status === "active" ? "启用" : "停用"}。`);
      setStatusTarget(null);
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : "操作失败，请稍后重试");
    } finally {
      setIsStatusPending(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="构建适配器"
          description="平台维护的可复用构建配方：Dockerfile 模板、辅助文件和参数定义。模块选用适配器后无需在仓库里放 Dockerfile。"
        />

        {!canManage ? (
          <Alert variant="info">
            当前账号只能查看和选用构建适配器，新建、编辑、停用和启用需要平台管理员权限。
          </Alert>
        ) : null}
        {message ? <Alert variant="success">{message}</Alert> : null}

        <FilterBar
          label="适配器列表"
          primary={
            <Select
              value={statusFilter || emptySelectValue}
              onValueChange={(value) =>
                setStatusFilter(
                  value === emptySelectValue ? "" : (value as BuildAdapterStatusFilter),
                )
              }
            >
              <SelectTrigger className="h-8 w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {buildAdapterStatusFilterOptions.map((option) => (
                  <SelectItem key={option.label} value={option.value || emptySelectValue}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
          actions={
            <>
              <span className="text-muted-foreground text-xs">
                共 <span className="font-semibold text-foreground">{adapters.length}</span> 个适配器
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void adaptersQuery.refetch()}
              >
                <RotateCw className="size-4" />
                刷新
              </Button>
              <Button type="button" size="sm" disabled={!canManage} onClick={onCreateBuildAdapter}>
                <Plus className="size-4" />
                新建适配器
              </Button>
            </>
          }
        />

        {adaptersQuery.isError && !adaptersQuery.data ? (
          <ErrorState
            title="构建适配器读取失败"
            message={
              adaptersQuery.error instanceof BuildAdapterAPIError &&
              adaptersQuery.error.status === 403
                ? "当前账号无权查看构建适配器，需要平台管理员，或任一应用的 Owner。"
                : adaptersQuery.error instanceof Error
                  ? adaptersQuery.error.message
                  : "请稍后重试"
            }
            onRetry={() => void adaptersQuery.refetch()}
          />
        ) : adaptersQuery.isPending ? (
          <Card className="h-96 animate-pulse rounded-xl border-border bg-card shadow-xs" />
        ) : (
          <DataTable
            rows={adapters}
            columnDefs={columnDefs}
            getRowId={({ data }) => data.id}
            rowActionSelector=".build-adapter-row-actions"
            onRowClicked={(event) => {
              if (event.data) {
                onOpenBuildAdapter(event.data.id);
              }
            }}
            emptyState={
              <EmptyState
                icon={Blocks}
                title={statusFilter ? "没有符合条件的适配器" : "暂无构建适配器"}
                description={
                  canManage ? "新建一个适配器，模块即可选用它来构建" : "等待平台管理员创建适配器"
                }
              />
            }
          />
        )}
      </div>

      <BuildAdapterStatusDialog
        adapter={statusTarget}
        error={statusError}
        isPending={isStatusPending}
        onCancel={() => {
          if (!isStatusPending) {
            setStatusTarget(null);
            setStatusError("");
          }
        }}
        onConfirm={(adapter) => void handleToggleStatus(adapter)}
      />
    </>
  );
}
