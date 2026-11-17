import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, RotateCw } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Drawer } from "@/components/common/Drawer";
import { EmptyState } from "@/components/common/StateBlock";
import { ErrorMessage, ListHeader, SummaryStats } from "@/components/layout";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/use-auth-store";

import {
  accessTokensSnapshotQueryKey,
  createArtifactAccessToken,
  deleteArtifactAccessToken,
  fetchAccessTokensSnapshot,
  generateArtifactAccessToken,
  updateArtifactAccessTokenStatus,
} from "./api/access-tokens-snapshot";
import { AccessTokenRow } from "./components/AccessTokenRow";
import { CreateAccessTokenForm } from "./components/CreateAccessTokenForm";
import type { ArtifactAccessTokenRecord, ArtifactAccessTokenStatus } from "./types";
import { type AccessTokenFormState, buildCreateInput, defaultAccessTokenForm } from "./utils";

export function AccessTokensPage() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const canManageAccessTokens = Boolean(session?.capabilities.canManageAccessTokens);
  const {
    data: snapshot,
    error,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryFn: fetchAccessTokensSnapshot,
    queryKey: accessTokensSnapshotQueryKey,
  });
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm<AccessTokenFormState>({
    defaultValues: defaultAccessTokenForm,
  });
  const [deleteTarget, setDeleteTarget] = useState<ArtifactAccessTokenRecord | null>(null);
  const [disableTarget, setDisableTarget] = useState<ArtifactAccessTokenRecord | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [pendingStatusTokenId, setPendingStatusTokenId] = useState("");
  const [generatedToken, setGeneratedToken] = useState("");
  const [createdTokenDialog, setCreatedTokenDialog] = useState<{
    name: string;
    plainToken: string;
  } | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMessage("");
    setMessage("");
    setGeneratedToken("");
    try {
      const plainToken = await generateArtifactAccessToken();
      setGeneratedToken(plainToken);
      setMessage("令牌已生成，请确认名称和过期时间后保存。");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "生成产物访问令牌失败");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreate = async (form: AccessTokenFormState) => {
    if (!generatedToken) {
      setErrorMessage("请先生成令牌");
      return;
    }
    setIsCreating(true);
    setErrorMessage("");
    setMessage("");
    try {
      const input = buildCreateInput(form, generatedToken);
      const token = await createArtifactAccessToken(input);
      await queryClient.invalidateQueries({ queryKey: accessTokensSnapshotQueryKey });
      reset(defaultAccessTokenForm);
      setIsCreateOpen(false);
      setCreatedTokenDialog({ name: token.name, plainToken: generatedToken });
      setGeneratedToken("");
      setMessage(`产物访问令牌「${token.name}」已创建。`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "创建产物访问令牌失败");
    } finally {
      setIsCreating(false);
    }
  };

  const closeCreate = () => {
    setIsCreateOpen(false);
    setGeneratedToken("");
    setErrorMessage("");
    reset(defaultAccessTokenForm);
  };

  const handleStatusChange = async (
    token: ArtifactAccessTokenRecord,
    status: ArtifactAccessTokenStatus,
  ) => {
    setPendingStatusTokenId(token.id);
    setErrorMessage("");
    setMessage("");
    setGeneratedToken("");
    try {
      const updated = await updateArtifactAccessTokenStatus(token.id, status);
      await queryClient.invalidateQueries({ queryKey: accessTokensSnapshotQueryKey });
      setMessage(`产物访问令牌「${updated.name}」已${status === "active" ? "启用" : "停用"}。`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "更新产物访问令牌失败");
    } finally {
      setPendingStatusTokenId("");
    }
  };

  const activeCount = snapshot?.tokens.filter((token) => token.status === "active").length ?? 0;

  return (
    <>
      <div className="flex flex-col gap-5">
        <ListHeader
          title="访问令牌"
          summary={
            <SummaryStats
              items={[
                { id: "total", label: "个令牌", value: snapshot ? snapshot.tokens.length : "-" },
                {
                  id: "active",
                  label: "个启用中",
                  tone: "success",
                  value: snapshot ? activeCount : "-",
                },
              ]}
            />
          }
          actions={
            <>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="刷新访问令牌"
                disabled={isFetching}
                onClick={() => void refetch()}
              >
                <RotateCw className={cn(isFetching && "animate-spin")} />
              </Button>
              <Button
                type="button"
                disabled={!canManageAccessTokens}
                onClick={() => {
                  setErrorMessage("");
                  setIsCreateOpen(true);
                }}
              >
                <Plus />
                新建令牌
              </Button>
            </>
          }
        />
        <p className="-mt-2 m-0 text-muted-foreground text-sm">
          客户端拉取产物 manifest 和调用后端下载接口时携带这些令牌。
        </p>

        {message ? <Alert variant="success">{message}</Alert> : null}
        {errorMessage && !isCreateOpen ? <Alert variant="danger">{errorMessage}</Alert> : null}

        {!snapshot ? (
          isError ? (
            <ErrorMessage error={error} onRetry={() => void refetch()} />
          ) : (
            <div className="h-64 animate-pulse rounded-xl bg-muted" />
          )
        ) : snapshot.tokens.length === 0 ? (
          <div className="rounded-xl bg-card p-10 shadow-edge">
            <EmptyState
              title="还没有访问令牌"
              description="新建一个令牌，供客户端拉取产物 manifest 时使用。"
            />
          </div>
        ) : (
          <section className="flex flex-col gap-1 rounded-xl bg-card p-1 shadow-edge">
            {snapshot.tokens.map((token) => (
              <AccessTokenRow
                key={token.id}
                token={token}
                canManageAccessTokens={canManageAccessTokens}
                isPending={pendingStatusTokenId === token.id}
                onDelete={(target) => setDeleteTarget(target)}
                onStatusChange={(target, status) =>
                  status === "disabled"
                    ? setDisableTarget(target)
                    : void handleStatusChange(target, status)
                }
              />
            ))}
          </section>
        )}
      </div>

      <Drawer isOpen={isCreateOpen} onClose={closeCreate}>
        {errorMessage ? (
          <div className="px-6 pt-5">
            <Alert variant="danger">{errorMessage}</Alert>
          </div>
        ) : null}
        <CreateAccessTokenForm
          canManageAccessTokens={canManageAccessTokens}
          control={control}
          errors={errors}
          generatedToken={generatedToken}
          isCreating={isCreating}
          isGenerating={isGenerating}
          onClose={closeCreate}
          onGenerate={() => void handleGenerate()}
          onSubmit={handleSubmit(handleCreate)}
        />
      </Drawer>

      <ConfirmDialog
        isOpen={disableTarget !== null}
        isPending={Boolean(disableTarget && pendingStatusTokenId === disableTarget.id)}
        title="停用访问令牌"
        description={
          disableTarget
            ? `停用「${disableTarget.name}」后，使用它的客户端会立即拉不到产物，之后可以重新启用。`
            : ""
        }
        confirmLabel="停用令牌"
        tone="danger"
        onCancel={() => setDisableTarget(null)}
        onConfirm={async () => {
          if (!disableTarget) {
            return;
          }
          await handleStatusChange(disableTarget, "disabled");
          setDisableTarget(null);
        }}
      />
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        isPending={isDeleting}
        title="删除访问令牌"
        description={deleteTarget ? `确认删除「${deleteTarget.name}」？删除后该令牌立即失效。` : ""}
        confirmLabel="删除令牌"
        tone="danger"
        onCancel={() => {
          if (isDeleting) {
            return;
          }
          setDeleteTarget(null);
        }}
        onConfirm={async () => {
          if (!deleteTarget) {
            return;
          }
          setIsDeleting(true);
          setErrorMessage("");
          setMessage("");
          setGeneratedToken("");
          try {
            await deleteArtifactAccessToken(deleteTarget.id);
            await queryClient.invalidateQueries({ queryKey: accessTokensSnapshotQueryKey });
            setMessage(`产物访问令牌「${deleteTarget.name}」已删除。`);
            setDeleteTarget(null);
          } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "删除产物访问令牌失败");
          } finally {
            setIsDeleting(false);
          }
        }}
      />
      <ConfirmDialog
        isOpen={createdTokenDialog !== null}
        title="复制访问令牌"
        description={
          createdTokenDialog
            ? `产物访问令牌「${createdTokenDialog.name}」已创建。明文令牌后续不会再次展示，请现在复制。`
            : ""
        }
        cancelLabel="关闭"
        confirmLabel="复制令牌"
        onCancel={() => setCreatedTokenDialog(null)}
        onConfirm={() => {
          if (!createdTokenDialog) {
            return;
          }
          void navigator.clipboard?.writeText(createdTokenDialog.plainToken);
          setCreatedTokenDialog(null);
        }}
      >
        {createdTokenDialog ? (
          <code className="block overflow-x-auto rounded-md bg-surface-2 px-3 py-2 font-mono text-foreground text-xs">
            {createdTokenDialog.plainToken}
          </code>
        ) : null}
      </ConfirmDialog>
    </>
  );
}
