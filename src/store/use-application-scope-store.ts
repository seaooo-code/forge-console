import { create } from "zustand";

const STORAGE_KEY = "forge-console.current-application-id";

function readStoredApplicationId() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(STORAGE_KEY)?.trim() ?? "";
}

type ApplicationScopeStore = {
  applicationId: string;
  setApplicationId: (applicationId: string) => void;
};

export const useApplicationScopeStore = create<ApplicationScopeStore>((set) => ({
  applicationId: readStoredApplicationId(),
  setApplicationId: (applicationId) => {
    const normalizedApplicationId = applicationId.trim();

    if (typeof window !== "undefined") {
      if (normalizedApplicationId) {
        window.localStorage.setItem(STORAGE_KEY, normalizedApplicationId);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }

    set({ applicationId: normalizedApplicationId });
  },
}));
