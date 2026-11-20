import { useQueryClient } from "@tanstack/react-query";
import { Box, GitBranch, Plus, RefreshCw, Rocket } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { buildsSnapshotQueryKey } from "@/api/builds";
import { createBuildRelease } from "@/api/releases";
import { ConsoleClearableFilterSelect } from "@/components/common/ConsoleControls";
import {
  Canvas,
  DataTable,
  ErrorMessage,
  FilterBar,
  ListHeader,
  SidePanel,
  SummaryStats,
  TablePagination,
} from "@/components/layout";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/use-auth-store";

import { releaseRecordsSnapshotQueryKey } from "./api/release-records-snapshot";
import { CreateReleaseDialog } from "./components/CreateReleaseDialog";
import { ReleaseDetailPanel } from "./components/ReleaseDetailPanel";
import { buildReleaseRecordsColumnDefs } from "./components/ReleaseRecordsTable";
import { useReleaseRecordsData, useReleaseRecordsFilters } from "./hooks";
import type { ReleaseRecordsFilters } from "./types";

const releaseTypeFilterOptions = [
  { label: "全量", value: "full" },
  { label: "灰度", value: "gray" },
];

type ReleaseRecordsPageProps = {
  onOpenApplication: (applicationSlug: string) => void;
  onOpenBuild: (buildId: string) => void;
  onOpenEnvironment: (environmentId: string) => void;
  onOpenModule: (moduleId: string) => void;
  onSelectRelease: (releaseId: string | null) => void;
  selectedReleaseId?: string;
};

export function ReleaseRecordsPage({
  onOpenApplication,
  onOpenBuild,
  onOpenEnvironment,
  onOpenModule,
  onSelectRelease,
  selectedReleaseId,
}: ReleaseRecordsPageProps) {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const canCreateRelease = Boolean(session?.capabilities.canCreateRelease);
  const { clampPage, filters, page, pageSize, setPage, setPageSize, updateFilters } =
    useReleaseRecordsFilters();
  const {
    buildOptions,
    environmentOptions,
    environmentTones,
    error,
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

  const hasPanel = Boolean(selectedReleaseId);
  const columnDefs = useMemo(
    () => buildReleaseRecordsColumnDefs(environmentTones, hasPanel),
    [environmentTones, hasPanel],
  );
  const summaryItems = [
    { id: "", label: "全部", value: snapshot?.summary.total ?? "-" },
    {
      id: "active",
      label: "生效中",
      tone: "success" as const,
      value: snapshot?.summary.active ?? "-",
    },
    { id: "inactive", label: "已失效", value: snapshot?.summary.inactive ?? "-" },
  ];

  return (
    <>
      <Canvas className={cn(hasPanel && "hidden xl:block")}>
        <div className="flex flex-col gap-5">
          <ListHeader
            title="发布记录"
            summary={
              <SummaryStats
                activeId={filters.status}
                items={summaryItems}
                onSelect={(status) =>
                  updateFilters({ status: status as ReleaseRecordsFilters["status"] })
                }
              />
            }
            actions={
              <>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="刷新发布记录"
                  disabled={isFetching}
                  onClick={() => {
                    void refetch();
                  }}
                >
                  <RefreshCw className={cn(isFetching && "animate-spin")} />
                </Button>
                <Button
                  type="button"
                  disabled={!canCreateRelease}
                  onClick={() => {
                    setReleaseError("");
                    setReleaseSuccess("");
                    setIsCreateReleaseDialogOpen(true);
                  }}
                >
                  <Plus />
                  新建发布
                </Button>
              </>
            }
          />

          <FilterBar
            primary={
              <>
                <ConsoleClearableFilterSelect
                  icon={Rocket}
                  label="类型"
                  value={filters.releaseType}
                  options={releaseTypeFilterOptions}
                  clearLabel="清空类型筛选"
                  onClear={() => updateFilters({ releaseType: "" })}
                  onValueChange={(releaseType) =>
                    updateFilters({
                      releaseType: releaseType as ReleaseRecordsFilters["releaseType"],
                    })
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
          />

          {releaseSuccess ? <Alert variant="success">{releaseSuccess}</Alert> : null}

          {error && !snapshot ? (
            <ErrorMessage error={error} onRetry={() => void refetch()} />
          ) : !snapshot ? (
            <div className="h-96 animate-pulse rounded-xl bg-muted" />
          ) : (
            <div className="overflow-hidden rounded-xl bg-card shadow-edge">
              <DataTable
                className="rounded-none shadow-none"
                rows={snapshot.records}
                columnDefs={columnDefs}
                getRowId={({ data }) => data.id}
                selectedRowId={selectedReleaseId}
                onRowClicked={({ data }) => {
                  if (data) {
                    onSelectRelease(data.id);
                  }
                }}
              />
              <TablePagination
                page={page}
                pageSize={pageSize}
                total={snapshot.pagination.total}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          )}
        </div>
      </Canvas>

      {selectedReleaseId ? (
        <SidePanel label="发布详情">
          <ReleaseDetailPanel
            key={selectedReleaseId}
            canCreateRelease={canCreateRelease}
            releaseId={selectedReleaseId}
            onClose={() => onSelectRelease(null)}
            onOpenApplication={onOpenApplication}
            onOpenBuild={onOpenBuild}
            onOpenEnvironment={onOpenEnvironment}
            onOpenModule={onOpenModule}
          />
        </SidePanel>
      ) : null}

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
              grayPercentage: form.grayPercentage,
              releaseType: form.releaseType,
            });
            setReleaseSuccess(`发布已生效：${releaseCreatedAt}`);
            setIsCreateReleaseDialogOpen(false);
            await queryClient.invalidateQueries({ queryKey: releaseRecordsSnapshotQueryKey });
            await queryClient.invalidateQueries({ queryKey: buildsSnapshotQueryKey() });
          } catch (createError) {
            setReleaseError(
              createError instanceof Error ? createError.message : "发布失败，请稍后重试",
            );
          }
        }}
      />
    </>
  );
}
