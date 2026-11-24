import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import {
  buildsAllQueryKey,
  buildsSnapshotQueryKey,
  fetchAllBuildsSnapshot,
  fetchBuildsSnapshot,
} from "@/api/builds";
import { fetchAllModulesSnapshot, modulesAllQueryKey } from "@/api/modules";
import { usePagination } from "@/hooks/use-pagination";
import { environmentsSnapshotQueryKey, fetchEnvironmentsSnapshot } from "@/pages/environments";
import { fetchAllReleaseRecordsSnapshot, releaseRecordsAllQueryKey } from "@/pages/release-records";

import { buildLogsQueryKey, fetchBuildLogsAfter } from "../api/builds-snapshot";
import { buildLogsRefetchIntervalMs } from "../constants";
import type { ActiveFullReleaseTarget, BuildListFilters, BuildLogState } from "../types";
import { buildReleaseTargetKey } from "../utils";

export function useBuildsPageData(filters: BuildListFilters) {
  const { clampPage, page, pageSize, resetPage, setPage, setPageSize } = usePagination();
  const {
    data: snapshot,
    error,
    isFetching,
    refetch,
  } = useQuery({
    placeholderData: keepPreviousData,
    queryFn: () => fetchBuildsSnapshot({ ...filters, page, pageSize }),
    queryKey: buildsSnapshotQueryKey({ ...filters, page, pageSize }),
  });
  const { data: overviewSnapshot } = useQuery({
    queryFn: () => fetchAllBuildsSnapshot({ applicationId: filters.applicationId }),
    queryKey: buildsAllQueryKey({ applicationId: filters.applicationId }),
  });
  const { data: modulesSnapshot, isFetching: isModulesFetching } = useQuery({
    queryFn: () => fetchAllModulesSnapshot({ applicationId: filters.applicationId }),
    queryKey: modulesAllQueryKey({ applicationId: filters.applicationId }),
  });
  const { data: environmentSnapshot, isFetching: isEnvironmentsFetching } = useQuery({
    queryFn: fetchEnvironmentsSnapshot,
    queryKey: environmentsSnapshotQueryKey,
  });
  const { data: releaseRecordsSnapshot } = useQuery({
    queryFn: () => fetchAllReleaseRecordsSnapshot({ applicationId: filters.applicationId }),
    queryKey: releaseRecordsAllQueryKey({ applicationId: filters.applicationId }),
  });

  const buildsById = useMemo(
    () => new Map(overviewSnapshot?.builds.map((build) => [build.id, build]) ?? []),
    [overviewSnapshot],
  );
  const activeFullReleaseByTarget = useMemo(() => {
    const releases = new Map<string, ActiveFullReleaseTarget>();

    for (const record of releaseRecordsSnapshot?.records ?? []) {
      if (record.status !== "active" || record.releaseType !== "full") {
        continue;
      }

      releases.set(
        buildReleaseTargetKey(
          record.moduleId,
          record.environment,
          record.runtimeVersion,
          record.channel,
        ),
        {
          build: buildsById.get(record.buildRecordId),
          buildId: record.buildRecordId,
        },
      );
    }

    return releases;
  }, [buildsById, releaseRecordsSnapshot]);
  const applicationSlugByModuleId = useMemo(
    () =>
      new Map(modulesSnapshot?.modules.map((module) => [module.id, module.applicationSlug ?? ""])),
    [modulesSnapshot],
  );
  const moduleOptions = useMemo(
    () =>
      modulesSnapshot?.modules.map((module) => ({
        applicationName: module.applicationName,
        defaultBranch: module.defaultBranch ?? "",
        label: module.name,
        repositoryFullName: module.repositoryFullName || module.repository,
        value: module.id,
      })) ?? [],
    [modulesSnapshot],
  );
  const environmentOptions = useMemo(
    () =>
      environmentSnapshot?.environments.map((environment) => ({
        label: environment.name,
        value: environment.id,
      })) ?? [],
    [environmentSnapshot],
  );
  return {
    activeFullReleaseByTarget,
    applicationSlugByModuleId,
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
  };
}

/**
 * 增量拉取构建日志：每次从缓存里已读到的 seq 之后继续读，拼接到已有内容上。
 * 未读完时每 2 秒轮询一次，`finished` 为 true 或请求出错后停止；
 * 组件卸载后 Query 没有观察者，refetchInterval 随之停止。
 */
export function useBuildLogs(buildId: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryFn: () =>
      fetchBuildLogsAfter(
        buildId,
        queryClient.getQueryData<BuildLogState>(buildLogsQueryKey(buildId)),
      ),
    queryKey: buildLogsQueryKey(buildId),
    refetchInterval: (query) =>
      query.state.data?.finished || query.state.status === "error"
        ? false
        : buildLogsRefetchIntervalMs,
    // 只靠 refetchInterval 驱动增量读取，避免聚焦窗口或重新挂载时额外请求。
    refetchOnWindowFocus: false,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
