import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import {
  createReleaseChannel,
  deleteReleaseChannel,
  fetchReleaseChannels,
  type ReleaseChannel,
  releaseChannelsQueryKey,
  updateReleaseChannel,
} from "@/api/release-channels";
import { usePagination } from "@/hooks/use-pagination";

import {
  applicationDeleteCheckQueryKey,
  applicationDetailQueryKey,
  applicationOptionsQueryKey,
  applicationsRootQueryKey,
  applicationsSnapshotQueryKey,
} from "../api/application-list-filters";
import {
  type ApplicationDetailAPIResponse,
  deleteApplicationMember,
  fetchApplicationDeleteCheck,
  fetchApplicationDetailSnapshot,
  fetchApplicationOptions,
  fetchApplicationsSnapshot,
  updateApplicationMemberRole,
  updateApplicationStatus,
  upsertApplicationMember,
} from "../api/applications-snapshot";
import { emptyApplicationListFilters } from "../constants";
import type {
  ApplicationListFilters,
  ApplicationMemberFormState,
  ApplicationMemberRecord,
  ApplicationStatusCode,
  HostApplication,
  ReleaseChannelFormState,
} from "../types";
import { upsertMemberInList } from "../utils";

export function useApplicationOptions() {
  return useQuery({
    queryFn: fetchApplicationOptions,
    queryKey: applicationOptionsQueryKey,
    staleTime: 5 * 60 * 1000,
  });
}

export function useApplicationDeleteCheck(applicationSlug: string | undefined) {
  return useQuery({
    enabled: applicationSlug !== undefined,
    queryFn: () => fetchApplicationDeleteCheck(applicationSlug ?? ""),
    queryKey: applicationDeleteCheckQueryKey(applicationSlug),
    retry: false,
  });
}

export function useApplicationsListState() {
  const [filters, setFilters] = useState<ApplicationListFilters>(emptyApplicationListFilters);
  const { clampPage, page, pageSize, resetPage, setPage, setPageSize } = usePagination();
  const {
    data: snapshot,
    error,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    placeholderData: keepPreviousData,
    queryFn: () => fetchApplicationsSnapshot({ ...filters, page, pageSize }),
    queryKey: applicationsSnapshotQueryKey({ ...filters, page, pageSize }),
  });
  const { data: applicationOptions } = useApplicationOptions();
  const [keywordInput, setKeywordInput] = useState(filters.keyword);

  const updateFilters = useCallback(
    (patch: Partial<ApplicationListFilters>) => {
      setFilters((current) => ({ ...current, ...patch }));
      resetPage();
    },
    [resetPage],
  );

  useEffect(() => {
    setKeywordInput(filters.keyword);
  }, [filters.keyword]);

  useEffect(() => {
    if (snapshot) {
      clampPage(snapshot.pagination.total);
    }
  }, [clampPage, snapshot]);

  useEffect(() => {
    const nextKeyword = keywordInput.trim();
    if (nextKeyword === filters.keyword) {
      return;
    }

    const handle = window.setTimeout(() => {
      updateFilters({ keyword: nextKeyword });
    }, 360);

    return () => window.clearTimeout(handle);
  }, [filters.keyword, keywordInput, updateFilters]);

  const platformFilterOptions = useMemo(
    () => applicationOptions?.platforms ?? [],
    [applicationOptions?.platforms],
  );

  return {
    error,
    filters,
    isError,
    isFetching,
    keywordInput,
    page,
    pageSize,
    platformFilterOptions,
    refetch,
    setKeywordInput,
    setPage,
    setPageSize,
    snapshot,
    updateFilters,
  };
}

export function useApplicationDetail(applicationSlug: string) {
  const queryClient = useQueryClient();
  const { data: snapshot, isFetching } = useQuery({
    queryFn: () => fetchApplicationDetailSnapshot(applicationSlug),
    queryKey: applicationDetailQueryKey(applicationSlug),
  });
  const [overrideDetail, setOverrideDetail] = useState<ApplicationDetailAPIResponse | null>(null);
  const application =
    overrideDetail?.application ??
    snapshot?.applications.find((item) => item.slug === applicationSlug);
  const detail = overrideDetail?.detail ?? snapshot?.details[applicationSlug];

  const updateMembers = useCallback(
    (members: ApplicationMemberRecord[]) => {
      if (!(application && detail)) {
        return;
      }
      setOverrideDetail({
        application,
        detail: {
          ...detail,
          members,
        },
      });
    },
    [application, detail],
  );

  const refreshApplicationDetail = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: applicationDetailQueryKey(applicationSlug) }),
      queryClient.invalidateQueries({ queryKey: applicationsRootQueryKey }),
    ]);
  }, [applicationSlug, queryClient]);

  return {
    application,
    detail,
    isFetching,
    refreshApplicationDetail,
    setOverrideDetail,
    updateMembers,
  };
}

export function useApplicationStatusToggle(
  application: HostApplication | undefined,
  onUpdated: (payload: ApplicationDetailAPIResponse) => void,
) {
  const queryClient = useQueryClient();
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [actionError, setActionError] = useState("");

  const statusActionLabel = application?.status === "已下线" ? "上线" : "下线";
  const nextStatus: ApplicationStatusCode =
    application?.status === "已下线" ? "running" : "offline";

  const openStatusDialog = useCallback(() => {
    setActionError("");
    setIsStatusDialogOpen(true);
  }, []);

  const closeStatusDialog = useCallback(() => {
    if (isUpdatingStatus) {
      return;
    }
    setIsStatusDialogOpen(false);
    setActionError("");
  }, [isUpdatingStatus]);

  const handleUpdateApplicationStatus = useCallback(async () => {
    if (!application) {
      return;
    }

    setIsUpdatingStatus(true);
    setActionError("");

    try {
      const payload = await updateApplicationStatus(application.slug, nextStatus);
      onUpdated(payload);
      setIsStatusDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: applicationsRootQueryKey });
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : `${statusActionLabel}应用失败，请稍后重试`,
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  }, [application, nextStatus, onUpdated, queryClient, statusActionLabel]);

  return {
    actionError,
    closeStatusDialog,
    handleUpdateApplicationStatus,
    isStatusDialogOpen,
    isUpdatingStatus,
    nextStatus,
    openStatusDialog,
    statusActionLabel,
  };
}

export function useApplicationMembers(
  applicationSlug: string,
  canManageMembers: boolean,
  members: ApplicationMemberRecord[],
  updateMembers: (members: ApplicationMemberRecord[]) => void,
  refreshApplicationDetail: () => Promise<void>,
) {
  const [memberActionError, setMemberActionError] = useState("");
  const [isMutatingMember, setIsMutatingMember] = useState(false);
  const [roleChangeTarget, setRoleChangeTarget] = useState<{
    member: ApplicationMemberRecord;
    role: ApplicationMemberRecord["role"];
  } | null>(null);
  const [deleteMemberTarget, setDeleteMemberTarget] = useState<ApplicationMemberRecord | null>(
    null,
  );
  const {
    control: memberFormControl,
    formState: { errors: memberFormErrors },
    handleSubmit: handleSubmitMemberForm,
    reset: resetMemberForm,
    setValue: setMemberFormValue,
    watch: watchMemberForm,
  } = useForm<ApplicationMemberFormState>({
    defaultValues: {
      memberName: "",
      role: "Developer",
      userId: "",
    },
  });
  const selectedMemberUserId = watchMemberForm("userId");

  const handleAddMember = handleSubmitMemberForm(async (form) => {
    if (!canManageMembers) {
      return;
    }
    setIsMutatingMember(true);
    setMemberActionError("");

    try {
      const member = await upsertApplicationMember(applicationSlug, {
        role: form.role,
        userId: form.userId,
      });
      updateMembers(upsertMemberInList(members, member));
      resetMemberForm({ memberName: "", role: "Developer", userId: "" });
      await refreshApplicationDetail();
    } catch (error) {
      setMemberActionError(error instanceof Error ? error.message : "添加成员失败，请稍后重试");
    } finally {
      setIsMutatingMember(false);
    }
  });

  const handleConfirmRoleChange = async () => {
    if (!roleChangeTarget) {
      return;
    }
    setIsMutatingMember(true);
    setMemberActionError("");

    try {
      const member = await updateApplicationMemberRole(
        applicationSlug,
        roleChangeTarget.member.userId,
        roleChangeTarget.role,
      );
      updateMembers(upsertMemberInList(members, member));
      setRoleChangeTarget(null);
      await refreshApplicationDetail();
    } catch (error) {
      setMemberActionError(error instanceof Error ? error.message : "修改成员角色失败，请稍后重试");
    } finally {
      setIsMutatingMember(false);
    }
  };

  const handleConfirmDeleteMember = async () => {
    if (!deleteMemberTarget) {
      return;
    }
    setIsMutatingMember(true);
    setMemberActionError("");

    try {
      await deleteApplicationMember(applicationSlug, deleteMemberTarget.userId);
      updateMembers(members.filter((member) => member.userId !== deleteMemberTarget.userId));
      setDeleteMemberTarget(null);
      await refreshApplicationDetail();
    } catch (error) {
      setMemberActionError(error instanceof Error ? error.message : "移除成员失败，请稍后重试");
    } finally {
      setIsMutatingMember(false);
    }
  };

  return {
    deleteMemberTarget,
    handleAddMember,
    handleConfirmDeleteMember,
    handleConfirmRoleChange,
    isMutatingMember,
    memberFormControl,
    memberFormErrors,
    memberActionError,
    selectedMemberUserId,
    setDeleteMemberTarget,
    setMemberActionError,
    setMemberFormValue,
    setRoleChangeTarget,
    roleChangeTarget,
  };
}

/** 应用发布渠道的列表与增删改。target 为 null 时表单用于新建，否则编辑该渠道（code 不可改）。 */
export function useApplicationChannels(applicationSlug: string) {
  const queryClient = useQueryClient();
  const channelsQuery = useQuery({
    queryFn: () => fetchReleaseChannels(applicationSlug),
    queryKey: releaseChannelsQueryKey(applicationSlug),
  });
  const [formTarget, setFormTarget] = useState<ReleaseChannel | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<ReleaseChannel | null>(null);
  const [actionError, setActionError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const form = useForm<ReleaseChannelFormState>({
    defaultValues: { code: "", description: "", name: "" },
  });

  const openForm = (target: ReleaseChannel | null) => {
    setActionError("");
    form.reset({
      code: target?.code ?? "",
      description: target?.description ?? "",
      name: target?.name ?? "",
    });
    setFormTarget(target);
  };
  const closeForm = () => {
    setFormTarget(undefined);
    setActionError("");
  };
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: releaseChannelsQueryKey(applicationSlug) });

  const submitForm = form.handleSubmit(async (values) => {
    setActionError("");
    try {
      if (formTarget) {
        await updateReleaseChannel(applicationSlug, formTarget.code, {
          description: values.description.trim(),
          name: values.name.trim(),
        });
      } else {
        await createReleaseChannel(applicationSlug, {
          code: values.code.trim(),
          description: values.description.trim(),
          name: values.name.trim(),
        });
      }
      await refresh();
      setFormTarget(undefined);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "保存渠道失败，请稍后重试");
    }
  });

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    setActionError("");
    setIsDeleting(true);
    try {
      await deleteReleaseChannel(applicationSlug, deleteTarget.code);
      await refresh();
      setDeleteTarget(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "删除渠道失败，请稍后重试");
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    actionError,
    channels: channelsQuery.data ?? [],
    closeForm,
    confirmDelete,
    deleteTarget,
    form,
    formTarget,
    isDeleting,
    isLoading: channelsQuery.isLoading,
    loadError: channelsQuery.error,
    openForm,
    setActionError,
    setDeleteTarget,
    submitForm,
  };
}
