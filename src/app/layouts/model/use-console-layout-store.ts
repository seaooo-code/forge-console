import { create } from "zustand";

export type Density = "comfortable" | "compact";

type ConsoleLayoutStore = {
  activeNavId: string;
  setDensity: (density: Density) => void;
  setActiveNavId: (id: string) => void;
  density: Density;
};

export const useConsoleLayoutStore = create<ConsoleLayoutStore>((set) => ({
  activeNavId: "dashboard",
  density: "comfortable",
  setDensity: (density) => set({ density }),
  setActiveNavId: (activeNavId) => set({ activeNavId }),
}));
