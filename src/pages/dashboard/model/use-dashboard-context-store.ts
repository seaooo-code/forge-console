import { create } from "zustand";

import type { MiCarEnvironmentCode } from "@/types/environments";

type DashboardEnvironment = MiCarEnvironmentCode;

type DashboardContextStore = {
  environment: DashboardEnvironment;
  project: "小米汽车";
  setEnvironment: (environment: DashboardEnvironment) => void;
};

export const useDashboardContextStore = create<DashboardContextStore>((set) => ({
  environment: "product",
  project: "小米汽车",
  setEnvironment: (environment) => set({ environment }),
}));
