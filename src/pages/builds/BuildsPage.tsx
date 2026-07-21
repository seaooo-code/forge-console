import { useQueryClient } from "@tanstack/react-query";
import { Activity, GitBranch, PackageCheck, Plus, RefreshCw, Rocket } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";

import { buildsSnapshotQueryKey, createBuild } from "@/api/builds";
import { createBuildRelease } from "@/api/releases";
import { ApplicationScopeSelect } from "@/components/common/ApplicationScopeSelect";
import { ConsoleClearableFilterSelect } from "@/components/common/ConsoleControls";
import { DataTable, FilterBar, KpiCard, PageHeader, TablePagination } from "@/components/layout";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { releaseRecordsSnapshotQueryKey } from "@/pages/release-records";
import { useApplicationScopeStore } from "@/store/use-application-scope-store";
import { useAuthStore } from "@/store/use-auth-store";

import { BuildCreateDialog } from "./components/BuildCreateDialog";
import { BuildReleaseDialog } from "./components/BuildReleaseDialog";
import { buildBuildsColumnDefs } from "./components/BuildsColumns";
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

const buildStatusFilterOptions = [
  { label: "排队中", value: "pending" },
  { label: "构建中", value: "running" },
  { label: "成功", value: "succeeded" },
  { label: "失败", value: "failed" },
];

const buildTriggerFilterOptions = [
  { label: "手动触发", value: "manual" },
  { label: "流水线触发", value: "pipeline" },
];

type BuildsPageProps = {
  onOpenBuild: (buildId: string) => void;
};

export function BuildsPage({ onOpenBuild }: BuildsPageProps) {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
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
    isEnvironmentsFetching,
    isFetching,
    isModulesFetching,
    moduleOptions,
    page,
    pageSize,
    refetch,
    refetchOverview,
    resetPage,
    setPage,
    setPageSize,
    snapshot,
    stats,
  } = useBuildsPageData(filters);
  const [isCreateBuildDialogOpen, setIsCreateBuildDialogOpen] = useState(false);
  const [buildError, setBuildError] = useState("");
  const [buildSuccess, setBuildSuccess] = useState("");
  const [releaseBuild, setReleaseBuild] = useState<BuildRunRecord | null>(null);
  const [releaseError, setReleaseError] = useState("");
  const [releaseSuccess, setReleaseSuccess] = useState("");
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
  const updateApplicationScope = useCallback(
    (applicationId: string) => {
      const normalizedApplicationId = applicationId.trim();
      setStoredApplicationId(normalizedApplicationId);
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        if (normalizedApplicationId) {
          next.set("applicationId", normalizedApplicationId);
        } else {
          next.delete("applicationId");
        }
        return next;
      });
      updateFilters({ applicationId: normalizedApplicationId, moduleId: "" });
    },
    [setSearchParams, setStoredApplicationId, updateFilters],
  );
  const openReleaseDialog = useCallback((build: BuildRunRecord) => {
    setReleaseBuild(build);
    setReleaseError("");
    setReleaseSuccess("");
  }, []);
  const closeReleaseDialog = useCallback(() => {
    setReleaseBuild(null);
    setReleaseError("");
  }, []);
  const columnDefs = useMemo(
    () => buildBuildsColumnDefs({ canCreateRelease, onPublish: openReleaseDialog }),
    [canCreateRelease, openReleaseDialog],
  );

  if (!snapshot) {
    return null;
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="构建管理"
          description="汇总所有模块构建执行，支持手动新增构建并跟踪流水线触发结果"
          below={
            <div className="flex flex-wrap items-center gap-2">
              <ApplicationScopeSelect
                value={filters.applicationId}
                onValueChange={updateApplicationScope}
              />
            </div>
          }
        />

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
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
          label="最近构建"
          primary={
            <>
              <ConsoleClearableFilterSelect
                icon={Activity}
                label="状态"
                value={filters.status}
                options={buildStatusFilterOptions}
                clearLabel="清空状态筛选"
                onClear={() => updateFilters({ status: "" })}
                onValueChange={(status) =>
                  updateFilters({ status: status as BuildListFilters["status"] })
                }
              />
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
          actions={
            <>
              <Button
                type="button"
                size="sm"
                disabled={!canCreateBuild}
                onClick={() => {
                  setBuildError("");
                  setBuildSuccess("");
                  setReleaseSuccess("");
                  setIsCreateBuildDialogOpen(true);
                }}
              >
                <Plus className="size-4" />
                新增构建
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="刷新构建列表"
                disabled={isFetching}
                onClick={() => {
                  void refetch();
                  void refetchOverview();
                }}
              >
                <RefreshCw className="size-4" />
              </Button>
            </>
          }
        />

        {releaseSuccess ? <Alert variant="success">{releaseSuccess}</Alert> : null}
        {buildSuccess ? <Alert variant="success">{buildSuccess}</Alert> : null}

        <DataTable
          rows={snapshot.builds}
          columnDefs={columnDefs}
          getRowId={({ data }) => data.id}
          rowActionSelector="[data-build-row-action]"
          onRowClicked={(event) => {
            if (event.data) {
              onOpenBuild(event.data.id);
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
      </div>

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
          setBuildSuccess("");
          setReleaseSuccess("");

          try {
            const build = await createBuild({
              branch: form.branch,
              environment: form.environment,
              moduleId: form.moduleId,
            });
            setBuildSuccess(`构建已提交：${build.createdAt}`);
            setIsCreateBuildDialogOpen(false);
            await queryClient.invalidateQueries({ queryKey: buildsSnapshotQueryKey() });
          } catch (error) {
            setBuildError(error instanceof Error ? error.message : "提交构建失败，请稍后重试");
          }
        }}
      />
      <BuildReleaseDialog
        activeFullRelease={
          releaseBuild
            ? activeFullReleaseByTarget.get(
                buildReleaseTargetKey(releaseBuild.moduleId, releaseBuild.environment),
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
          setReleaseSuccess("");

          try {
            const releaseCreatedAt = await createBuildRelease({
              buildRecordId: releaseBuild.id,
              expiresAt: form.expiresAt,
              grayPercentage: form.grayPercentage,
              grayStrategy: form.grayStrategy,
              identifier: form.identifier,
              releaseType: form.releaseType,
            });
            setReleaseSuccess(`发布已生效：${releaseCreatedAt}`);
            closeReleaseDialog();
            await queryClient.invalidateQueries({ queryKey: buildsSnapshotQueryKey() });
            await queryClient.invalidateQueries({ queryKey: releaseRecordsSnapshotQueryKey });
          } catch (error) {
            setReleaseError(error instanceof Error ? error.message : "发布失败，请稍后重试");
          }
        }}
      />
    </>
  );
}
