import { AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

import { completeFeishuAuthorization, takeStoredAuthRedirectPath } from "@/api/feishu-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6 text-slate-900">
      <Card className="w-full max-w-md rounded-lg border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {error ? (
              <AlertTriangle className="size-5 text-amber-600" />
            ) : (
              <Loader2 className="size-5 animate-spin text-slate-500" />
            )}
            飞书登录
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-600 text-sm">{error || "正在校验授权结果并同步用户信息。"}</p>
          {error ? (
            <Button
              onClick={() => navigate("/login", { replace: true })}
              type="button"
              variant="outline"
            >
              返回登录页
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
