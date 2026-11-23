import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";

import { buildsAllQueryKey, fetchAllBuildsSnapshot } from "@/api/builds";
import {
  fetchAllModulesSnapshot,
  fetchModuleDetailSnapshot,
  moduleDetailQueryKey,
  modulesAllQueryKey,
} from "@/api/modules";
import { usePagination } from "@/hooks/use-pagination";
import { environmentsSnapshotQueryKey, fetchEnvironmentsSnapshot } from "@/pages/environments";
import { useApplicationScopeStore } from "@/store/use-application-scope-store";

import {
  deactivateRelease,
  fetchReleaseEvents,
  fetchReleasePullStats,
  fetchReleaseRecordDetail,
  fetchReleaseRecordsSnapshot,
  releaseEventsQueryKey,
  releasePullStatsQueryKey,
  releaseRecordDetailQueryKey,
  releaseRecordsSnapshotQueryKey,
  releaseRecordsSnapshotQueryKeyWithFilters,
  rollbackRelease,
  updateReleaseGrayPercentage,
} from "../api/release-records-snapshot";
import type { ReleaseRecordsFilters } from "../types";

const emptyReleaseRecordsFilters: ReleaseRecordsFilters = {
  applicationId: "",
  environment: "",
  moduleId: "",
  releaseType: "",
  status: "",
};

export function useReleaseRecordsFilters() {
  const [searchParams] = useSearchParams();
  const storedApplicationId = useApplicationScopeStore((state) => state.applicationId);
  const setStoredApplicationId = useApplicationScopeStore((state) => state.setApplicationId);
  const initialApplicationId = searchParams.get("applicationId")?.trim() || storedApplicationId;
  const [filters, setFilters] = useState<ReleaseRecordsFilters>({
    ...emptyReleaseRecordsFilters,
    applicationId: initialApplicationId,
  });
  const { clampPage, page, pageSize, resetPage, setPage, setPageSize } = usePagination();

  const updateFilters = (patch: Partial<ReleaseRecordsFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
    resetPage();
  };

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

  return {
    clampPage,
    filters,
    page,
    pageSize,
    setPage,
    setPageSize,
    updateFilters,
  };
}

export function useReleaseRecordsData(
  filters: ReleaseRecordsFilters,
  page: number,
  pageSize: number,
) {
  const {
    data: snapshot,
    error,
    isFetching,
    refetch,
  } = useQuery({
    placeholderData: keepPreviousData,
    queryFn: () => fetchReleaseRecordsSnapshot({ ...filters, page, pageSize }),
    queryKey: releaseRecordsSnapshotQueryKeyWithFilters({ ...filters, page, pageSize }),
  });
  const { data: buildsSnapshot, isFetching: isBuildsFetching } = useQuery({
    queryFn: () => fetchAllBuildsSnapshot({ applicationId: filters.applicationId }),
    queryKey: buildsAllQueryKey({ applicationId: filters.applicationId }),
  });
  const { data: modulesSnapshot } = useQuery({
    queryFn: () => fetchAllModulesSnapshot({ applicationId: filters.applicationId }),
    queryKey: modulesAllQueryKey({ applicationId: filters.applicationId }),
  });
  const { data: environmentSnapshot } = useQuery({
    queryFn: fetchEnvironmentsSnapshot,
    queryKey: environmentsSnapshotQueryKey,
  });

  const buildOptions = useMemo(
    () => buildsSnapshot?.builds.filter((build) => build.status === "success") ?? [],
    [buildsSnapshot],
  );
  const moduleOptions = useMemo(
    () =>
      modulesSnapshot?.modules.map((module) => ({
        label: module.name,
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

  const environmentTones = useMemo(
    () =>
      new Map(
        environmentSnapshot?.environments.map((environment) => [
          environment.id,
          environment.tone,
        ]) ?? [],
      ),
    [environmentSnapshot],
  );

  return {
    buildOptions,
    environmentOptions,
    environmentTones,
    error,
    isBuildsFetching,
    isFetching,
    moduleOptions,
    refetch,
    snapshot,
  };
}

export function useReleaseRecordDetail(releaseId: string) {
  const queryClient = useQueryClient();
  const [grayPercentageInput, setGrayPercentageInput] = useState("0");
  const [grayPercentageError, setGrayPercentageError] = useState("");
  const [grayPercentageMessage, setGrayPercentageMessage] = useState("");
  const {
    data: release,
    error,
    isFetching,
  } = useQuery({
    queryFn: () => fetchReleaseRecordDetail(releaseId),
    queryKey: releaseRecordDetailQueryKey(releaseId),
  });
  const releaseModuleId = release?.moduleId;
  const { data: events, error: eventsError } = useQuery({
    queryFn: () => fetchReleaseEvents(releaseId),
    queryKey: releaseEventsQueryKey(releaseId),
  });
  const buildRecordId = release?.buildRecordId ?? "";
  const environment = release?.environment ?? "";
  const { data: pullStats, error: pullStatsError } = useQuery({
    enabled: Boolean(buildRecordId && buildRecordId !== "-"),
    queryFn: () => fetchReleasePullStats(buildRecordId, environment),
    queryKey: releasePullStatsQueryKey(buildRecordId, environment),
  });
  const invalidateRelease = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: releaseRecordDetailQueryKey(releaseId) }),
      queryClient.invalidateQueries({ queryKey: releaseEventsQueryKey(releaseId) }),
      queryClient.invalidateQueries({ queryKey: releaseRecordsSnapshotQueryKey }),
      releaseModuleId && releaseModuleId !== "-"
        ? queryClient.invalidateQueries({ queryKey: moduleDetailQueryKey(releaseModuleId) })
        : Promise.resolve(),
    ]);
  const deactivateMutation = useMutation({
    mutationFn: (reason: string) => deactivateRelease(releaseId, reason),
    onSuccess: invalidateRelease,
  });
  const rollbackMutation = useMutation({
    mutationFn: (description: string) => rollbackRelease(releaseId, description),
    onSuccess: invalidateRelease,
  });
  const { data: moduleSnapshot } = useQuery({
    enabled: Boolean(releaseModuleId && releaseModuleId !== "-"),
    queryFn: () => fetchModuleDetailSnapshot(releaseModuleId ?? ""),
    queryKey: moduleDetailQueryKey(releaseModuleId),
  });
  const grayPercentageMutation = useMutation({
    mutationFn: (grayPercentage: number) => updateReleaseGrayPercentage(releaseId, grayPercentage),
    onError: (mutationError) => {
      setGrayPercentageMessage("");
      setGrayPercentageError(
        mutationError instanceof Error ? mutationError.message : "灰度比例更新失败",
      );
    },
    onSuccess: async (updatedRelease, grayPercentage) => {
      setGrayPercentageError("");
      setGrayPercentageMessage(grayPercentage === 100 ? "已转为全量发布" : "灰度比例已更新");
      setGrayPercentageInput(String(updatedRelease.grayPercentage));
      queryClient.setQueryData(releaseRecordDetailQueryKey(releaseId), updatedRelease);
      await invalidateRelease();
    },
  });

  useEffect(() => {
    if (release?.releaseType === "gray" && release.grayStrategy === "percentage") {
      setGrayPercentageInput(String(release.grayPercentage));
      setGrayPercentageError("");
      setGrayPercentageMessage("");
    }
  }, [release?.grayPercentage, release?.grayStrategy, release?.releaseType]);

  return {
    deactivateMutation,
    error,
    events,
    eventsError,
    grayPercentageError,
    grayPercentageInput,
    grayPercentageMessage,
    grayPercentageMutation,
    isFetching,
    moduleSnapshot,
    pullStats,
    pullStatsError,
    release,
    rollbackMutation,
    setGrayPercentageError,
    setGrayPercentageInput,
    setGrayPercentageMessage,
  };
}
