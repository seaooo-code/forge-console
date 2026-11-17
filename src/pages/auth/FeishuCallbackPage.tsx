import { AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

import { completeFeishuAuthorization, takeStoredAuthRedirectPath } from "@/api/feishu-auth";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/use-auth-store";

export function FeishuCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);
  const [error, setError] = useState("");

  useEffect(() => {
    const denied = searchParams.get("error");
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (denied) {
      setError("飞书授权已取消");
      return;
    }
    if (!code || !state) {
      setError("飞书回调参数不完整");
      return;
    }

    let mounted = true;

    completeFeishuAuthorization(code, state)
      .then((session) => {
        if (!mounted) {
          return;
        }

        const redirectPath = takeStoredAuthRedirectPath();
        setSession(session);
        navigate(redirectPath, { replace: true });
      })
      .catch((caughtError: unknown) => {
        if (!mounted) {
          return;
        }

        setError(caughtError instanceof Error ? caughtError.message : "飞书登录失败");
      });

    return () => {
      mounted = false;
    };
  }, [navigate, searchParams, setSession]);

  return (
    <main className="flex min-h-screen bg-shell p-2 text-foreground">
      <div className="flex flex-1 items-center justify-center rounded-2xl bg-background shadow-edge">
        <div className="w-full max-w-sm rounded-2xl bg-card p-8 shadow-raise">
          <span
            className={
              error
                ? "flex size-9 items-center justify-center rounded-xl bg-destructive-soft text-destructive"
                : "flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground"
            }
          >
            {error ? (
              <AlertTriangle className="size-4.5" />
            ) : (
              <Loader2 className="size-4.5 animate-spin" />
            )}
          </span>
          <h1 className="m-0 mt-5 font-semibold text-xl tracking-tight">
            {error ? "登录没有完成" : "正在登录"}
          </h1>
          <p className="m-0 mt-2 text-muted-foreground text-sm leading-relaxed">
            {error || "正在校验飞书授权并同步你的账号信息。"}
          </p>
          {error ? (
            <Button
              className="mt-6 w-full"
              onClick={() => navigate("/login", { replace: true })}
              type="button"
              variant="outline"
            >
              返回登录页
            </Button>
          ) : null}
        </div>
      </div>
    </main>
  );
}
