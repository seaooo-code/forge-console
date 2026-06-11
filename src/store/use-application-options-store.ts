import { create } from "zustand";

import type { ApplicationOptions } from "@/pages/applications/types";

type ApplicationOptionsStatus = "idle" | "loading" | "ready" | "error";

type ApplicationOptionsState = {
  error: string;
  options: ApplicationOptions | null;
  status: ApplicationOptionsStatus;
  setError: (error: string) => void;
  setLoading: () => void;
  setOptions: (options: ApplicationOptions) => void;
};

export const useApplicationOptionsStore = create<ApplicationOptionsState>((set) => ({
  error: "",
  options: null,
  status: "idle",
  setError: (error) => set({ error, status: "error" }),
  setLoading: () => set({ error: "", status: "loading" }),
  setOptions: (options) => set({ error: "", options, status: "ready" }),
}));
