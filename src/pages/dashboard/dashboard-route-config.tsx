import { lazy } from "react";

import type { PageRouteConfig } from "@/types/page-route";

import type { DashboardSnapshot } from "./types";

const DashboardPage = lazy(async () => ({
  default: (await import("./DashboardPage")).DashboardPage,
}));

const emptyDashboardSnapshot: DashboardSnapshot = {
  buildTrend: [],
  metrics: [],
  pipelineRates: [],
  releases: [],
  tasks: [],
  updatedAt: "",
};

export function getDashboardRouteConfig(path: string): PageRouteConfig | null {
  if (path !== "/") {
    return null;
  }

  return {
    emptyData: emptyDashboardSnapshot,
    queryFn: async () => (await import("./api/dashboard-snapshot")).fetchDashboardSnapshot(),
    queryKey: ["dashboard-snapshot"],
    render: (snapshot) => <DashboardPage snapshot={snapshot as DashboardSnapshot} />,
  };
}
