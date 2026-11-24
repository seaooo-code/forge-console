import { KeyRound, Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { CopyableCode } from "@/components/common/CopyableCode";
import { SectionCard } from "@/components/layout";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

import { useApplicationSigning } from "../hooks";
import { formatMinuteTime } from "../utils";

/**
 * 应用的包签名。worker 用 active 密钥签名每个构建的文件列表，客户端内置公钥后校验，
 * 规则见 forge-server/docs/artifact-signing.md。
 */
export function ApplicationSigningSection({
  applicationSlug,
  canManage,
}: {
  applicationSlug: string;
  canManage: boolean;
}) {
  const {
    actionError,
    confirmDelete,
    confirmGenerate,
    deleteTarget,
    isGenerateOpen,
    isLoading,
    isMutating,
    loadError,
    setActionError,
    setDeleteTarget,
    setIsGenerateOpen,
    setRequireSignedReleases,
    signing,
  } = useApplicationSigning(applicationSlug);
  const keys = signing?.keys ?? [];
  const hasActiveKey = keys.some((key) => key.status === "active");

  return (
    <>
      <SectionCard
        title="包签名"
        description="生成密钥后，新构建的文件列表会用它签名并随 manifest 下发。客户端内置公钥，就能确认包是 Forge 签过的、没有被替换。"
        actions={
          canManage ? (
            <Button
              size="sm"
              disabled={isMutating}
              onClick={() => {
                setActionError("");
                setIsGenerateOpen(true);
              }}
            >
              <KeyRound className="size-4" />
              {hasActiveKey ? "轮换密钥" : "生成密钥"}
            </Button>
          ) : null
        }
      >
        <div className="space-y-3">
          {loadError ? <Alert variant="danger">{loadError.message}</Alert> : null}
          {actionError && !isGenerateOpen && !deleteTarget ? (
            <Alert variant="danger">{actionError}</Alert>
          ) : null}

          {/* biome-ignore lint/a11y/noLabelWithoutControl: Checkbox 是 Radix 按钮，label 包住它即可关联 */}
          <label className="flex items-start gap-3 rounded-md bg-surface-2 px-3 py-2.5">
            <Checkbox
              className="mt-0.5"
              checked={signing?.requireSignedReleases ?? false}
              disabled={
                !canManage ||
                isMutating ||
                !signing ||
                (!hasActiveKey && !signing.requireSignedReleases)
              }
              onCheckedChange={(checked) => {
                void setRequireSignedReleases(checked === true);
              }}
            />
            <span className="min-w-0">
              <span className="block font-medium text-foreground text-sm">
                只允许发布已签名的构建
              </span>
              <span className="mt-0.5 block text-muted-foreground text-xs">
                打开后，新建发布和回滚都会拒绝没有签名的构建，已生效的发布和提测单不受影响。
                {hasActiveKey ? "" : "需要先生成密钥。"}
              </span>
            </span>
          </label>

          {!isLoading && !loadError && keys.length === 0 ? (
            <div className="rounded-md bg-surface-2 px-3 py-6 text-center text-muted-foreground text-sm">
              还没有签名密钥，构建产物不带签名。
            </div>
          ) : null}
          {keys.map((key) => (
            <div key={key.keyId} className="space-y-2 rounded-md bg-surface-2 px-3 py-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <code className="font-mono font-semibold text-foreground text-sm">
                    {key.keyId}
                  </code>
                  {key.status === "active" ? (
                    <Badge variant="outline" className="bg-success-soft text-success">
                      生效中
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      已停用
                    </Badge>
                  )}
                  <span className="truncate text-muted-foreground text-xs">
                    {key.algorithm} · 签过 {key.signedBuilds} 个构建 ·{" "}
                    {key.createdBy?.name ?? "未知用户"} 创建于 {formatMinuteTime(key.createdAt)}
                    {key.retiredAt ? ` · ${formatMinuteTime(key.retiredAt)} 停用` : ""}
                  </span>
                </div>
                {canManage && key.status === "retired" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-8 shrink-0 text-destructive hover:bg-destructive-soft hover:text-destructive"
                    disabled={isMutating}
                    aria-label={`删除密钥 ${key.keyId}`}
                    onClick={() => {
                      setActionError("");
                      setDeleteTarget(key);
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                ) : null}
              </div>
              <CopyableCode value={key.publicKey} label={`公钥 ${key.keyId}`} className="text-xs" />
            </div>
          ))}
        </div>
      </SectionCard>

      <ConfirmDialog
        isOpen={isGenerateOpen}
        isPending={isMutating}
        title={hasActiveKey ? "轮换签名密钥" : "生成签名密钥"}
        description={
          hasActiveKey
            ? "新密钥生成后立即用于签名新构建，当前密钥转为已停用。只内置了旧公钥的客户端会拒绝新构建、回退到内置包，请先发布内置新旧两把公钥的客户端。"
            : "生成后，新构建会用这把密钥签名。客户端需要内置它的公钥才能校验签名。"
        }
        confirmLabel={hasActiveKey ? "轮换密钥" : "生成密钥"}
        onCancel={() => {
          if (isMutating) {
            return;
          }
          setIsGenerateOpen(false);
          setActionError("");
        }}
        onConfirm={() => {
          void confirmGenerate();
        }}
      >
        {actionError ? <Alert variant="danger">{actionError}</Alert> : null}
      </ConfirmDialog>
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        isPending={isMutating}
        title="删除签名密钥"
        description={
          deleteTarget
            ? `确认删除已停用的密钥 ${deleteTarget.keyId}？它签过的 ${deleteTarget.signedBuilds} 个构建保留签名；客户端是否还信任它，取决于客户端内置的公钥。`
            : ""
        }
        confirmLabel="删除密钥"
        tone="danger"
        onCancel={() => {
          if (isMutating) {
            return;
          }
          setDeleteTarget(null);
          setActionError("");
        }}
        onConfirm={() => {
          void confirmDelete();
        }}
      >
        {actionError ? <Alert variant="danger">{actionError}</Alert> : null}
      </ConfirmDialog>
    </>
  );
}
