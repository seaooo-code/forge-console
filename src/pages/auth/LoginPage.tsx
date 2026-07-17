import { ArrowRight, Fingerprint } from "lucide-react";

import { beginFeishuAuthorization } from "@/api/feishu-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type LoginPageProps = {
  redirectPath: string;
};

export function LoginPage({ redirectPath }: LoginPageProps) {
  return (
    <main className="min-h-screen bg-surface text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex h-12 items-center">
          <div className="inline-flex items-center gap-2 font-semibold text-foreground text-sm">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs">
              F
            </span>
            <span>Forge Console</span>
          </div>
        </header>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(360px,420px)] lg:py-14">
          <section className="order-2 min-w-0 lg:order-1">
            <div className="max-w-2xl space-y-4">
              <p className="font-semibold text-primary text-sm">RN Bundle 管理后台</p>
              <h1 className="font-semibold text-5xl text-foreground tracking-normal sm:text-6xl">
                Forge Console
              </h1>
              <p className="max-w-xl text-base text-muted-foreground leading-7">
                登录后进入 Forge Console 管理后台。
              </p>
            </div>

            <div className="mt-10 max-w-2xl overflow-hidden rounded-lg border border-border bg-card shadow-xs">
              <div className="flex h-11 items-center gap-2 border-border border-b bg-muted/60 px-4">
                <span className="size-2 rounded-full bg-destructive/70" />
                <span className="size-2 rounded-full bg-warning/80" />
                <span className="size-2 rounded-full bg-success/80" />
                <span className="ml-3 h-2 w-28 rounded-full bg-muted-foreground/15" />
              </div>
              <div className="grid gap-5 p-5 sm:grid-cols-[minmax(0,1fr)_160px]">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="h-3 w-36 rounded-full bg-primary/25" />
                    <div className="h-3 w-52 max-w-full rounded-full bg-muted" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="h-18 rounded-md border border-border bg-surface-2" />
                    <div className="h-18 rounded-md border border-border bg-accent/45" />
                    <div className="h-18 rounded-md border border-border bg-success/15" />
                  </div>
                  <div className="space-y-2 rounded-md border border-border bg-surface-2 p-3">
                    <div className="h-2 w-full rounded-full bg-muted-foreground/15" />
                    <div className="h-2 w-5/6 rounded-full bg-muted-foreground/15" />
                    <div className="h-2 w-2/3 rounded-full bg-muted-foreground/15" />
                  </div>
                </div>
                <div className="flex flex-col justify-between rounded-md border border-border bg-background p-4">
                  <div className="space-y-2">
                    <div className="h-2 w-20 rounded-full bg-info/35" />
                    <div className="h-2 w-28 rounded-full bg-muted" />
                    <div className="h-2 w-16 rounded-full bg-muted" />
                  </div>
                  <div className="mt-10 grid grid-cols-2 gap-2">
                    <div className="h-9 rounded-md bg-primary/15" />
                    <div className="h-9 rounded-md bg-success/20" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="order-1 min-w-0 lg:order-2">
            <Card className="rounded-lg border-border bg-card py-0 shadow-sm">
              <CardHeader className="px-6 pt-6">
                <div className="mb-4 flex size-11 items-center justify-center rounded-md bg-success/15 text-success">
                  <Fingerprint className="size-5" />
                </div>
                <CardTitle className="text-2xl">飞书登录</CardTitle>
                <CardDescription>使用飞书账号进入 Forge Console。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-6 pb-6">
                <Button
                  className="h-11 w-full justify-between"
                  onClick={() => beginFeishuAuthorization(redirectPath)}
                  type="button"
                >
                  <span>使用飞书账号登录</span>
                  <ArrowRight className="size-4" />
                </Button>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </main>
  );
}
