import { lazy } from "react";

import type { PageRouteConfig } from "@/types/page-route";

import type { SettingsSnapshot } from "./types";

const SettingsPage = lazy(async () => ({
  default: (await import("./SettingsPage")).SettingsPage,
}));

const emptySettingsSnapshot: SettingsSnapshot = {
  cdnConfigs: [],
  members: [],
  navItems: [],
  notifications: [],
  permissions: [],
};

export function getSettingsRouteConfig(path: string): PageRouteConfig | null {
  if (path !== "/settings") {
    return null;
  }

  return {
    emptyData: emptySettingsSnapshot,
    queryFn: async () => (await import("./api/settings-snapshot")).fetchSettingsSnapshot(),
    queryKey: ["settings-snapshot"],
    render: (snapshot) => <SettingsPage snapshot={snapshot as SettingsSnapshot} />,
  };
}
