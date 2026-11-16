import { useQueryClient } from "@tanstack/react-query";
import { Box, GitBranch, Plus, RefreshCw, Rocket, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { buildsSnapshotQueryKey } from "@/api/builds";
import { createBuildRelease } from "@/api/releases";
import { ApplicationScopeSelect } from "@/components/common/ApplicationScopeSelect";
import { ConsoleClearableFilterSelect } from "@/components/common/ConsoleControls";
import { DataTable, FilterBar, KpiCard, PageHeader, TablePagination } from "@/components/layout";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/store/use-auth-store";

import { releaseRecordsSnapshotQueryKey } from "./api/release-records-snapshot";
import { CreateReleaseDialog } from "./components/CreateReleaseDialog";
import { buildReleaseRecordsColumnDefs } from "./components/ReleaseRecordsTable";
import { useReleaseRecordsData, useReleaseRecordsFilters } from "./hooks";
import type { ReleaseRecordsFilters } from "./types";
import { buildReleaseRecordsStats } from "./utils";

const releaseStatusFilterOptions = [
  { label: "生效中", value: "active" },
  { label: "已失效", value: "inactive" },
];

const releaseTypeFilterOptions = [
  { label: "全量", value: "full" },
  { label: "灰度", value: "gray" },
];

type ReleaseRecordsPageProps = {
  onOpenRelease: (releaseId: string) => void;
};

export function ReleaseRecordsPage({ onOpenRelease }: ReleaseRecordsPageProps) {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const canCreateRelease = Boolean(session?.capabilities.canCreateRelease);
  const {
    clampPage,
    filters,
    page,
    pageSize,
    setPage,
    setPageSize,
    updateApplicationScope,
    updateFilters,
  } = useReleaseRecordsFilters();
  const {
    buildOptions,
    environmentOptions,
    environmentTones,
    isBuildsFetching,
    isFetching,
    moduleOptions,
    refetch,
    snapshot,
  } = useReleaseRecordsData(filters, page, pageSize);
  const [isCreateReleaseDialogOpen, setIsCreateReleaseDialogOpen] = useState(false);
  const [releaseError, setReleaseError] = useState("");
  const [releaseSuccess, setReleaseSuccess] = useState("");

  useEffect(() => {
    if (snapshot) {
      clampPage(snapshot.pagination.total);
    }
  }, [clampPage, snapshot]);

  const stats = buildReleaseRecordsStats(snapshot);
  const columnDefs = useMemo(
    () => buildReleaseRecordsColumnDefs(environmentTones),
    [environmentTones],
  );

  if (!snapshot) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="发布管理"
        description="管理构建产物发布后的访问路由指向变更"
        below={
          <div className="flex flex-wrap items-center gap-2">
            <ApplicationScopeSelect
              value={filters.applicationId}
              onValueChange={updateApplicationScope}
            />
          </div>
        }
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((item) => (
          <KpiCard
            key={item.id}
            icon={item.icon}
            label={item.label}
            value={item.value}
            detail={item.detail}
            tone={item.tone}
          />
        ))}
      </section>

      <FilterBar
        label="最近发布"
        primary={
          <>
            <ConsoleClearableFilterSelect
              icon={ShieldCheck}
              label="状态"
              value={filters.status}
              options={releaseStatusFilterOptions}
              clearLabel="清空状态筛选"
              onClear={() => updateFilters({ status: "" })}
              onValueChange={(status) =>
                updateFilters({ status: status as ReleaseRecordsFilters["status"] })
              }
            />
            <ConsoleClearableFilterSelect
              icon={Rocket}
              label="类型"
              value={filters.releaseType}
              options={releaseTypeFilterOptions}
              clearLabel="清空类型筛选"
              onClear={() => updateFilters({ releaseType: "" })}
              onValueChange={(releaseType) =>
                updateFilters({ releaseType: releaseType as ReleaseRecordsFilters["releaseType"] })
              }
            />
            <ConsoleClearableFilterSelect
              icon={Box}
              label="模块"
              value={filters.moduleId}
              options={moduleOptions}
              clearLabel="清空模块筛选"
              onClear={() => updateFilters({ moduleId: "" })}
              onValueChange={(moduleId) => updateFilters({ moduleId })}
            />
            <ConsoleClearableFilterSelect
              icon={GitBranch}
              label="环境"
              value={filters.environment}
              options={environmentOptions}
              clearLabel="清空环境筛选"
              onClear={() => updateFilters({ environment: "" })}
              onValueChange={(environment) => updateFilters({ environment })}
            />
          </>
        }
        actions={
          <>
            <Button
              type="button"
              size="sm"
              disabled={!canCreateRelease}
              onClick={() => {
                setReleaseError("");
                setReleaseSuccess("");
                setIsCreateReleaseDialogOpen(true);
              }}
            >
              <Plus className="size-4" />
              新建发布
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="刷新发布记录"
              disabled={isFetching}
              onClick={() => {
                void refetch();
              }}
            >
              <RefreshCw className="size-4" />
            </Button>
          </>
        }
      />

      {releaseSuccess ? <Alert variant="success">{releaseSuccess}</Alert> : null}

      <DataTable
        rows={snapshot.records}
        columnDefs={columnDefs}
        getRowId={({ data }) => data.id}
        onRowClicked={({ data }) => {
          if (data) {
            onOpenRelease(data.id);
          }
        }}
      />

      <Card className="rounded-xl border-border bg-card py-0 shadow-xs">
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={snapshot.pagination.total}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </Card>

      <CreateReleaseDialog
        buildOptions={buildOptions}
        isBuildsFetching={isBuildsFetching}
        isOpen={isCreateReleaseDialogOpen}
        submitError={releaseError}
        onClose={() => {
          setIsCreateReleaseDialogOpen(false);
          setReleaseError("");
        }}
        onSubmit={async (form) => {
          setReleaseError("");
          setReleaseSuccess("");

          try {
            const releaseCreatedAt = await createBuildRelease({
              buildRecordId: form.buildRecordId,
              expiresAt: form.expiresAt,
              grayPercentage: form.grayPercentage,
              grayStrategy: form.grayStrategy,
              identifier: form.identifier,
              releaseType: form.releaseType,
            });
            setReleaseSuccess(`发布已生效：${releaseCreatedAt}`);
            setIsCreateReleaseDialogOpen(false);
            await queryClient.invalidateQueries({ queryKey: releaseRecordsSnapshotQueryKey });
            await queryClient.invalidateQueries({ queryKey: buildsSnapshotQueryKey() });
          } catch (error) {
            setReleaseError(error instanceof Error ? error.message : "发布失败，请稍后重试");
          }
        }}
      />
    </div>
  );
}
