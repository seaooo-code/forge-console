import { create } from "zustand";

export type Density = "comfortable" | "compact";
export type SidebarTheme = "dark" | "light";

type ConsoleStore = {
  activeNavId: string;
  environment: "prod" | "pre" | "test";
  project: "小米汽车";
  sidebarTheme: SidebarTheme;
  setDensity: (density: Density) => void;
  setActiveNavId: (id: string) => void;
  setEnvironment: (environment: "prod" | "pre" | "test") => void;
  toggleSidebarTheme: () => void;
  density: Density;
};

export const useConsoleStore = create<ConsoleStore>((set) => ({
  activeNavId: "dashboard",
  density: "comfortable",
  environment: "prod",
  project: "小米汽车",
  sidebarTheme: "light",
  setDensity: (density) => set({ density }),
  setActiveNavId: (activeNavId) => set({ activeNavId }),
  setEnvironment: (environment) => set({ environment }),
  toggleSidebarTheme: () =>
    set((state) => ({
      sidebarTheme: state.sidebarTheme === "dark" ? "light" : "dark",
    })),
}));
