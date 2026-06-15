import { lazy } from "react";

import type { PageRouteConfig } from "@/types/page-route";

import type { ModulesSnapshot } from "./types";

const ModulesPage = lazy(async () => ({
  default: (await import("./ModulesPage")).ModulesPage,
}));

const emptyModulesSnapshot: ModulesSnapshot = {
  modules: [],
};

export function getModulesRouteConfig(path: string): PageRouteConfig | null {
  if (path !== "/modules") {
    return null;
  }

  return {
    emptyData: emptyModulesSnapshot,
    queryFn: async () => (await import("./api/modules-snapshot")).fetchModulesSnapshot(),
    queryKey: ["modules-snapshot"],
    render: (snapshot) => <ModulesPage snapshot={snapshot as ModulesSnapshot} />,
  };
}
