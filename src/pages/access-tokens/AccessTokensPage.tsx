import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, Copy, KeyRound, Plus, RotateCw, ShieldCheck, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import {
  accessTokensSnapshotQueryKey,
  createArtifactAccessToken,
  deleteArtifactAccessToken,
  fetchAccessTokensSnapshot,
  generateArtifactAccessToken,
  updateArtifactAccessTokenStatus,
} from "./api/access-tokens-snapshot";
import type {
  ArtifactAccessTokenCreateInput,
  ArtifactAccessTokenRecord,
  ArtifactAccessTokenStatus,
} from "./types";

type AccessTokenFormState = {
  expiresAt: string;
  name: string;
};

const defaultForm: AccessTokenFormState = {
  expiresAt: "",
  name: "",
};

export function AccessTokensPage() {
  const queryClient = useQueryClient();
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
    defaultValues: defaultForm,
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
      reset(defaultForm);
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
      <div className="border-slate-200 border-b bg-white px-6 py-5">
        <div>
          <div className="text-slate-500 text-xs">平台 / 访问令牌</div>
          <h1 className="mt-2 font-semibold text-2xl text-slate-950 tracking-tight">访问令牌</h1>
          <p className="mt-2 text-slate-600 text-sm">管理产物 manifest 与后端下载接口访问凭据</p>
        </div>
      </div>

      <div className="grid gap-4 px-6 py-5 xl:grid-cols-[minmax(0,1fr)_23rem]">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-slate-200 border-b px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                <KeyRound className="size-4" />
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-slate-900 text-sm">产物访问令牌</h2>
                <p className="text-slate-500 text-xs">共 {snapshot.tokens.length} 条令牌</p>
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
            <div className="border-blue-200 border-b bg-blue-50 px-4 py-3 text-blue-700 text-sm">
              {message}
            </div>
          ) : null}
          {errorMessage ? (
            <div className="border-rose-200 border-b bg-rose-50 px-4 py-3 text-rose-600 text-sm">
              {errorMessage}
            </div>
          ) : null}

          {snapshot.tokens.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <div className="mx-auto flex size-10 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                <KeyRound className="size-5" />
              </div>
              <div className="mt-3 font-medium text-slate-900 text-sm">暂无产物访问令牌</div>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {snapshot.tokens.map((token) => (
                <AccessTokenRow
                  key={token.id}
                  token={token}
                  isPending={pendingStatusTokenId === token.id}
                  onDelete={(target) => setDeleteTarget(target)}
                  onStatusChange={(target, status) => void handleStatusChange(target, status)}
                />
              ))}
            </div>
          )}
        </section>

        <Card className="h-fit rounded-lg border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
              <Plus className="size-4" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 text-sm">新增令牌</h2>
              <p className="text-slate-500 text-xs">先生成明文令牌，再保存访问配置</p>
            </div>
          </div>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit(handleCreate)}>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-slate-800 text-xs">明文令牌</div>
                  <div className="mt-1 text-slate-500 text-xs">
                    服务端生成，保存后只在弹窗中再次提示复制
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isGenerating || isCreating}
                  onClick={() => void handleGenerate()}
                >
                  <KeyRound className="size-4" />
                  {isGenerating ? "生成中" : "生成令牌"}
                </Button>
              </div>
              {generatedToken ? (
                <div className="mt-3 flex flex-col gap-2">
                  <code className="min-w-0 overflow-x-auto rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-slate-800 text-xs">
                    {generatedToken}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    onClick={() => void navigator.clipboard?.writeText(generatedToken)}
                  >
                    <Copy className="size-4" />
                    复制
                  </Button>
                </div>
              ) : null}
            </div>
            <Controller
              control={control}
              name="name"
              rules={{ required: "请输入令牌名称" }}
              render={({ field }) => (
                <Field id="access-token-name" label="名称" error={errors.name?.message}>
                  <Input {...field} id="access-token-name" placeholder="Bundle 客户端" />
                </Field>
              )}
            />
            <Controller
              control={control}
              name="expiresAt"
              render={({ field }) => (
                <Field
                  id="access-token-expires-at"
                  label="过期时间"
                  error={errors.expiresAt?.message}
                >
                  <Input {...field} id="access-token-expires-at" type="datetime-local" />
                </Field>
              )}
            />
            <Button
              type="submit"
              disabled={isCreating || !generatedToken}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="size-4" />
              {isCreating ? "创建中" : "保存令牌"}
            </Button>
          </form>
        </Card>
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
          <code className="block overflow-x-auto rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-slate-800 text-xs">
            {createdTokenDialog.plainToken}
          </code>
        ) : null}
      </ConfirmDialog>
    </>
  );
}

function AccessTokenRow({
  isPending,
  onDelete,
  onStatusChange,
  token,
}: {
  isPending: boolean;
  onDelete: (token: ArtifactAccessTokenRecord) => void;
  onStatusChange: (token: ArtifactAccessTokenRecord, status: ArtifactAccessTokenStatus) => void;
  token: ArtifactAccessTokenRecord;
}) {
  const isDisabled = token.status === "disabled";
  const nextStatus: ArtifactAccessTokenStatus = isDisabled ? "active" : "disabled";
  const StatusIcon = isDisabled ? Ban : ShieldCheck;

  return (
    <div className="grid gap-3 px-4 py-4 md:grid-cols-2 2xl:grid-cols-[minmax(14rem,1.4fr)_minmax(5rem,0.6fr)_minmax(7rem,0.7fr)_minmax(6rem,0.65fr)_minmax(7rem,0.7fr)_auto] 2xl:items-center">
      <div className="min-w-0 md:col-span-2 2xl:col-span-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="min-w-0 flex-1 truncate font-semibold text-slate-950 text-sm">
            {token.name}
          </span>
          <TokenStatusBadge token={token} />
        </div>
        <div className="mt-1 truncate font-mono text-slate-500 text-xs">{token.tokenPreview}</div>
      </div>
      <TokenMeta label="创建人" value={token.createdBy || "-"} />
      <TokenMeta label="创建时间" value={formatDisplayTime(token.createdAt)} />
      <TokenMeta label="最近使用" value={formatDisplayTime(token.lastUsedAt)} />
      <TokenMeta label="过期时间" value={formatDisplayTime(token.expiresAt)} />
      <div className="flex items-center justify-start gap-1.5 md:col-span-2 2xl:col-span-1 2xl:justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => onStatusChange(token, nextStatus)}
        >
          <StatusIcon className="size-4" />
          {isDisabled ? "启用" : "停用"}
        </Button>
        <Button type="button" variant="outline" size="icon" onClick={() => onDelete(token)}>
          <Trash2 className="size-4 text-rose-600" />
        </Button>
      </div>
    </div>
  );
}

function TokenStatusBadge({ token }: { token: ArtifactAccessTokenRecord }) {
  if (isExpired(token.expiresAt)) {
    return (
      <Badge variant="warning" className="shrink-0 gap-1">
        已过期
      </Badge>
    );
  }

  if (token.status === "disabled") {
    return (
      <Badge variant="outline" className="shrink-0 border-slate-200 text-slate-600">
        已停用
      </Badge>
    );
  }

  return (
    <Badge variant="success" className="shrink-0 gap-1">
      <ShieldCheck className="size-3" />
      启用中
    </Badge>
  );
}

function TokenMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-slate-400 text-xs">{label}</div>
      <div className="mt-1 truncate text-slate-700 text-xs">{value}</div>
    </div>
  );
}

function Field({
  children,
  error,
  id,
  label,
}: {
  children: ReactNode;
  error?: string;
  id: string;
  label: string;
}) {
  return (
    <div className="block space-y-1.5">
      <label htmlFor={id} className="font-medium text-slate-700 text-xs">
        {label}
      </label>
      {children}
      {error ? <span className="text-rose-600 text-xs">{error}</span> : null}
    </div>
  );
}

function AccessTokensPageError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <>
      <div className="border-slate-200 border-b bg-white px-6 py-5">
        <div>
          <div className="text-slate-500 text-xs">平台 / 访问令牌</div>
          <h1 className="mt-2 font-semibold text-2xl text-slate-950 tracking-tight">访问令牌</h1>
          <p className="mt-2 text-slate-600 text-sm">管理产物 manifest 与后端下载接口访问凭据</p>
        </div>
      </div>
      <div className="px-6 py-5">
        <Card className="rounded-lg border-rose-200 bg-rose-50 p-5 text-rose-700 shadow-none">
          <div className="font-medium text-sm">访问令牌接口不可用</div>
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

function AccessTokensPageLoading() {
  return (
    <>
      <div className="border-slate-200 border-b bg-white px-6 py-5">
        <div>
          <div className="h-3 w-24 rounded bg-slate-100" />
          <div className="mt-3 h-7 w-32 rounded bg-slate-100" />
          <div className="mt-3 h-4 w-72 rounded bg-slate-100" />
        </div>
      </div>
      <div className="grid gap-4 px-6 py-5 xl:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="h-72 rounded-lg border border-slate-200 bg-white" />
        <div className="h-72 rounded-lg border border-slate-200 bg-white" />
      </div>
    </>
  );
}

function buildCreateInput(
  form: AccessTokenFormState,
  token: string,
): ArtifactAccessTokenCreateInput {
  const input: ArtifactAccessTokenCreateInput = {
    name: form.name.trim(),
    token,
  };
  if (form.expiresAt) {
    input.expiresAt = new Date(form.expiresAt).toISOString();
  }
  return input;
}

function isExpired(value: string) {
  if (!value) {
    return false;
  }
  const time = Date.parse(value);
  return Number.isFinite(time) && time <= Date.now();
}

function formatDisplayTime(value: string) {
  if (!value) {
    return "-";
  }
  const time = Date.parse(value);
  if (!Number.isFinite(time)) {
    return value;
  }
  return new Intl.DateTimeFormat("zh-CN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  }).format(new Date(time));
}
