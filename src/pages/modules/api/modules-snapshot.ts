import type { ModulesSnapshot } from "../types";

export const modulesSnapshotQueryKey = ["modules-snapshot"] as const;

const modulesSnapshot: ModulesSnapshot = {
  modules: [
    {
      defaultPipeline: "RN Standard Pipeline",
      id: "module-common",
      kind: "Common",
      name: "common",
      owner: "li.ming",
      productionVersion: "1.3.0",
      repository: "git@git.mi.com:mi-car-rn/common.git",
      status: "活跃",
    },
    {
      defaultPipeline: "RN Standard Pipeline",
      id: "module-home",
      kind: "Feature",
      name: "home",
      owner: "wang.fang",
      productionVersion: "2.5.1",
      repository: "git@git.mi.com:mi-car-rn/home.git",
      status: "活跃",
    },
    {
      defaultPipeline: "Vehicle Pipeline",
      id: "module-vehicle",
      kind: "Feature",
      name: "vehicle",
      owner: "zhao.lei",
      productionVersion: "4.8.2",
      repository: "git@git.mi.com:mi-car-rn/vehicle.git",
      status: "活跃",
    },
    {
      defaultPipeline: "AI Pipeline",
      id: "module-ai",
      kind: "Feature",
      name: "ai-assistant",
      owner: "chen.hao",
      productionVersion: "1.9.0",
      repository: "git@git.mi.com:mi-car-rn/ai-assistant.git",
      status: "活跃",
    },
    {
      defaultPipeline: "RN Standard Pipeline",
      id: "module-message",
      kind: "Feature",
      name: "message",
      owner: "sun.yu",
      productionVersion: "3.2.4",
      repository: "git@git.mi.com:mi-car-rn/message.git",
      status: "活跃",
    },
    {
      defaultPipeline: "RN Standard Pipeline",
      id: "module-payment",
      kind: "Feature",
      name: "payment",
      owner: "liu.qi",
      productionVersion: "0.8.4",
      repository: "git@git.mi.com:mi-car-rn/payment.git",
      status: "冻结",
    },
    {
      defaultPipeline: "Vehicle Pipeline",
      id: "module-navigation",
      kind: "Feature",
      name: "navigation",
      owner: "zhou.xin",
      productionVersion: "2.1.6",
      repository: "git@git.mi.com:mi-car-rn/nav.git",
      status: "活跃",
    },
    {
      defaultPipeline: "RN Standard Pipeline",
      id: "module-media",
      kind: "Feature",
      name: "media-player",
      owner: "huang.tao",
      productionVersion: "1.4.2",
      repository: "git@git.mi.com:mi-car-rn/media.git",
      status: "活跃",
    },
    {
      defaultPipeline: "RN Standard Pipeline",
      id: "module-settings",
      kind: "Feature",
      name: "settings",
      owner: "li.ming",
      productionVersion: "1.0.9",
      repository: "git@git.mi.com:mi-car-rn/settings.git",
      status: "活跃",
    },
  ],
};

export async function fetchModulesSnapshot(): Promise<ModulesSnapshot> {
  await new Promise((resolve) => window.setTimeout(resolve, 120));

  return modulesSnapshot;
}
