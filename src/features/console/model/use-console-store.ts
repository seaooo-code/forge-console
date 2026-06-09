import { create } from "zustand";

export type Density = "comfortable" | "compact";
type ThemeMode = "light" | "dark";

type ConsoleStore = {
  density: Density;
  editorValue: string;
  selectedPipelineId: string | null;
  theme: ThemeMode;
  setDensity: (density: Density) => void;
  setEditorValue: (value: string) => void;
  setSelectedPipelineId: (id: string) => void;
  toggleTheme: () => void;
};

export const useConsoleStore = create<ConsoleStore>((set) => ({
  density: "comfortable",
  editorValue: "{}",
  selectedPipelineId: null,
  theme: "light",
  setDensity: (density) => set({ density }),
  setEditorValue: (editorValue) => set({ editorValue }),
  setSelectedPipelineId: (selectedPipelineId) => set({ selectedPipelineId }),
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === "light" ? "dark" : "light",
    })),
}));
