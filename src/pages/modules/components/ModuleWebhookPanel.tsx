import { useQuery } from "@tanstack/react-query";
import { Check, Copy, Eye, EyeOff, Webhook } from "lucide-react";
import { useEffect, useState } from "react";
import { apiBaseUrl } from "@/api/client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { connectionWebhookQueryKey, fetchConnectionWebhook } from "../api/modules-snapshot";
import type { ModuleRecord } from "../types";
import { CodeSourceProviderIcon } from "./CodeSourceProviderIcon";

export function ModuleWebhookPanel({ module }: { module: ModuleRecord }) {
  const connectionId = module.codeSourceConnectionId;
  const isGitHub = module.repositoryProvider === "github";
  const {
    data: webhook,
    error,
    isFetching,
  } = useQuery({
    enabled: !isGitHub && connectionId !== "",
    queryFn: () => fetchConnectionWebhook(connectionId),
    queryKey: connectionWebhookQueryKey(connectionId),
    retry: false,
  });

  return (
    <Card className="gap-0 rounded-lg py-0">
      <div className="flex h-12 items-center gap-2 px-4">
        <Webhook className="size-4 text-muted-foreground" />
        <div>
          <div className="font-semibold text-foreground text-sm">Webhook 配置</div>
          <div className="text-muted-foreground text-xs">push 事件触发自动构建</div>
        </div>
      </div>
      <div className="space-y-3 p-4 text-sm">
        {isGitHub ? (
          <div className="flex items-start gap-3 rounded-md bg-success/12 px-3 py-3">
            <CodeSourceProviderIcon provider="github" className="mt-0.5" />
            <div>
              <div className="font-medium text-foreground">已由 GitHub App 统一接收</div>
              <p className="mt-1 text-muted-foreground text-xs leading-5">
                GitHub 仓库的 push 事件由 GitHub App 统一推送，无需在仓库里单独配置 webhook。
              </p>
            </div>
          </div>
        ) : null}

        {!isGitHub && isFetching && !webhook ? (
          <div className="space-y-2">
            <div className="h-9 w-full animate-pulse rounded bg-muted" />
            <div className="h-9 w-full animate-pulse rounded bg-muted" />
          </div>
        ) : null}

        {!isGitHub && error ? (
          <Alert variant="danger">
            {error instanceof Error ? error.message : "读取 webhook 配置失败"}
          </Alert>
        ) : null}

        {!isGitHub && webhook ? (
          <>
            <CopyableValue label="URL" value={`${apiBaseUrl}${webhook.path}`} />
            {webhook.secret ? (
              <CopyableValue label="Secret token" value={webhook.secret} secret />
            ) : null}
            <ol className="list-decimal space-y-1 pl-5 text-muted-foreground text-xs leading-5">
              <li>
                打开 GitLab 项目{" "}
                <span className="font-medium text-foreground">{module.repositoryFullName}</span>
                ，进入 <span className="font-medium text-foreground">Settings → Webhooks</span>
                ，点击 Add new webhook。
              </li>
              <li>URL 填入上方地址，Secret token 填入上方 secret。</li>
              <li>
                Trigger 只勾选 <span className="font-medium text-foreground">Push events</span>
                ，分支过滤保持全部分支（由 Forge 按自动构建分支匹配）。
              </li>
              <li>保存后可在 webhook 列表里点击 Test → Push events 验证连通性。</li>
            </ol>
            <p className="text-muted-foreground text-xs">
              该地址需要能被 GitLab 实例访问；同一连接下的所有项目共用这组 URL 和 secret。
            </p>
          </>
        ) : null}
      </div>
    </Card>
  );
}

function CopyableValue({
  label,
  secret = false,
  value,
}: {
  label: string;
  secret?: boolean;
  value: string;
}) {
  const [isVisible, setIsVisible] = useState(!secret);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isCopied) {
      return;
    }
    const handle = window.setTimeout(() => setIsCopied(false), 1500);
    return () => window.clearTimeout(handle);
  }, [isCopied]);

  return (
    <div>
      <div className="mb-1 font-medium text-muted-foreground text-xs">{label}</div>
      <div className="flex items-center gap-1 rounded-md bg-surface-2 px-3 py-1.5">
        <code className="min-w-0 flex-1 break-all font-mono text-foreground text-xs">
          {isVisible ? value : "•".repeat(Math.min(value.length, 24))}
        </code>
        {secret ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            aria-label={isVisible ? "隐藏" : "显示"}
            onClick={() => setIsVisible((visible) => !visible)}
          >
            {isVisible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          aria-label={`复制${label}`}
          onClick={() => {
            void navigator.clipboard.writeText(value).then(() => setIsCopied(true));
          }}
        >
          {isCopied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
        </Button>
      </div>
    </div>
  );
}
