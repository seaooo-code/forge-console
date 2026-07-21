import { skipToken, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { applicationsAllQueryKey, fetchAllApplicationsSnapshot } from "@/pages/applications";
import { codeSourcesSnapshotQueryKey, fetchCodeSourcesSnapshot } from "@/pages/code-sources";

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
  const { data: codeSourceSnapshot, isFetching: isCodeSourcesFetching } = useQuery({
    queryFn: isEditMode ? skipToken : fetchCodeSourcesSnapshot,
    queryKey: codeSourcesSnapshotQueryKey,
  });
  const applicationOptions = useMemo(
    () =>
      applicationSnapshot?.applications.map((application) => ({
        label: application.name,
        value: application.id,
      })) ?? [],
    [applicationSnapshot],
  );
  const moduleRecord = editModuleId ? moduleSnapshot?.modules[0] : undefined;
  const initialForm = useMemo(
    () => buildInitialForm(isEditMode ? moduleRecord : undefined, applicationOptions[0]?.value),
    [applicationOptions, isEditMode, moduleRecord],
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
  const hasInstalledCodeSource = codeSourceSnapshot?.apps.some((app) => app.status === "installed");
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
    codeSourceSnapshot,
    commonModuleOptions,
    editModuleId,
    form,
    formError,
    hasInstalledCodeSource,
    isApplicationsFetching,
    isCodeSourcesFetching,
    isEditMode,
    isModuleFetching,
    moduleRecord,
    selectedKind,
    setFormError,
  };
}
