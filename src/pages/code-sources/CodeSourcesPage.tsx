import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GitBranch, Plus, RotateCw } from "lucide-react";
import { useState } from "react";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ErrorState } from "@/components/common/StateBlock";
import { PageHeader } from "@/components/layout";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/store/use-auth-store";

import {
  CodeSourceAPIError,
  codeSourceConnectionsQueryKey,
  codeSourcesSnapshotQueryKey,
  createCodeSourceConnection,
  deleteCodeSourceConnection,
  fetchCodeSourceConnections,
  fetchCodeSourcesSnapshot,
  fetchGitHubAppManifest,
  fetchGitHubInstallURL,
  updateCodeSourceConnection,
  verifyCodeSourceConnection,
} from "./api/code-sources-snapshot";
import { CodeSourceConnectionRow } from "./components/CodeSourceConnectionRow";
import { GitHubAppCard } from "./components/GitHubAppCard";
import { GitLabConnectionDialog } from "./components/GitLabConnectionDialog";
import { credentialExpiryWarningDays } from "./constants";
import type {
  CodeSourceApp,
  CodeSourceConnection,
  CodeSourceConnectionAction,
  GitLabConnectionFormValues,
} from "./types";
import {
  buildGitLabCreatePayload,
  buildGitLabUpdatePayload,
  getCredentialExpiryLevel,
} from "./utils";

export function CodeSourcesPage() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const canManage = Boolean(session?.capabilities.canManageCodeSources);
  const appsQuery = useQuery({
    queryFn: fetchCodeSourcesSnapshot,
    queryKey: codeSourcesSnapshotQueryKey,
  });
  const connectionsQuery = useQuery({
    queryFn: fetchCodeSourceConnections,
    queryKey: codeSourceConnectionsQueryKey,
  });
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isOpeningGitHub, setIsOpeningGitHub] = useState(false);
  const [dialogConnection, setDialogConnection] = useState<CodeSourceConnection | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const [pending, setPending] = useState<{ action: CodeSourceConnectionAction; id: string } | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<CodeSourceConnection | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const connections = connectionsQuery.data ?? [];
  const expiringConnections = connections.filter(
    (connection) =>
      connection.status === "active" &&
      getCredentialExpiryLevel(connection.credentialExpiresAt) !== "none",
  );

  const clearFeedback = () => {
    setMessage("");
    setErrorMessage("");
  };

  const refreshAll = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: codeSourceConnectionsQueryKey }),
      queryClient.invalidateQueries({ queryKey: codeSourcesSnapshotQueryKey }),
    ]);

  const openGitHubManifest = async () => {
    const manifest = await fetchGitHubAppManifest();
    submitGitHubAppManifest(manifest.actionUrl, manifest.manifest);
  };

  const handleInstallGitHub = async (app: CodeSourceApp) => {
    setIsOpeningGitHub(true);
    clearFeedback();
    try {
      if (app.configurationStatus === "notConfigured") {
        await openGitHubManifest();
        return;
      }
      const installURL = await fetchGitHubInstallURL();
      window.location.assign(installURL.url);
    } catch (error) {
      // App 配置被清空时安装地址返回 503，回退到创建 App 流程。
      if (
        error instanceof CodeSourceAPIError &&
        error.status === 503 &&
        error.payload?.error === "code source auth not configured"
      ) {
        try {
          await openGitHubManifest();
          return;
        } catch (manifestError) {
          setErrorMessage(
            manifestError instanceof Error
              ? manifestError.message
              : "创建 GitHub App 失败，请稍后重试",
          );
          setIsOpeningGitHub(false);
          return;
        }
      }
      setErrorMessage(error instanceof Error ? error.message : "获取安装地址失败，请稍后重试");
      setIsOpeningGitHub(false);
    }
  };

  const openDialog = (connection: CodeSourceConnection | null) => {
    clearFeedback();
    setDialogError("");
    setDialogConnection(connection);
    setIsDialogOpen(true);
  };

  const handleDialogSubmit = async (values: GitLabConnectionFormValues) => {
    setDialogError("");
    try {
      if (dialogConnection) {
        const payload = buildGitLabUpdatePayload(values, dialogConnection);
        if (Object.keys(payload).length > 0) {
          const updated = await updateCodeSourceConnection(dialogConnection.id, payload);
          setMessage(`连接「${updated.name}」已更新。`);
        }
      } else {
        const created = await createCodeSourceConnection(buildGitLabCreatePayload(values));
        setMessage(
          `GitLab 连接「${created.name}」已创建并校验通过${created.externalAccount ? `，令牌所属账号 ${created.externalAccount}` : ""}。`,
        );
      }
      await refreshAll();
      setIsDialogOpen(false);
    } catch (error) {
      setDialogError(error instanceof Error ? error.message : "保存连接失败，请稍后重试");
    }
  };

  const runConnectionAction = async (
    connection: CodeSourceConnection,
    action: CodeSourceConnectionAction,
    request: () => Promise<string>,
  ) => {
    setPending({ action, id: connection.id });
    clearFeedback();
    try {
      setMessage(await request());
      await refreshAll();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "操作失败，请稍后重试");
    } finally {
      setPending(null);
    }
  };

  const handleVerify = (connection: CodeSourceConnection) =>
    void runConnectionAction(connection, "verify", async () => {
      const verified = await verifyCodeSourceConnection(connection.id);
      return `连接「${verified.name}」校验通过。`;
    });

  const handleToggleStatus = (connection: CodeSourceConnection) => {
    const nextStatus = connection.status === "active" ? "disabled" : "active";
    void runConnectionAction(connection, "status", async () => {
      const updated = await updateCodeSourceConnection(connection.id, { status: nextStatus });
      return `连接「${updated.name}」已${nextStatus === "active" ? "启用" : "停用"}。`;
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    setPending({ action: "delete", id: deleteTarget.id });
    setDeleteError("");
    try {
      await deleteCodeSourceConnection(deleteTarget.id);
      await refreshAll();
      setMessage(`连接「${deleteTarget.name}」已删除。`);
      setDeleteTarget(null);
    } catch (error) {
      setDeleteError(
        error instanceof CodeSourceAPIError && error.status === 409
          ? "仍有模块使用该连接，无法删除。请先调整这些模块的代码源，或改为停用该连接。"
          : error instanceof Error
            ? error.message
            : "删除连接失败，请稍后重试",
      );
    } finally {
      setPending(null);
    }
  };

  const isDeleting = pending?.action === "delete";
  const githubApp = appsQuery.data?.apps.find((app) => app.provider === "github");

  return (
    <>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="代码源管理"
          description="管理 GitHub 和 GitLab 代码源连接，模块通过连接选择仓库并拉取代码"
          actions={
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  void appsQuery.refetch();
                  void connectionsQuery.refetch();
                }}
              >
                <RotateCw className="size-4" />
                刷新
              </Button>
              <Button type="button" disabled={!canManage} onClick={() => openDialog(null)}>
                <Plus className="size-4" />
                新建 GitLab 连接
              </Button>
            </>
          }
        />

        {!canManage ? (
          <Alert variant="info">
            当前账号只能查看和使用代码源连接，创建、编辑、停用和删除需要平台管理员权限。
          </Alert>
        ) : null}
        {message ? <Alert variant="info">{message}</Alert> : null}
        {errorMessage ? <Alert variant="danger">{errorMessage}</Alert> : null}
        {expiringConnections.length > 0 ? (
          <Alert variant="warning">
            以下连接的凭证已过期或将在 {credentialExpiryWarningDays} 天内过期，请及时更换：
            {expiringConnections.map((connection) => connection.name).join("、")}
          </Alert>
        ) : null}

        {githubApp ? (
          <GitHubAppCard
            app={githubApp}
            canManage={canManage}
            isOpening={isOpeningGitHub}
            onInstall={(app) => void handleInstallGitHub(app)}
          />
        ) : appsQuery.isError ? (
          <ErrorState
            title="GitHub App 状态读取失败"
            message={appsQuery.error instanceof Error ? appsQuery.error.message : "请稍后重试"}
            onRetry={() => void appsQuery.refetch()}
          />
        ) : appsQuery.isPending ? (
          <Card className="h-24 animate-pulse rounded-xl bg-card" />
        ) : null}

        <section className="overflow-hidden rounded-xl bg-card shadow-edge">
          <div className="flex items-center gap-2 px-4 py-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <GitBranch className="size-4" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-foreground text-sm">代码源连接</h2>
              <p className="text-muted-foreground text-xs">
                {connectionsQuery.data ? `共 ${connections.length} 条连接` : "GitHub 与 GitLab"}
              </p>
            </div>
          </div>

          {connectionsQuery.isError && !connectionsQuery.data ? (
            <div className="p-4">
              <ErrorState
                title="代码源连接读取失败"
                message={
                  connectionsQuery.error instanceof Error
                    ? connectionsQuery.error.message
                    : "请稍后重试"
                }
                onRetry={() => void connectionsQuery.refetch()}
              />
            </div>
          ) : connectionsQuery.isPending ? (
            <div className="space-y-3 p-4">
              {["first", "second"].map((item) => (
                <div key={item} className="h-14 animate-pulse rounded-md bg-muted" />
              ))}
            </div>
          ) : connections.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <div className="mx-auto flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <GitBranch className="size-5" />
              </div>
              <div className="mt-3 font-medium text-foreground text-sm">暂无代码源连接</div>
              <p className="mt-1 text-muted-foreground text-xs">
                安装 GitHub App 或新建 GitLab 连接后，连接会显示在这里
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1 p-1">
              {connections.map((connection) => (
                <CodeSourceConnectionRow
                  key={connection.id}
                  canManage={canManage}
                  connection={connection}
                  pendingAction={pending?.id === connection.id ? pending.action : undefined}
                  onDelete={(target) => {
                    clearFeedback();
                    setDeleteError("");
                    setDeleteTarget(target);
                  }}
                  onEdit={openDialog}
                  onToggleStatus={handleToggleStatus}
                  onVerify={handleVerify}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <GitLabConnectionDialog
        connection={dialogConnection}
        isOpen={isDialogOpen}
        submitError={dialogError}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleDialogSubmit}
      />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        isPending={isDeleting}
        title="删除代码源连接"
        description={
          deleteTarget
            ? deleteTarget.provider === "github"
              ? `确认删除「${deleteTarget.name}」？GitHub 侧的 App 安装不会被移除，如需彻底解除请到 GitHub 设置中卸载。`
              : `确认删除「${deleteTarget.name}」？删除后无法恢复；仍有模块使用该连接时不能删除。`
            : ""
        }
        confirmLabel="删除连接"
        tone="danger"
        onCancel={() => {
          if (!isDeleting) {
            setDeleteTarget(null);
            setDeleteError("");
          }
        }}
        onConfirm={() => void handleDelete()}
      >
        {deleteError ? (
          <Alert variant="danger" className="px-3 py-2">
            {deleteError}
          </Alert>
        ) : null}
      </ConfirmDialog>
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
