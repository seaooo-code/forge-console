import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  buildsAllQueryKey,
  buildsRootQueryKey,
  createBuild,
  fetchAllBuildsSnapshot,
} from "@/api/builds";
import { fetchAllModulesSnapshot, modulesAllQueryKey } from "@/api/modules";
import { createBuildRelease } from "@/api/releases";
import { fetchAllStorageConfigurationsSnapshot } from "@/api/storage-configurations";
import { codeSourceConnectionsQueryKey, fetchCodeSourceConnections } from "@/pages/code-sources";
import { environmentsSnapshotQueryKey, fetchEnvironmentsSnapshot } from "@/pages/environments";
import {
  fetchAllReleaseRecordsSnapshot,
  releaseRecordsAllQueryKey,
  releaseRecordsSnapshotQueryKey,
  updateReleaseGrayPercentage,
} from "@/pages/release-records";

import { activeBuildsRefetchIntervalMs } from "../constants";
import type { OverviewModel, ReleaseComposerForm } from "../types";

/** 起步清单的进度：已有多少存储和环境。没有存储权限的用户读不到存储列表，此时只按环境判断。 */
export function useSetupProgress() {
  const storage = useQuery({
    queryFn: fetchAllStorageConfigurationsSnapshot,
    queryKey: ["overview", "setup-storage"],
    // 用户刚去别的页面添加完存储或环境再回来，进度要马上更新，不能等缓存过期。
    refetchOnMount: "always",
    retry: false,
  });
  const environments = useQuery({
    queryFn: fetchEnvironmentsSnapshot,
    queryKey: environmentsSnapshotQueryKey,
    refetchOnMount: "always",
  });

  return {
    environmentCount: environments.data?.environments.length ?? 0,
    isReady: environments.isSuccess && (storage.isSuccess || storage.isError),
    storageCount: storage.data?.configurations.length ?? 0,
  };
}

export function useOverviewData(applicationId: string) {
  const enabled = Boolean(applicationId);
  const modules = useQuery({
    enabled,
    queryFn: () => fetchAllModulesSnapshot({ applicationId }),
    queryKey: modulesAllQueryKey({ applicationId }),
  });
  const environments = useQuery({
    queryFn: fetchEnvironmentsSnapshot,
    queryKey: environmentsSnapshotQueryKey,
  });
  const releases = useQuery({
    enabled,
    queryFn: () => fetchAllReleaseRecordsSnapshot({ applicationId, status: "active" }),
    queryKey: releaseRecordsAllQueryKey({ applicationId, status: "active" }),
  });
  const builds = useQuery({
    enabled,
    queryFn: () => fetchAllBuildsSnapshot({ applicationId }),
    queryKey: buildsAllQueryKey({ applicationId }),
    refetchInterval: (query) =>
      query.state.data?.builds.some(
        (build) => build.status === "queued" || build.status === "running",
      )
        ? activeBuildsRefetchIntervalMs
        : false,
  });
  // 只有代码源管理员能读连接列表；读不到时首页不提示凭证过期，不当作错误。
  const connections = useQuery({
    queryFn: fetchCodeSourceConnections,
    queryKey: codeSourceConnectionsQueryKey,
    retry: false,
  });

  const model: OverviewModel | null =
    modules.data && environments.data && releases.data && builds.data
      ? {
          builds: builds.data.builds,
          environments: environments.data.environments,
          modules: modules.data.modules,
          releases: releases.data.records,
        }
      : null;
  const error = modules.error ?? environments.error ?? releases.error ?? builds.error ?? null;

  return {
    connections: connections.data ?? [],
    error,
    isLoading: enabled && !model && !error,
    model,
    refetch: () =>
      Promise.all([
        modules.refetch(),
        environments.refetch(),
        releases.refetch(),
        builds.refetch(),
      ]),
  };
}

function useInvalidateRoutes() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: releaseRecordsSnapshotQueryKey }),
      queryClient.invalidateQueries({ queryKey: buildsRootQueryKey }),
    ]);
}

export function useReleaseBuild() {
  const invalidate = useInvalidateRoutes();
  return useMutation({
    mutationFn: ({ buildId, form }: { buildId: string; form: ReleaseComposerForm }) =>
      createBuildRelease({
        buildRecordId: buildId,
        // 概览页的快捷发布只发默认渠道，渠道发布在构建页和发布记录页选择。
        channel: "",
        grayPercentage: form.grayPercentage,
        releaseType: form.kind === "full" ? "full" : "gray",
      }),
    onSuccess: invalidate,
  });
}

export function useUpdateGrayPercentage() {
  const invalidate = useInvalidateRoutes();
  return useMutation({
    mutationFn: ({ grayPercentage, releaseId }: { grayPercentage: number; releaseId: string }) =>
      updateReleaseGrayPercentage(releaseId, grayPercentage),
    onSuccess: invalidate,
  });
}

export function useRebuild() {
  const invalidate = useInvalidateRoutes();
  return useMutation({
    mutationFn: (input: { branch: string; environment: string; moduleId: string }) =>
      createBuild(input),
    onSuccess: invalidate,
  });
}
