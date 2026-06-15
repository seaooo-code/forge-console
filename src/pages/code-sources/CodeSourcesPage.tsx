import { useQuery } from "@tanstack/react-query";
import { GitFork, type LucideIcon, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { codeSourcesSnapshotQueryKey, fetchCodeSourcesSnapshot } from "./api/code-sources-snapshot";
import { providerToneClass, statusClass, statusLabel } from "./constants";
import type { CodeSourceApp, CodeSourceProvider } from "./types";

const providerIcons: Record<CodeSourceProvider, LucideIcon> = {
  github: GitFork,
};

export function CodeSourcesPage() {
  const { data: snapshot } = useQuery({
    queryFn: fetchCodeSourcesSnapshot,
    queryKey: codeSourcesSnapshotQueryKey,
  });
  const [apps, setApps] = useState<CodeSourceApp[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (snapshot) {
      setApps(snapshot.apps);
    }
  }, [snapshot]);

  const updateAppStatus = (targetApp: CodeSourceApp) => {
    const nextStatus = targetApp.status === "installed" ? "notInstalled" : "installed";

    setApps((currentApps) =>
      currentApps.map((app) =>
        app.id === targetApp.id
          ? {
              ...app,
              installedAt: nextStatus === "installed" ? "刚刚" : undefined,
              status: nextStatus,
            }
          : app,
      ),
    );
    setMessage(
      nextStatus === "installed"
        ? `${targetApp.name} 已安装，后续可在仓库绑定时使用。`
        : `${targetApp.name} 已删除，相关仓库授权将不可用。`,
    );
  };

  if (!snapshot) {
    return <CodeSourcesPageLoading />;
  }

  return (
    <>
      <div className="border-slate-200 border-b bg-white px-6 py-5">
        <div>
          <div className="text-slate-500 text-xs">平台 / 代码源管理</div>
          <h1 className="mt-2 font-semibold text-2xl text-slate-950 tracking-tight">代码源管理</h1>
          <p className="mt-2 text-slate-600 text-sm">
            安装或删除 GitHub App，用于后续仓库授权和绑定
          </p>
        </div>
      </div>

      <div className="space-y-4 px-6 py-5">
        {message ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-blue-700 text-sm">
            {message}
          </div>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-2">
          {apps.map((app) => (
            <CodeSourceAppCard key={app.id} app={app} onToggleStatus={updateAppStatus} />
          ))}
        </section>
      </div>
    </>
  );
}

function CodeSourcesPageLoading() {
  return (
    <>
      <div className="border-slate-200 border-b bg-white px-6 py-5">
        <div className="h-16 max-w-xl animate-pulse rounded-lg bg-slate-100" />
      </div>
      <div className="grid gap-4 px-6 py-5 xl:grid-cols-2">
        {["github"].map((item) => (
          <Card key={item} className="h-42 animate-pulse rounded-lg bg-white shadow-none" />
        ))}
      </div>
    </>
  );
}

function CodeSourceAppCard({
  app,
  onToggleStatus,
}: {
  app: CodeSourceApp;
  onToggleStatus: (app: CodeSourceApp) => void;
}) {
  const Icon = providerIcons[app.provider];
  const isInstalled = app.status === "installed";

  return (
    <Card className="rounded-lg border-slate-200 bg-white p-5 shadow-none">
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-lg",
                providerToneClass[app.provider],
              )}
            >
              <Icon className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold text-slate-950 text-base">{app.name}</h2>
                <Badge variant="outline" className={statusClass[app.status]}>
                  {statusLabel[app.status]}
                </Badge>
              </div>
              <p className="mt-2 max-w-xl text-slate-600 text-sm leading-6">{app.description}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-slate-100 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-slate-500 text-sm">
            {isInstalled ? `安装时间：${app.installedAt}` : "尚未安装"}
          </div>
          <Button
            type="button"
            variant={isInstalled ? "destructive" : "default"}
            className={cn(!isInstalled && "bg-blue-600 hover:bg-blue-700")}
            onClick={() => onToggleStatus(app)}
          >
            {isInstalled ? <Trash2 className="size-4" /> : null}
            {isInstalled ? "删除 App" : "安装 App"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
