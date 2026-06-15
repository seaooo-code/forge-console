import { useEffect } from "react";

import { useApplicationOptionsStore } from "@/store/use-application-options-store";

export function useEnsureApplicationOptions() {
  const applicationOptionsStatus = useApplicationOptionsStore((state) => state.status);
  const setApplicationOptions = useApplicationOptionsStore((state) => state.setOptions);
  const setApplicationOptionsError = useApplicationOptionsStore((state) => state.setError);
  const setApplicationOptionsLoading = useApplicationOptionsStore((state) => state.setLoading);

  useEffect(() => {
    if (applicationOptionsStatus !== "idle") {
      return;
    }

    let disposed = false;
    const idleWindow = window as Window & {
      cancelIdleCallback?: (handle: number) => void;
      requestIdleCallback?: (callback: () => void) => number;
    };

    const loadOptions = () => {
      setApplicationOptionsLoading();
      void import("../api/applications-snapshot")
        .then(({ fetchApplicationOptions }) => fetchApplicationOptions())
        .then((options) => {
          if (!disposed) {
            setApplicationOptions(options);
          }
        })
        .catch(() => {
          if (!disposed) {
            setApplicationOptionsError("load application options failed");
          }
        });
    };

    const handle =
      idleWindow.requestIdleCallback?.(loadOptions) ?? window.setTimeout(loadOptions, 0);

    return () => {
      disposed = true;
      if (idleWindow.cancelIdleCallback && typeof handle === "number") {
        idleWindow.cancelIdleCallback(handle);
        return;
      }
      window.clearTimeout(handle);
    };
  }, [
    applicationOptionsStatus,
    setApplicationOptions,
    setApplicationOptionsError,
    setApplicationOptionsLoading,
  ]);
}
