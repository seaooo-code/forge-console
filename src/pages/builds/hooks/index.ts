import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, Circle, Clock3, LoaderCircle, PackageCheck } from "lucide-react";
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
        buildReleaseTargetKey(record.moduleId, record.environment, record.runtimeVersion),
        {
          build: buildsById.get(record.buildRecordId),
          buildId: record.buildRecordId,
        },
      );
    }

    return releases;
  }, [buildsById, releaseRecordsSnapshot]);
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
  const stats = useMemo(
    () =>
      snapshot
        ? [
            {
              detail: "全部构建记录",
              icon: Activity,
              id: "total",
              label: "总构建",
              tone: "info" as const,
              value: snapshot.summary.total,
            },
            {
              detail: "正在执行",
              icon: LoaderCircle,
              id: "running",
              label: "构建中",
              tone: "info" as const,
              value: snapshot.summary.running,
            },
            {
              detail: "产物可发布",
              icon: PackageCheck,
              id: "success",
              label: "成功",
              tone: "success" as const,
              value: snapshot.summary.success,
            },
            {
              detail: "需要排查",
              icon: Circle,
              id: "failed",
              label: "失败",
              tone: "destructive" as const,
              value: snapshot.summary.failed,
            },
            {
              detail: "等待执行",
              icon: Clock3,
              id: "queued",
              label: "排队中",
              tone: "warning" as const,
              value: snapshot.summary.queued,
            },
          ]
        : [],
    [snapshot],
  );

  return {
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
    resetPage,
    setPage,
    setPageSize,
    snapshot,
    stats,
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
