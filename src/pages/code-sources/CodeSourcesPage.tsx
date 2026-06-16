import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, GitFork, type LucideIcon, Trash2 } from "lucide-react";
import { useState } from "react";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import {
  CodeSourceAPIError,
  codeSourcesSnapshotQueryKey,
  deleteCodeSourceInstallations,
  fetchCodeSourceAppManifest,
  fetchCodeSourceInstallURL,
  fetchCodeSourcesSnapshot,
} from "./api/code-sources-snapshot";
import { providerToneClass, statusClass, statusLabel } from "./constants";
import type { CodeSourceApp, CodeSourceProvider } from "./types";

const providerIcons: Record<CodeSourceProvider, LucideIcon> = {
  github: GitFork,
};

export function CodeSourcesPage() {
  const queryClient = useQueryClient();
  const {
    data: snapshot,
    error,
    isError,
    refetch,
  } = useQuery({
    queryFn: fetchCodeSourcesSnapshot,
    queryKey: codeSourcesSnapshotQueryKey,
  });
  const [deleteError, setDeleteError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CodeSourceApp | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [installingProvider, setInstallingProvider] = useState<CodeSourceProvider | null>(null);
  const [message, setMessage] = useState("");

  const requestInstall = async (app: CodeSourceApp) => {
    setInstallingProvider(app.provider);
    setErrorMessage("");
    setMessage("");
    try {
      if (app.configurationStatus === "notConfigured") {
        const manifest = await fetchCodeSourceAppManifest(app.provider);
        submitGitHubAppManifest(manifest.actionUrl, manifest.manifest);
        return;
      }

      const installURL = await fetchCodeSourceInstallURL(app.provider);
      window.location.assign(installURL.url);
    } catch (error) {
      if (
        error instanceof CodeSourceAPIError &&
        error.status === 503 &&
        error.payload?.error === "code source auth not configured"
      ) {
        try {
          const manifest = await fetchCodeSourceAppManifest(app.provider);
          submitGitHubAppManifest(manifest.actionUrl, manifest.manifest);
          return;
        } catch (manifestError) {
          setErrorMessage(
            manifestError instanceof Error
              ? manifestError.message
              : "创建 GitHub App 失败，请稍后重试",
          );
          setInstallingProvider(null);
          return;
        }
      }
      setErrorMessage(error instanceof Error ? error.message : "获取安装地址失败，请稍后重试");
      setInstallingProvider(null);
    }
  };

  if (!snapshot) {
    return isError ? (
      <CodeSourcesPageError
        message={error instanceof Error ? error.message : "读取代码源失败，请稍后重试"}
        onRetry={() => void refetch()}
      />
    ) : (
      <CodeSourcesPageLoading />
    );
  }

  return (
    <>
      <div className="border-slate-200 border-b bg-white px-6 py-5">
        <div>
          <div className="text-slate-500 text-xs">平台 / 代码源管理</div>
          <h1 className="mt-2 font-semibold text-2xl text-slate-950 tracking-tight">代码源管理</h1>
          <p className="mt-2 text-slate-600 text-sm">
            创建或移除 GitHub App 授权，用于后续仓库绑定
          </p>
        </div>
      </div>

      <div className="space-y-4 px-6 py-5">
        {message ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-blue-700 text-sm">
            {message}
          </div>
        ) : null}
        {errorMessage ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-600 text-sm">
            {errorMessage}
          </div>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-2">
          {snapshot.apps.map((app) => (
            <CodeSourceAppCard
              key={app.id}
              app={app}
              isInstalling={installingProvider === app.provider}
              onDeleteInstallations={(targetApp) => {
                setDeleteTarget(targetApp);
                setDeleteError("");
                setErrorMessage("");
                setMessage("");
              }}
              onInstall={requestInstall}
            />
          ))}
        </section>
      </div>
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        isPending={isDeleting}
        title="删除 GitHub 授权"
        description={
          deleteTarget
            ? `确认删除当前账号的「${deleteTarget.name}」安装授权和仓库缓存？GitHub 开发者后台里的 App 本体需要在 GitHub 侧手动删除。`
            : ""
        }
        confirmLabel="删除授权"
        tone="danger"
        onCancel={() => {
          if (isDeleting) {
            return;
          }
          setDeleteTarget(null);
          setDeleteError("");
        }}
        onConfirm={async () => {
          if (!deleteTarget) {
            return;
          }

          setIsDeleting(true);
          setDeleteError("");
          setMessage("");
          try {
            await deleteCodeSourceInstallations(deleteTarget.provider);
            await queryClient.invalidateQueries({ queryKey: codeSourcesSnapshotQueryKey });
            setMessage(`${deleteTarget.name} 当前账号授权和仓库缓存已删除。`);
            setDeleteTarget(null);
          } catch (error) {
            setDeleteError(error instanceof Error ? error.message : "删除授权失败，请稍后重试");
          } finally {
            setIsDeleting(false);
          }
        }}
      >
        {deleteError ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-rose-600 text-sm">
            {deleteError}
          </div>
        ) : null}
      </ConfirmDialog>
    </>
  );
}

function CodeSourcesPageError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <>
      <div className="border-slate-200 border-b bg-white px-6 py-5">
        <div>
          <div className="text-slate-500 text-xs">平台 / 代码源管理</div>
          <h1 className="mt-2 font-semibold text-2xl text-slate-950 tracking-tight">代码源管理</h1>
          <p className="mt-2 text-slate-600 text-sm">
            创建或移除 GitHub App 授权，用于后续仓库绑定
          </p>
        </div>
      </div>
      <div className="px-6 py-5">
        <Card className="rounded-lg border-rose-200 bg-rose-50 p-5 text-rose-700 shadow-none">
          <div className="font-medium text-sm">代码源接口不可用</div>
          <div className="mt-2 text-sm">{message}</div>
          <Button
            type="button"
            variant="outline"
            className="mt-4 border-rose-200 bg-white text-rose-700 hover:bg-rose-100"
            onClick={onRetry}
          >
            重试
          </Button>
        </Card>
      </div>
    </>
  );
}

function submitGitHubAppManifest(actionURL: string, manifest: string) {
  const form = document.createElement("form");
  form.action = actionURL;
  form.method = "post";

  const input = document.createElement("input");
  input.name = "manifest";
  input.type = "hidden";
  input.value = manifest;
  form.appendChild(input);

  document.body.appendChild(form);
  form.submit();
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
  isInstalling,
  onDeleteInstallations,
  onInstall,
}: {
  app: CodeSourceApp;
  isInstalling: boolean;
  onDeleteInstallations: (app: CodeSourceApp) => void;
  onInstall: (app: CodeSourceApp) => void;
}) {
  const Icon = providerIcons[app.provider];
  const isInstalled = app.status === "installed";
  const isConfigured = app.configurationStatus === "configured";

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
            {isInstalled && app.installedAt ? `安装时间：${app.installedAt}` : null}
            {isInstalled && !app.installedAt ? "已安装" : null}
            {!isInstalled ? "尚未安装" : null}
          </div>
          <Button
            type="button"
            variant={isInstalled ? "destructive" : "default"}
            className={cn(!isInstalled && "bg-blue-600 hover:bg-blue-700")}
            disabled={isInstalling}
            onClick={() => {
              if (isInstalled) {
                onDeleteInstallations(app);
                return;
              }
              onInstall(app);
            }}
          >
            {isInstalled ? <Trash2 className="size-4" /> : <ExternalLink className="size-4" />}
            {isInstalled
              ? "删除授权"
              : isInstalling
                ? "正在打开"
                : isConfigured
                  ? "安装 App"
                  : "创建 GitHub App"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
