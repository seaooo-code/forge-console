import { format, isValid, parseISO } from "date-fns";
import { Boxes, Layers3, Package } from "lucide-react";
import type { FeishuUserSearchResult } from "@/types/feishu";
import { updateModule } from "../api/modules-snapshot";
import {
  defaultForm,
  defaultModuleBuildConfig,
  maxAutoBuildBranches,
  maxAutoPreviewTtlHours,
} from "../constants";
import type {
  ModuleBuildConfig,
  ModuleFormState,
  ModuleMutationInput,
  ModuleRecord,
  ModulesSnapshot,
} from "../types";

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
  fallbackConnectionId = "",
): ModuleFormState {
  if (!moduleRecord) {
    return {
      ...defaultForm,
      applicationId: fallbackApplicationId,
      buildConfig: { ...defaultModuleBuildConfig, autoBuildBranches: [] },
      connectionId: fallbackConnectionId,
      ownerDepartmentIds: [],
    };
  }

  const { buildConfig } = moduleRecord;

  return {
    applicationId: moduleRecord.applicationId,
    buildConfig: {
      autoBuildBranches: (buildConfig.autoBuildBranches ?? []).map((value) => ({ value })),
      autoBuildEnvironment: buildConfig.autoBuildEnvironment ?? "",
      autoPreviewRelease: buildConfig.autoPreviewRelease ?? false,
      autoPreviewTtlHours:
        buildConfig.autoPreviewTtlHours || defaultModuleBuildConfig.autoPreviewTtlHours,
      buildContext: buildConfig.buildContext || defaultModuleBuildConfig.buildContext,
      dockerfilePath: buildConfig.dockerfilePath || defaultModuleBuildConfig.dockerfilePath,
    },
    commonModuleId: moduleRecord.commonModuleId ?? "",
    connectionId: moduleRecord.codeSourceConnectionId,
    id: moduleRecord.id,
    kind: moduleRecord.kind,
    name: moduleRecord.name,
    owner: moduleRecord.owner,
    ownerAvatarUrl: moduleRecord.ownerAvatarUrl ?? "",
    ownerDepartmentIds: [],
    ownerEmail: moduleRecord.ownerEmail ?? "",
    ownerFeishuOpenId: "",
    ownerFeishuUnionId: "",
    ownerFeishuUserId: "",
    ownerUserId: moduleRecord.ownerUserId,
    repository: {
      connectionId: moduleRecord.codeSourceConnectionId,
      defaultBranch: moduleRecord.defaultBranch,
      externalRepositoryId: moduleRecord.repositoryId,
      fullName: moduleRecord.repositoryFullName,
      webUrl: moduleRecord.repositoryWebUrl,
    },
  };
}

export function buildModuleInput(form: ModuleFormState): ModuleMutationInput {
  const { buildConfig } = form;
  const autoBuildBranches = [
    ...new Set(buildConfig.autoBuildBranches.map((branch) => branch.value.trim()).filter(Boolean)),
  ];

  return {
    applicationId: form.applicationId,
    buildConfig: {
      autoBuildBranches,
      autoBuildEnvironment: buildConfig.autoBuildEnvironment,
      autoPreviewRelease: buildConfig.autoPreviewRelease,
      autoPreviewTtlHours: Number(buildConfig.autoPreviewTtlHours),
      buildContext: buildConfig.buildContext.trim(),
      dockerfilePath: buildConfig.dockerfilePath.trim(),
    },
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
    repository: {
      connectionId: form.repository?.connectionId ?? "",
      externalRepositoryId: form.repository?.externalRepositoryId ?? "",
    },
  };
}

export function validateModuleInput(input: ModuleMutationInput) {
  if (!input.id) {
    return "请填写模块 ID";
  }

  if (/\s/.test(input.id)) {
    return "模块 ID 不能包含空格";
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

  if (!input.repository.connectionId) {
    return "请选择代码源连接";
  }

  if (!input.repository.externalRepositoryId) {
    return "请从搜索结果中选择仓库";
  }

  return validateBuildConfig(input.buildConfig ?? {});
}

function validateBuildConfig(config: ModuleBuildConfig) {
  const dockerfilePath = config.dockerfilePath ?? "";
  const buildContext = config.buildContext ?? "";

  if (!dockerfilePath) {
    return "请填写 Dockerfile 路径";
  }

  for (const [label, value] of [
    ["Dockerfile 路径", dockerfilePath],
    ["构建上下文", buildContext],
  ] as const) {
    if (
      value.length > 255 ||
      value.startsWith("/") ||
      value.includes("\\") ||
      value.split("/").includes("..")
    ) {
      return `${label}必须是仓库内的相对路径，不能以 / 开头或包含 ..`;
    }
  }

  const branches = config.autoBuildBranches ?? [];
  if (branches.length > maxAutoBuildBranches) {
    return `自动构建分支最多 ${maxAutoBuildBranches} 条`;
  }

  if (branches.some((branch) => !isBalancedGlob(branch))) {
    return "自动构建分支 glob 格式无效，请检查 [ ] 是否成对";
  }

  if (branches.length > 0 && !config.autoBuildEnvironment) {
    return "填写了自动构建分支时，请选择自动构建环境";
  }

  const ttl = config.autoPreviewTtlHours ?? 0;
  if (!Number.isInteger(ttl) || ttl < 1 || ttl > maxAutoPreviewTtlHours) {
    return `预览有效期需为 1 到 ${maxAutoPreviewTtlHours} 之间的整数小时`;
  }

  return "";
}

/** 后端用 Go path.Match 校验 glob，这里只拦截最常见的括号不成对问题，其余以后端为准。 */
function isBalancedGlob(pattern: string) {
  let inClass = false;
  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern[index];
    if (char === "\\") {
      index += 1;
    } else if (char === "[") {
      if (inClass) {
        return false;
      }
      inClass = true;
    } else if (char === "]" && inClass) {
      inClass = false;
    }
  }

  return !inClass && !pattern.endsWith("\\");
}

export function formatDateTime(value: string | undefined) {
  if (!value) {
    return "-";
  }

  const date = parseISO(value);
  return isValid(date) ? format(date, "yyyy-MM-dd HH:mm:ss") : value;
}

export function getOwnerUserId(user: FeishuUserSearchResult) {
  return user.id || user.openId || user.userId || user.unionId;
}
