import { ExternalLink, GitFork } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { providerToneClass } from "../constants";
import type { CodeSourceApp } from "../types";
import { formatDisplayTime } from "../utils";

export function GitHubAppCard({
  app,
  canManage,
  isOpening,
  onInstall,
}: {
  app: CodeSourceApp;
  canManage: boolean;
  isOpening: boolean;
  onInstall: (app: CodeSourceApp) => void;
}) {
  const isConfigured = app.configurationStatus === "configured";

  return (
    <Card className="rounded-xl bg-card p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg",
              providerToneClass.github,
            )}
          >
            <GitFork className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold text-base text-foreground">{app.name}</h2>
              <Badge variant={isConfigured ? "success" : "neutral"}>
                {isConfigured ? "App 已创建" : "App 未创建"}
              </Badge>
            </div>
            <p className="mt-1 max-w-2xl text-muted-foreground text-sm leading-6">
              {app.description}
            </p>
            <p className="mt-1 text-muted-foreground text-xs">
              已安装 {app.connectionCount} 个账号或组织
              {app.installedAt ? ` · 最近安装 ${formatDisplayTime(app.installedAt)}` : ""}
            </p>
          </div>
        </div>
        <Button
          type="button"
          className="shrink-0"
          disabled={!canManage || isOpening}
          onClick={() => onInstall(app)}
        >
          <ExternalLink className="size-4" />
          {isOpening
            ? "正在打开"
            : !isConfigured
              ? "创建 GitHub App"
              : app.connectionCount > 0
                ? "安装到其他账号"
                : "安装 App"}
        </Button>
      </div>
    </Card>
  );
}
