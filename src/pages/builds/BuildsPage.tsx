import { useQueryClient } from "@tanstack/react-query";
import { GitBranch, PackageCheck, Plus, RefreshCw, Rocket } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";

import { buildsSnapshotQueryKey, createBuild } from "@/api/builds";
import { createBuildRelease } from "@/api/releases";
import { ConsoleClearableFilterSelect } from "@/components/common/ConsoleControls";
import {
  Canvas,
  DataTable,
  ErrorMessage,
  FilterBar,
  SidePanel,
  SummaryStats,
  TablePagination,
} from "@/components/layout";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { releaseRecordsSnapshotQueryKey } from "@/pages/release-records";
import { useApplicationScopeStore } from "@/store/use-application-scope-store";
import { useAuthStore } from "@/store/use-auth-store";

import { BuildCreateDialog } from "./components/BuildCreateDialog";
import { BuildDetailPanel } from "./components/BuildDetailPanel";
import { BuildReleaseDialog } from "./components/BuildReleaseDialog";
import { buildBuildsColumnDefs } from "./components/BuildsColumns";
import { buildStatusSummaryItems, buildTriggerFilterOptions } from "./constants";
import { useBuildsPageData } from "./hooks";
import type { BuildListFilters, BuildRunRecord } from "./types";
import { buildReleaseTargetKey } from "./utils";

const emptyBuildListFilters: BuildListFilters = {
  applicationId: "",
  environment: "",
  moduleId: "",
  status: "",
  triggerType: "",
};

type Notice = { buildId?: string; text: string };

type BuildsPageProps = {
  onOpenBuildAdapter: (adapterId: string) => void;
  onOpenEnvironment: (environmentId: string) => void;
  onOpenStorage: (storageId: string) => void;
  onSelectBuild: (buildId: string | null) => void;
  selectedBuildId?: string;
};

export function BuildsPage({
  onOpenBuildAdapter,
  onOpenEnvironment,
  onOpenStorage,
  onSelectBuild,
  selectedBuildId,
}: BuildsPageProps) {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const storedApplicationId = useApplicationScopeStore((state) => state.applicationId);
  const setStoredApplicationId = useApplicationScopeStore((state) => state.setApplicationId);
  const initialApplicationId = searchParams.get("applicationId")?.trim() || storedApplicationId;
  const session = useAuthStore((state) => state.session);
  const canCreateBuild = Boolean(session?.capabilities.canCreateBuild);
  const canCreateRelease = Boolean(session?.capabilities.canCreateRelease);
  const [filters, setFilters] = useState<BuildListFilters>({
    ...emptyBuildListFilters,
    applicationId: initialApplicationId,
  });
  const {
    activeFullReleaseByTarget,
    clampPage,
    environmentOptions,
    error,
    isEnvironmentsFetching,
    isFetching,
    isModulesFetching,
    moduleOptions,
    page,
    pageSize,
    refetch,
    resetPage,
    setPage,
    setPageSize,
    snapshot,
  } = useBuildsPageData(filters);
  const [isCreateBuildDialogOpen, setIsCreateBuildDialogOpen] = useState(false);
  const [buildError, setBuildError] = useState("");
  const [releaseBuild, setReleaseBuild] = useState<BuildRunRecord | null>(null);
  const [releaseError, setReleaseError] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const updateFilters = useCallback(
    (patch: Partial<BuildListFilters>) => {
      setFilters((current) => ({ ...current, ...patch }));
      resetPage();
    },
    [resetPage],
  );
  useEffect(() => {
    const queryApplicationId = searchParams.get("applicationId")?.trim() ?? "";
    const nextApplicationId = queryApplicationId || storedApplicationId;

    setFilters((current) => {
      if (current.applicationId === nextApplicationId) {
        return current;
      }

      return { ...current, applicationId: nextApplicationId, moduleId: "" };
    });
    resetPage();
    setStoredApplicationId(nextApplicationId);
  }, [resetPage, searchParams, setStoredApplicationId, storedApplicationId]);
  useEffect(() => {
    if (snapshot) {
      clampPage(snapshot.pagination.total);
    }
  }, [clampPage, snapshot]);
  const openReleaseDialog = useCallback((build: BuildRunRecord) => {
    setReleaseBuild(build);
    setReleaseError("");
  }, []);
  const closeReleaseDialog = useCallback(() => {
    setReleaseBuild(null);
    setReleaseError("");
  }, []);
  const hasPanel = Boolean(selectedBuildId);
  const columnDefs = useMemo(
    () =>
      buildBuildsColumnDefs({ canCreateRelease, compact: hasPanel, onPublish: openReleaseDialog }),
    [canCreateRelease, hasPanel, openReleaseDialog],
  );
  const summaryItems = buildStatusSummaryItems.map((item) => ({
    id: item.filter,
    label: item.label,
    tone: item.tone,
    value: snapshot?.summary[item.key] ?? "-",
  }));

  return (
    <>
      <Canvas className={cn(hasPanel && "hidden xl:block")}>
        <div className="flex flex-col gap-5">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <h1 className="m-0 font-semibold text-2xl text-foreground tracking-tight">构建</h1>
              <SummaryStats
                className="mt-2"
                activeId={filters.status}
                items={summaryItems}
                onSelect={(status) =>
                  updateFilters({ status: status as BuildListFilters["status"] })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                aria-label="刷新构建列表"
                disabled={isFetching}
                onClick={() => {
                  void refetch();
                }}
              >
                <RefreshCw className={cn(isFetching && "animate-spin")} />
              </Button>
              <Button
                type="button"
                disabled={!canCreateBuild}
                onClick={() => {
                  setBuildError("");
                  setIsCreateBuildDialogOpen(true);
                }}
              >
                <Plus />
                新建构建
              </Button>
            </div>
          </header>

          <FilterBar
            primary={
              <>
                <ConsoleClearableFilterSelect
                  icon={PackageCheck}
                  label="模块"
                  value={filters.moduleId}
                  options={moduleOptions}
                  clearLabel="清空模块筛选"
                  onClear={() => updateFilters({ moduleId: "" })}
                  onValueChange={(moduleId) => updateFilters({ moduleId })}
                />
                <ConsoleClearableFilterSelect
                  icon={Rocket}
                  label="环境"
                  value={filters.environment}
                  options={environmentOptions}
                  clearLabel="清空环境筛选"
                  onClear={() => updateFilters({ environment: "" })}
                  onValueChange={(environment) => updateFilters({ environment })}
                />
                <ConsoleClearableFilterSelect
                  icon={GitBranch}
                  label="来源"
                  value={filters.triggerType}
                  options={buildTriggerFilterOptions}
                  clearLabel="清空来源筛选"
                  onClear={() => updateFilters({ triggerType: "" })}
                  onValueChange={(triggerType) =>
                    updateFilters({ triggerType: triggerType as BuildListFilters["triggerType"] })
                  }
                />
              </>
            }
          />

          {notice ? (
            <Alert variant="success">
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {notice.text}
                {notice.buildId ? (
                  <Button
                    className="h-auto p-0 text-success"
                    onClick={() => onSelectBuild(notice.buildId ?? null)}
                    type="button"
                    variant="link"
                  >
                    查看构建
                  </Button>
                ) : null}
              </span>
            </Alert>
          ) : null}

          {error && !snapshot ? (
            <ErrorMessage error={error} onRetry={() => void refetch()} />
          ) : !snapshot ? (
            <div className="h-96 animate-pulse rounded-xl bg-muted" />
          ) : (
            <div className="overflow-hidden rounded-xl bg-card shadow-edge">
              <DataTable
                className="rounded-none shadow-none"
                rows={snapshot.builds}
                columnDefs={columnDefs}
                getRowId={({ data }) => data.id}
                rowActionSelector="[data-build-row-action]"
                selectedRowId={selectedBuildId}
                onRowClicked={(event) => {
                  if (event.data) {
                    onSelectBuild(event.data.id);
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

      {selectedBuildId ? (
        <SidePanel label="构建详情">
          <BuildDetailPanel
            buildId={selectedBuildId}
            canCreateRelease={canCreateRelease}
            onClose={() => onSelectBuild(null)}
            onOpenBuildAdapter={onOpenBuildAdapter}
            onOpenEnvironment={onOpenEnvironment}
            onOpenStorage={onOpenStorage}
            onRelease={openReleaseDialog}
          />
        </SidePanel>
      ) : null}

      <BuildCreateDialog
        environmentOptions={environmentOptions}
        isEnvironmentsFetching={isEnvironmentsFetching}
        isModulesFetching={isModulesFetching}
        isOpen={isCreateBuildDialogOpen}
        moduleOptions={moduleOptions}
        submitError={buildError}
        onClose={() => {
          setIsCreateBuildDialogOpen(false);
          setBuildError("");
        }}
        onSubmit={async (form) => {
          setBuildError("");
          setNotice(null);

          try {
            const build = await createBuild({
              branch: form.branch,
              environment: form.environment,
              moduleId: form.moduleId,
            });
            setNotice({ buildId: build.id, text: `构建 #${build.number} 已提交` });
            setIsCreateBuildDialogOpen(false);
            onSelectBuild(build.id);
            await queryClient.invalidateQueries({ queryKey: buildsSnapshotQueryKey() });
          } catch (createError) {
            setBuildError(
              createError instanceof Error ? createError.message : "提交构建失败，请稍后重试",
            );
          }
        }}
      />
      <BuildReleaseDialog
        activeFullRelease={
          releaseBuild
            ? activeFullReleaseByTarget.get(
                buildReleaseTargetKey(
                  releaseBuild.moduleId,
                  releaseBuild.environment,
                  releaseBuild.runtimeVersion,
                ),
              )
            : undefined
        }
        build={releaseBuild}
        isOpen={Boolean(releaseBuild)}
        submitError={releaseError}
        onClose={closeReleaseDialog}
        onSubmit={async (form) => {
          if (!releaseBuild) {
            return;
          }

          setReleaseError("");
          setNotice(null);

          try {
            const releaseCreatedAt = await createBuildRelease({
              buildRecordId: releaseBuild.id,
              expiresAt: form.expiresAt,
              grayPercentage: form.grayPercentage,
              grayStrategy: form.grayStrategy,
              identifier: form.identifier,
              releaseType: form.releaseType,
            });
            setNotice({ text: `构建 #${releaseBuild.number} 的发布已生效：${releaseCreatedAt}` });
            closeReleaseDialog();
            await queryClient.invalidateQueries({ queryKey: buildsSnapshotQueryKey() });
            await queryClient.invalidateQueries({ queryKey: releaseRecordsSnapshotQueryKey });
          } catch (publishError) {
            setReleaseError(
              publishError instanceof Error ? publishError.message : "发布失败，请稍后重试",
            );
          }
        }}
      />
    </>
  );
}
