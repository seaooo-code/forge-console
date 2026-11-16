import type { APISchemas } from "@/api/client";
import type { ModuleKind } from "@/types/modules";

export type {
  ModuleApplicationOption,
  ModuleBuildConfig,
  ModuleKind,
  ModuleListFilters,
  ModuleListRequest,
  ModuleMutationInput,
  ModuleRecord,
  ModuleRepositoryBinding,
  ModuleSummary,
  ModulesSnapshot,
} from "@/types/modules";

export type CodeSourceConnection = APISchemas["CodeSourceConnection"];

export type CodeSourceProvider = CodeSourceConnection["provider"];

export type CodeSourceRepository = APISchemas["CodeSourceRepository"];

export type CodeSourceConnectionWebhook = APISchemas["CodeSourceConnectionWebhook"];

export type ModuleBuildVariable = APISchemas["BuildVariable"];

export type ModuleBuildVariableInput = APISchemas["BuildVariableUpsertRequest"];

/** 表单里已选中的仓库，编辑模式由模块记录回填，新建模式来自连接仓库搜索结果。 */
export type ModuleRepositorySelection = Pick<
  CodeSourceRepository,
  "connectionId" | "defaultBranch" | "externalRepositoryId" | "fullName" | "webUrl"
>;

export type ModuleBuildConfigFormState = {
  autoBuildBranches: Array<{ value: string }>;
  autoBuildEnvironment: string;
  autoPreviewRelease: boolean;
  autoPreviewTtlHours: number;
  buildContext: string;
  dockerfilePath: string;
};

export type ModuleFormState = {
  applicationId: string;
  buildConfig: ModuleBuildConfigFormState;
  commonModuleId: string;
  connectionId: string;
  id: string;
  kind: ModuleKind;
  name: string;
  owner: string;
  ownerAvatarUrl: string;
  ownerDepartmentIds: string[];
  ownerEmail: string;
  ownerFeishuOpenId: string;
  ownerFeishuUnionId: string;
  ownerFeishuUserId: string;
  ownerUserId: string;
  repository: ModuleRepositorySelection | null;
};

export type ModuleBuildFormState = {
  branch: string;
  environment: string;
};

export type BuildVariableFormState = {
  environmentCode: string;
  isSecret: boolean;
  key: string;
  value: string;
};
