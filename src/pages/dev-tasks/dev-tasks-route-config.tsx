import { lazy } from "react";

import type { PageRouteConfig } from "@/types/page-route";

import type { DevTasksSnapshot } from "./types";

const DevTasksPage = lazy(async () => ({
  default: (await import("./DevTasksPage")).DevTasksPage,
}));

const emptyDevTasksSnapshot: DevTasksSnapshot = {
  featuredTask: {
    id: "",
    members: [],
    pipelineRuns: [],
    relatedModules: [],
    title: "",
  },
  tasks: [],
};

export function getDevTasksRouteConfig(path: string): PageRouteConfig | null {
  if (path !== "/dev-tasks") {
    return null;
  }

  return {
    emptyData: emptyDevTasksSnapshot,
    queryFn: async () => (await import("./api/dev-tasks-snapshot")).fetchDevTasksSnapshot(),
    queryKey: ["dev-tasks-snapshot"],
    render: (snapshot) => <DevTasksPage snapshot={snapshot as DevTasksSnapshot} />,
  };
}
