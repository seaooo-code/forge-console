import {
  Ban,
  GitFork,
  GitMerge,
  type LucideIcon,
  Pencil,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { providerLabel, providerToneClass } from "../constants";
import type {
  CodeSourceConnection,
  CodeSourceConnectionAction,
  CodeSourceConnectionProvider,
} from "../types";
import { formatDisplayTime, getCredentialExpiryLevel } from "../utils";

const providerIcons: Record<CodeSourceConnectionProvider, LucideIcon> = {
  github: GitFork,
  gitlab: GitMerge,
};

export function CodeSourceConnectionRow({
  canManage,
  connection,
  onDelete,
  onEdit,
  onToggleStatus,
  onVerify,
  pendingAction,
}: {
  canManage: boolean;
  connection: CodeSourceConnection;
  onDelete: (connection: CodeSourceConnection) => void;
  onEdit: (connection: CodeSourceConnection) => void;
  onToggleStatus: (connection: CodeSourceConnection) => void;
  onVerify: (connection: CodeSourceConnection) => void;
  pendingAction?: CodeSourceConnectionAction;
}) {
  const Icon = providerIcons[connection.provider];
  const isDisabled = connection.status === "disabled";
  const isPending = pendingAction !== undefined;
  const expiryLevel = getCredentialExpiryLevel(connection.credentialExpiresAt);

  return (
    <div className="grid gap-3 px-4 py-4 md:grid-cols-3 2xl:grid-cols-[minmax(14rem,1.4fr)_minmax(7rem,0.8fr)_minmax(10rem,1fr)_minmax(7rem,0.7fr)_minmax(8rem,0.8fr)_minmax(8rem,0.8fr)_auto] 2xl:items-center">
      <div className="min-w-0 md:col-span-3 2xl:col-span-1">
        <div className="flex min-w-0 items-center gap-2">
          <div
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-md",
              providerToneClass[connection.provider],
            )}
          >
            <Icon className="size-4" />
          </div>
          <span className="min-w-0 truncate font-semibold text-foreground text-sm">
            {connection.name}
          </span>
          <Badge variant="outline" size="sm" className="shrink-0">
            {providerLabel[connection.provider]}
          </Badge>
          {isDisabled ? (
            <Badge variant="neutral" className="shrink-0">
              已停用
            </Badge>
          ) : (
            <Badge variant="success" className="shrink-0 gap-1">
              <ShieldCheck className="size-3" />
              启用中
            </Badge>
          )}
        </div>
      </div>
      <ConnectionMeta label="账号" value={connection.externalAccount || "-"} />
      <ConnectionMeta label="实例地址" value={connection.webBaseUrl || "-"} />
      <ConnectionMeta label="凭证" value={connection.credentialPreview || "-"} mono />
      <div className="min-w-0">
        <div className="text-muted-foreground text-xs">凭证过期</div>
        <div
          className={cn(
            "mt-1 truncate text-xs",
            expiryLevel === "expired" && "font-medium text-destructive",
            expiryLevel === "expiring" && "font-medium text-warning",
            expiryLevel === "none" && "text-foreground",
          )}
        >
          {connection.credentialExpiresAt
            ? formatDisplayTime(connection.credentialExpiresAt)
            : "不过期"}
          {expiryLevel === "expired" ? "（已过期）" : null}
          {expiryLevel === "expiring" ? "（即将过期）" : null}
        </div>
      </div>
      <ConnectionMeta label="最近校验" value={formatDisplayTime(connection.lastVerifiedAt)} />
      {canManage ? (
        <div className="flex flex-wrap items-center justify-start gap-1.5 md:col-span-3 2xl:col-span-1 2xl:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => onVerify(connection)}
          >
            <RefreshCw className={cn("size-4", pendingAction === "verify" && "animate-spin")} />
            {pendingAction === "verify" ? "校验中" : "重新校验"}
          </Button>
          {connection.provider === "gitlab" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => onEdit(connection)}
            >
              <Pencil className="size-4" />
              编辑
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => onToggleStatus(connection)}
          >
            {isDisabled ? <ShieldCheck className="size-4" /> : <Ban className="size-4" />}
            {isDisabled ? "启用" : "停用"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={`删除连接 ${connection.name}`}
            disabled={isPending}
            onClick={() => onDelete(connection)}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function ConnectionMeta({ label, mono, value }: { label: string; mono?: boolean; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div
        className={cn("mt-1 truncate text-foreground text-xs", mono && "font-mono")}
        title={value}
      >
        {value}
      </div>
    </div>
  );
}
