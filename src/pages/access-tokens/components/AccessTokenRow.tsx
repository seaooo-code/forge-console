import { Ban, ShieldCheck, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { ArtifactAccessTokenRecord, ArtifactAccessTokenStatus } from "../types";
import { formatDisplayTime, isExpired } from "../utils";

export function AccessTokenRow({
  canManageAccessTokens,
  isPending,
  onDelete,
  onStatusChange,
  token,
}: {
  canManageAccessTokens: boolean;
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
          <span className="min-w-0 flex-1 truncate font-semibold text-foreground text-sm">
            {token.name}
          </span>
          <TokenStatusBadge token={token} />
        </div>
        <div className="mt-1 truncate font-mono text-muted-foreground text-xs">
          {token.tokenPreview}
        </div>
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
          disabled={!canManageAccessTokens || isPending}
          onClick={() => onStatusChange(token, nextStatus)}
        >
          <StatusIcon className="size-4" />
          {isDisabled ? "启用" : "停用"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={!canManageAccessTokens}
          onClick={() => onDelete(token)}
        >
          <Trash2 className="size-4 text-destructive" />
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
      <Badge variant="outline" className="shrink-0 border-border text-muted-foreground">
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
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="mt-1 truncate text-foreground text-xs">{value}</div>
    </div>
  );
}
