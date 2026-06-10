import { useCallback, useEffect, useState } from "react";

import { Card } from "@/components/ui/card";
import { FeishuCallbackPage, LoginPage } from "@/pages/auth";
import { fetchAuthSession } from "@/pages/auth/api/feishu-auth";
import { useAuthStore } from "@/store/use-auth-store";

import { ConsoleLayout } from "./layouts/ConsoleLayout";

const loginPath = "/login";
const feishuCallbackPath = "/login/feishu/callback";

export function App() {
  const isSessionLoading = useAuthStore((state) => state.isSessionLoading);
  const session = useAuthStore((state) => state.session);
  const clearSession = useAuthStore((state) => state.clearSession);
  const setSession = useAuthStore((state) => state.setSession);
  const setSessionLoading = useAuthStore((state) => state.setSessionLoading);
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

  useEffect(() => {
    if (routePath === feishuCallbackPath || (session && !isAuthRoute(routePath))) {
      return;
    }

    let mounted = true;
    setSessionLoading(true);

    fetchAuthSession()
      .then((currentSession) => {
        if (!mounted) {
          return;
        }

        if (currentSession) {
          setSession(currentSession);
          return;
        }
        clearSession();
      })
      .catch(() => {
        if (!mounted) {
          return;
        }
        clearSession();
      });

    return () => {
      mounted = false;
    };
  }, [clearSession, routePath, session, setSession, setSessionLoading]);

  if (routePath === feishuCallbackPath) {
    return <FeishuCallbackPage onComplete={replaceRoute} />;
  }

  if (isSessionLoading) {
    return <SessionLoadingPage />;
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

function SessionLoadingPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6 text-slate-900">
      <Card className="h-24 w-full max-w-sm animate-pulse rounded-lg border-slate-200 bg-white shadow-sm" />
    </main>
  );
}
