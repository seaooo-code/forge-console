import { useCallback, useEffect, useState } from "react";

import { FeishuCallbackPage, LoginPage } from "@/pages/auth";
import { useAuthStore } from "@/store/use-auth-store";

import { ConsoleLayout } from "./layouts/ConsoleLayout";

const loginPath = "/login";
const feishuCallbackPath = "/login/feishu/callback";

export function App() {
  const session = useAuthStore((state) => state.session);
  const [routePath, setRoutePath] = useState(getCurrentPath);

  useEffect(() => {
    const handlePopstate = () => setRoutePath(getCurrentPath());

    window.addEventListener("popstate", handlePopstate);

    return () => window.removeEventListener("popstate", handlePopstate);
  }, []);

  const replaceRoute = useCallback((path: string) => {
    const normalizedPath = normalizePath(path);
    window.history.replaceState(null, "", normalizedPath);
    setRoutePath(normalizedPath);
  }, []);

  useEffect(() => {
    if (session && isAuthRoute(routePath)) {
      replaceRoute("/");
    }
  }, [replaceRoute, routePath, session]);

  if (routePath === feishuCallbackPath) {
    return <FeishuCallbackPage onComplete={replaceRoute} />;
  }

  if (!session) {
    return <LoginPage redirectPath={isAuthRoute(routePath) ? "/" : routePath} />;
  }

  return <ConsoleLayout />;
}

function getCurrentPath() {
  return normalizePath(window.location.pathname);
}

function normalizePath(path: string) {
  if (path === "") {
    return "/";
  }

  return path.replace(/\/+$/, "") || "/";
}

function isAuthRoute(path: string) {
  return path === loginPath || path === feishuCallbackPath;
}
