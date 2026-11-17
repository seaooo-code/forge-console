import { useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, RotateCw } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
import {
  AccessTokensHeader,
  AccessTokensPageError,
  AccessTokensPageLoading,
} from "./components/AccessTokensStates";
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
      setCreatedTokenDialog({ name: token.name, plainToken: generatedToken });
      setGeneratedToken("");
      setMessage(`产物访问令牌「${token.name}」已创建。`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "创建产物访问令牌失败");
    } finally {
      setIsCreating(false);
    }
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

  if (!snapshot) {
    return isError ? (
      <AccessTokensPageError
        message={error instanceof Error ? error.message : "读取访问令牌失败，请稍后重试"}
        onRetry={() => void refetch()}
      />
    ) : (
      <AccessTokensPageLoading />
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <AccessTokensHeader />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_23rem]">
          <section className="overflow-hidden rounded-xl bg-card shadow-edge">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <KeyRound className="size-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-foreground text-sm">产物访问令牌</h2>
                  <p className="text-muted-foreground text-xs">
                    共 {snapshot.tokens.length} 条令牌
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void refetch()}
                className="gap-1.5"
              >
                <RotateCw className="size-4" />
                刷新
              </Button>
            </div>

            {message ? (
              <div className="px-4 py-3">
                <Alert variant="info">{message}</Alert>
              </div>
            ) : null}
            {errorMessage ? (
              <div className="px-4 py-3">
                <Alert variant="danger">{errorMessage}</Alert>
              </div>
            ) : null}

            {snapshot.tokens.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <div className="mx-auto flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <KeyRound className="size-5" />
                </div>
                <div className="mt-3 font-medium text-foreground text-sm">暂无产物访问令牌</div>
              </div>
            ) : (
              <div className="flex flex-col gap-1 p-1">
                {snapshot.tokens.map((token) => (
                  <AccessTokenRow
                    key={token.id}
                    token={token}
                    canManageAccessTokens={canManageAccessTokens}
                    isPending={pendingStatusTokenId === token.id}
                    onDelete={(target) => setDeleteTarget(target)}
                    onStatusChange={(target, status) => void handleStatusChange(target, status)}
                  />
                ))}
              </div>
            )}
          </section>

          <CreateAccessTokenForm
            canManageAccessTokens={canManageAccessTokens}
            control={control}
            errors={errors}
            generatedToken={generatedToken}
            isCreating={isCreating}
            isGenerating={isGenerating}
            onGenerate={() => void handleGenerate()}
            onSubmit={handleSubmit(handleCreate)}
          />
        </div>
      </div>

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
