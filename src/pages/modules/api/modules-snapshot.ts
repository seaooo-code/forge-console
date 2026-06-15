import { moduleApplicationOptions } from "../constants";
import type { ModuleMutationInput, ModuleRecord, ModulesSnapshot } from "../types";

export const modulesSnapshotQueryKey = ["modules-snapshot"] as const;

export const moduleEditQueryKey = (moduleId: string | undefined) => [
  ...modulesSnapshotQueryKey,
  "edit",
  moduleId ?? "none",
];

const modulesSnapshot: ModulesSnapshot = {
  modules: [
    {
      applicationId: "mi-car",
      applicationName: "小米汽车 App",
      id: "module-common",
      kind: "Common",
      name: "common",
      owner: "li.ming",
      repository: "git@git.mi.com:mi-car-rn/common.git",
      status: "活跃",
    },
    {
      applicationId: "mi-car",
      applicationName: "小米汽车 App",
      id: "module-home",
      kind: "Feature",
      name: "home",
      owner: "wang.fang",
      repository: "git@git.mi.com:mi-car-rn/home.git",
      status: "活跃",
    },
    {
      applicationId: "cockpit",
      applicationName: "车机端应用",
      id: "module-vehicle",
      kind: "Feature",
      name: "vehicle",
      owner: "zhao.lei",
      repository: "git@git.mi.com:mi-car-rn/vehicle.git",
      status: "活跃",
    },
    {
      applicationId: "cockpit",
      applicationName: "车机端应用",
      id: "module-ai",
      kind: "Feature",
      name: "ai-assistant",
      owner: "chen.hao",
      repository: "git@git.mi.com:mi-car-rn/ai-assistant.git",
      status: "活跃",
    },
    {
      applicationId: "mi-car",
      applicationName: "小米汽车 App",
      id: "module-message",
      kind: "Feature",
      name: "message",
      owner: "sun.yu",
      repository: "git@git.mi.com:mi-car-rn/message.git",
      status: "活跃",
    },
    {
      applicationId: "mi-car",
      applicationName: "小米汽车 App",
      id: "module-payment",
      kind: "Feature",
      name: "payment",
      owner: "liu.qi",
      repository: "git@git.mi.com:mi-car-rn/payment.git",
      status: "冻结",
    },
    {
      applicationId: "cockpit",
      applicationName: "车机端应用",
      id: "module-navigation",
      kind: "Feature",
      name: "navigation",
      owner: "zhou.xin",
      repository: "git@git.mi.com:mi-car-rn/nav.git",
      status: "活跃",
    },
    {
      applicationId: "cockpit",
      applicationName: "车机端应用",
      id: "module-media",
      kind: "Feature",
      name: "media-player",
      owner: "huang.tao",
      repository: "git@git.mi.com:mi-car-rn/media.git",
      status: "活跃",
    },
    {
      applicationId: "mi-car",
      applicationName: "小米汽车 App",
      id: "module-settings",
      kind: "Feature",
      name: "settings",
      owner: "li.ming",
      repository: "git@git.mi.com:mi-car-rn/settings.git",
      status: "活跃",
    },
  ],
};

export async function fetchModulesSnapshot(): Promise<ModulesSnapshot> {
  await new Promise((resolve) => window.setTimeout(resolve, 120));

  return modulesSnapshot;
}

export async function fetchModuleDetailSnapshot(moduleId: string): Promise<ModulesSnapshot> {
  await new Promise((resolve) => window.setTimeout(resolve, 120));
  const moduleRecord = modulesSnapshot.modules.find((item) => item.id === moduleId);

  return {
    modules: moduleRecord ? [moduleRecord] : [],
  };
}

export async function createModule(input: ModuleMutationInput): Promise<ModuleRecord> {
  await new Promise((resolve) => window.setTimeout(resolve, 180));
  const existingModule = modulesSnapshot.modules.find((item) => item.id === input.id);

  if (existingModule) {
    throw new Error("Module already exists");
  }

  const moduleRecord: ModuleRecord = buildModuleRecord(input);
  modulesSnapshot.modules = [moduleRecord, ...modulesSnapshot.modules];

  return moduleRecord;
}

export async function updateModule(
  moduleId: string,
  input: ModuleMutationInput,
): Promise<ModuleRecord> {
  await new Promise((resolve) => window.setTimeout(resolve, 180));
  const moduleIndex = modulesSnapshot.modules.findIndex((item) => item.id === moduleId);

  if (moduleIndex < 0) {
    throw new Error("Module not found");
  }

  const moduleRecord: ModuleRecord = buildModuleRecord({ ...input, id: moduleId });
  modulesSnapshot.modules = modulesSnapshot.modules.map((item, index) =>
    index === moduleIndex ? moduleRecord : item,
  );

  return moduleRecord;
}

function buildModuleRecord(input: ModuleMutationInput): ModuleRecord {
  return {
    ...input,
    applicationName:
      moduleApplicationOptions.find((option) => option.value === input.applicationId)?.label ??
      input.applicationId,
  };
}
