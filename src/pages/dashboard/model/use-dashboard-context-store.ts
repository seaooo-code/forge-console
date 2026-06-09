import { create } from "zustand";

type DashboardEnvironment = "prod" | "pre" | "test";

type DashboardContextStore = {
  environment: DashboardEnvironment;
  project: "小米汽车";
  setEnvironment: (environment: DashboardEnvironment) => void;
};

export const useDashboardContextStore = create<DashboardContextStore>((set) => ({
  environment: "prod",
  project: "小米汽车",
  setEnvironment: (environment) => set({ environment }),
}));
