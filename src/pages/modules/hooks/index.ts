import { skipToken, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { applicationsAllQueryKey, fetchAllApplicationsSnapshot } from "@/pages/applications";
import { codeSourceConnectionsQueryKey, fetchCodeSourceConnections } from "@/pages/code-sources";
import { environmentsSnapshotQueryKey, fetchEnvironmentsSnapshot } from "@/pages/environments";

import {
  fetchAllModulesSnapshot,
  fetchModuleDetailSnapshot,
  moduleEditQueryKey,
  modulesAllQueryKey,
} from "../api/modules-snapshot";
import type { ModuleFormState } from "../types";
import { buildInitialForm } from "../utils";

export function useModuleFormData(mode: "create" | "edit", moduleId: string | undefined) {
  const isEditMode = mode === "edit";
  const editModuleId = isEditMode ? moduleId : undefined;
  const { data: applicationSnapshot, isFetching: isApplicationsFetching } = useQuery({
    queryFn: () => fetchAllApplicationsSnapshot(),
    queryKey: applicationsAllQueryKey,
  });
  const { data: moduleSnapshot, isFetching: isModuleFetching } = useQuery({
    queryFn: editModuleId ? () => fetchModuleDetailSnapshot(editModuleId) : skipToken,
    queryKey: moduleEditQueryKey(editModuleId),
  });
  const { data: connections, isFetching: isConnectionsFetching } = useQuery({
    queryFn: fetchCodeSourceConnections,
    queryKey: codeSourceConnectionsQueryKey,
  });
  const { data: environmentSnapshot } = useQuery({
    queryFn: fetchEnvironmentsSnapshot,
    queryKey: environmentsSnapshotQueryKey,
  });
  // 自动构建环境提交的是环境 code，接口里环境的 id 就是 code。
  const environmentOptions = useMemo(
    () =>
      environmentSnapshot?.environments.map((environment) => ({
        label: `${environment.name}（${environment.id}）`,
        value: environment.id,
      })) ?? [],
    [environmentSnapshot],
  );
  const activeConnections = useMemo(
    () => connections?.filter((connection) => connection.status === "active") ?? [],
    [connections],
  );
  const applicationOptions = useMemo(
    () =>
      applicationSnapshot?.applications.map((application) => ({
        label: application.name,
        value: application.id,
      })) ?? [],
    [applicationSnapshot],
  );
  const moduleRecord = editModuleId ? moduleSnapshot?.modules[0] : undefined;
  // 新建时只有一个可用连接就默认选中，减少一次点击。
  const fallbackConnectionId =
    !isEditMode && activeConnections.length === 1 ? activeConnections[0].id : "";
  const initialForm = useMemo(
    () =>
      buildInitialForm(
        isEditMode ? moduleRecord : undefined,
        applicationOptions[0]?.value,
        fallbackConnectionId,
      ),
    [applicationOptions, fallbackConnectionId, isEditMode, moduleRecord],
  );
  const form = useForm<ModuleFormState>({
    defaultValues: initialForm,
  });
  const { control, reset } = form;
  const selectedApplicationId = useWatch({ control, name: "applicationId" });
  const selectedKind = useWatch({ control, name: "kind" });
  const shouldLoadCommonModules = selectedKind === "Feature" && selectedApplicationId !== "";
  const commonModuleFilters = useMemo(
    () => ({
      applicationId: shouldLoadCommonModules ? selectedApplicationId : "",
      kind: "Common" as const,
    }),
    [selectedApplicationId, shouldLoadCommonModules],
  );
  const { data: commonModuleSnapshot } = useQuery({
    queryFn: shouldLoadCommonModules
      ? () => fetchAllModulesSnapshot(commonModuleFilters)
      : skipToken,
    queryKey: modulesAllQueryKey(commonModuleFilters),
  });
  const [formError, setFormError] = useState("");
  const commonModuleOptions = useMemo(
    () =>
      commonModuleSnapshot?.modules.filter(
        (module) => module.applicationId === selectedApplicationId && module.id !== editModuleId,
      ) ?? [],
    [commonModuleSnapshot, editModuleId, selectedApplicationId],
  );

  useEffect(() => {
    reset(initialForm);
    setFormError("");
  }, [initialForm, reset]);

  return {
    applicationOptions,
    applicationSnapshot,
    commonModuleOptions,
    connections: connections ?? [],
    editModuleId,
    environmentOptions,
    form,
    formError,
    hasActiveConnection: activeConnections.length > 0,
    isApplicationsFetching,
    isConnectionsFetching,
    isEditMode,
    isModuleFetching,
    moduleRecord,
    selectedKind,
    setFormError,
  };
}

export function useDebouncedValue<T>(value: T, delay = 280) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(handle);
  }, [delay, value]);

  return debouncedValue;
}
