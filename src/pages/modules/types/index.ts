import type { APISchemas } from "@/api/client";
import type { BuildMode } from "@/types/build-adapters";
import type { ModuleKind } from "@/types/modules";

export type {
  BuildAdapter,
  BuildAdapterParameter,
  BuildAdapterRenderPreview,
  BuildMode,
} from "@/types/build-adapters";

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
  buildAdapterId: string;
  /** 适配器参数值，key 为参数定义里的 key；dockerfile 模式提交时清空。 */
  buildAdapterParams: Record<string, string>;
  buildContext: string;
  buildMode: BuildMode;
  /** gitlab_ci 模式：job artifacts 里产物根目录的相对路径，默认 dist。 */
  ciArtifactPath: string;
  /** gitlab_ci 模式：产出构建产物的 CI job 名。 */
  ciJob: string;
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
