import { create } from "zustand";

export type Density = "comfortable" | "compact";
export type SidebarTheme = "dark" | "light";

type ConsoleLayoutStore = {
  activeNavId: string;
  sidebarTheme: SidebarTheme;
  setDensity: (density: Density) => void;
  setActiveNavId: (id: string) => void;
  toggleSidebarTheme: () => void;
  density: Density;
};

export const useConsoleLayoutStore = create<ConsoleLayoutStore>((set) => ({
  activeNavId: "dashboard",
  density: "comfortable",
  sidebarTheme: "light",
  setDensity: (density) => set({ density }),
  setActiveNavId: (activeNavId) => set({ activeNavId }),
  toggleSidebarTheme: () =>
    set((state) => ({
      sidebarTheme: state.sidebarTheme === "dark" ? "light" : "dark",
    })),
}));
