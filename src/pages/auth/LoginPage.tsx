import { ArrowRight, ShieldCheck } from "lucide-react";

import { beginFeishuAuthorization } from "@/api/feishu-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { loginStats } from "./constants";

type LoginPageProps = {
  redirectPath: string;
};

export function LoginPage({ redirectPath }: LoginPageProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-6 py-8 lg:grid-cols-[1fr_400px]">
        <section className="min-w-0 space-y-8">
          <div className="space-y-4">
            <div className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-card px-3 font-semibold text-foreground text-sm">
              <span className="flex size-5 items-center justify-center rounded bg-primary text-[10px] text-primary-foreground">
                F
              </span>
              Forge Console
            </div>
            <div className="max-w-2xl space-y-3">
              <h1 className="font-semibold text-4xl text-foreground tracking-normal">
                RN Bundle 管理后台
              </h1>
              <p className="max-w-xl text-base text-muted-foreground leading-7">
                使用飞书身份进入应用、环境、Bundle、发布和灰度工作台。
              </p>
            </div>
          </div>

          <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
            {loginStats.map((item) => (
              <div
                className="rounded-lg border border-border bg-card px-4 py-3 shadow-xs"
                key={item.label}
              >
                <div className="text-muted-foreground text-xs">{item.label}</div>
                <div className="mt-2 font-semibold text-foreground text-xl">{item.value}</div>
              </div>
            ))}
          </div>
        </section>

        <Card className="rounded-lg border-border bg-card shadow-sm">
          <CardHeader>
            <div className="mb-3 flex size-10 items-center justify-center rounded-md bg-success/15 text-success">
              <ShieldCheck className="size-5" />
            </div>
            <CardTitle className="text-xl">飞书登录</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <Button
              className="h-11 w-full justify-between"
              onClick={() => beginFeishuAuthorization(redirectPath)}
              type="button"
            >
              <span>使用飞书账号登录</span>
              <ArrowRight className="size-4" />
            </Button>

            <div className="grid grid-cols-2 gap-3 rounded-md border border-border bg-muted px-3 py-3 text-xs">
              <div>
                <div className="text-muted-foreground">认证</div>
                <div className="mt-1 font-medium text-foreground">Feishu OAuth</div>
              </div>
              <div>
                <div className="text-muted-foreground">用户主键</div>
                <div className="mt-1 font-medium text-foreground">union_id</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
