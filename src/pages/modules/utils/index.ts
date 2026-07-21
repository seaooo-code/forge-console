import { Boxes, Layers3, Package } from "lucide-react";
import type { FeishuUserSearchResult } from "@/types/feishu";
import { updateModule } from "../api/modules-snapshot";
import { defaultForm } from "../constants";
import type { ModuleFormState, ModuleMutationInput, ModuleRecord, ModulesSnapshot } from "../types";

export function buildModuleStats(overviewSnapshot: ModulesSnapshot | undefined) {
  const summary = overviewSnapshot?.summary ?? {
    common: 0,
    feature: 0,
    total: 0,
  };

  return [
    {
      detail: "已接入真实仓库",
      icon: Boxes,
      iconClass: "bg-info/10 text-info",
      id: "total",
      label: "模块总数",
      tone: "info" as const,
      value: summary.total,
    },
    {
      detail: "依赖基础",
      icon: Layers3,
      iconClass: "bg-warning/10 text-warning",
      id: "common",
      label: "通用模块",
      tone: "warning" as const,
      value: summary.common,
    },
    {
      detail: "业务模块",
      icon: Package,
      iconClass: "bg-info/10 text-info",
      id: "feature",
      label: "功能模块",
      tone: "info" as const,
      value: summary.feature,
    },
  ];
}

export function formatCommonModule(module: ModuleRecord) {
  if (module.kind === "Common") {
    return "-";
  }

  return module.commonModuleName || module.commonModuleId || "-";
}

export async function updateExistingModule(
  moduleId: string | undefined,
  input: ModuleMutationInput,
) {
  if (!moduleId) {
    throw new Error("Module id is required");
  }

  return updateModule(moduleId, input);
}

export function buildInitialForm(
  moduleRecord?: ModuleRecord,
  fallbackApplicationId = "",
): ModuleFormState {
  if (!moduleRecord) {
    return {
      ...defaultForm,
      applicationId: fallbackApplicationId,
    };
  }

  return {
    applicationId: moduleRecord.applicationId,
    commonModuleId: moduleRecord.commonModuleId,
    id: moduleRecord.id,
    kind: moduleRecord.kind,
    name: moduleRecord.name,
    owner: moduleRecord.owner,
    ownerAvatarUrl: moduleRecord.ownerAvatarUrl,
    ownerDepartmentIds: [],
    ownerEmail: moduleRecord.ownerEmail,
    ownerFeishuOpenId: "",
    ownerFeishuUnionId: "",
    ownerFeishuUserId: "",
    ownerUserId: moduleRecord.ownerUserId,
    repository: {
      cloneUrl: moduleRecord.repositoryCloneUrl,
      defaultBranch: moduleRecord.defaultBranch,
      fullName: moduleRecord.repositoryFullName,
      htmlUrl: moduleRecord.repositoryHtmlUrl,
      id: moduleRecord.repositoryId,
      installationId: moduleRecord.repositoryInstallationId,
      provider: moduleRecord.repositoryProvider,
      sshUrl: moduleRecord.repositorySshUrl,
    },
    repositoryKeyword: moduleRecord.repositoryFullName,
  };
}

export function buildModuleInput(form: ModuleFormState): ModuleMutationInput {
  return {
    applicationId: form.applicationId,
    commonModuleId: form.kind === "Feature" ? form.commonModuleId.trim() : undefined,
    id: form.id.trim(),
    kind: form.kind,
    name: form.name.trim(),
    owner: form.owner.trim(),
    ownerAvatarUrl: form.ownerAvatarUrl.trim(),
    ownerDepartmentIds: form.ownerDepartmentIds,
    ownerEmail: form.ownerEmail.trim(),
    ownerFeishuOpenId: form.ownerFeishuOpenId.trim(),
    ownerFeishuUnionId: form.ownerFeishuUnionId.trim(),
    ownerFeishuUserId: form.ownerFeishuUserId.trim(),
    ownerUserId: form.ownerUserId.trim(),
    repository: form.repository ?? {
      cloneUrl: "",
      defaultBranch: "",
      fullName: "",
      htmlUrl: "",
      id: "",
      installationId: "",
      provider: "github",
      sshUrl: "",
    },
  };
}

export function validateModuleInput(input: ModuleMutationInput) {
  if (!input.id) {
    return "请填写模块 ID";
  }

  if (!input.name) {
    return "请填写模块名称";
  }

  if (!input.applicationId) {
    return "请选择关联应用";
  }

  if (input.kind === "Feature" && !input.commonModuleId) {
    return "请选择当前应用的通用模块";
  }

  if (!input.owner || !input.ownerUserId) {
    return "请从搜索结果中选择负责人";
  }

  if (!input.repository.id || !input.repository.installationId || !input.repository.fullName) {
    return "请选择已授权仓库";
  }

  if (/\s/.test(input.id)) {
    return "模块 ID 不能包含空格";
  }

  return "";
}

export function getOwnerUserId(user: FeishuUserSearchResult) {
  return user.id || user.openId || user.userId || user.unionId;
}
