import type { UseMutationResult } from "@tanstack/react-query";
import {
  ArrowLeft,
  CircleOff,
  ExternalLink,
  LoaderCircle,
  PackageCheck,
  RadioTower,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import type { ReleaseRecordDetail } from "../types";
import { formatShortRecordID } from "../utils";
import { ReleaseStatusBadge, ReleaseTypeBadge } from "./DetailPrimitives";

type ReleaseRecordDetailHeaderProps = {
  canCreateRelease: boolean;
  canInactivateTargetedGray: boolean;
  inactivateMutation: UseMutationResult<ReleaseRecordDetail, Error, void, unknown>;
  onBack: () => void;
  onInactivate: () => void;
  onOpenBuild: (buildId: string) => void;
  release: ReleaseRecordDetail;
};

export function ReleaseRecordDetailHeader({
  canCreateRelease,
  canInactivateTargetedGray,
  inactivateMutation,
  onBack,
  onInactivate,
  onOpenBuild,
  release,
}: ReleaseRecordDetailHeaderProps) {
  return (
    <div className="border-border border-b bg-card px-6 py-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <Button
            variant="ghost"
            type="button"
            className="-ml-2 mb-3 h-8 gap-2 px-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={onBack}
          >
            <ArrowLeft className="size-4" />
            返回发布管理
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <RadioTower className="size-5" />
            </div>
            <h1 className="font-semibold text-2xl text-foreground tracking-tight">
              发布 {formatShortRecordID(release.id)}
            </h1>
            <ReleaseStatusBadge status={release.status} />
            <ReleaseTypeBadge release={release} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {canInactivateTargetedGray ? (
            <Button
              variant="outline"
              type="button"
              className="border-destructive/30 bg-card text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={!canCreateRelease || inactivateMutation.isPending}
              onClick={onInactivate}
            >
              {inactivateMutation.isPending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <CircleOff className="size-4" />
              )}
              {inactivateMutation.isPending ? "失效中" : "手动失效"}
            </Button>
          ) : null}
          <Button
            variant="outline"
            type="button"
            className="border-border bg-card text-foreground"
            onClick={() => onOpenBuild(release.buildRecordId)}
          >
            <PackageCheck className="size-4" />
            打开构建
          </Button>
          {release.artifactUrl ? (
            <Button
              asChild
              type="button"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <a href={release.artifactUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" />
                打开产物
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
