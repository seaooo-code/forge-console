import type { UseMutationResult } from "@tanstack/react-query";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import type { ReleaseRecordDetail } from "../types";
import { SectionHeader } from "./DetailPrimitives";

type GrayPercentageAdjustCardProps = {
  canCreateRelease: boolean;
  grayPercentage: number;
  grayPercentageError: string;
  grayPercentageInput: string;
  grayPercentageMessage: string;
  // biome-ignore lint/suspicious/noExplicitAny: mutation result types are structurally used only for isPending/mutate
  grayPercentageMutation: UseMutationResult<ReleaseRecordDetail, Error, number, unknown>;
  onGrayPercentageInputChange: (value: string) => void;
  onUpdate: () => void;
};

export function GrayPercentageAdjustCard({
  canCreateRelease,
  grayPercentage,
  grayPercentageError,
  grayPercentageInput,
  grayPercentageMessage,
  grayPercentageMutation,
  onGrayPercentageInputChange,
  onUpdate,
}: GrayPercentageAdjustCardProps) {
  return (
    <Card className="gap-0 rounded-lg border-border py-0 shadow-sm">
      <SectionHeader title="比例灰度" />
      <div className="grid gap-4 p-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="font-medium text-foreground text-sm">当前比例</div>
              <div className="mt-1 text-muted-foreground text-xs">
                当前生效比例为 {grayPercentage}%
              </div>
            </div>
            <Badge variant="outline" className="border-primary/30 text-primary">
              {grayPercentage}%
            </Badge>
          </div>
          <div className="grid gap-2 md:grid-cols-[minmax(0,260px)_minmax(0,1fr)] md:items-center">
            <Input
              min={0}
              max={100}
              type="number"
              value={grayPercentageInput}
              disabled={!canCreateRelease || grayPercentageMutation.isPending}
              onChange={(event) => onGrayPercentageInputChange(event.target.value)}
            />
            {Number(grayPercentageInput) === 100 ? (
              <Alert variant="warning" icon={false} className="px-3 py-2 text-xs">
                更新为 100% 后会转为全量发布，并替换当前默认路由。
              </Alert>
            ) : null}
          </div>
          {grayPercentageError ? (
            <div className="text-destructive text-xs">{grayPercentageError}</div>
          ) : null}
          {grayPercentageMessage ? (
            <div className="text-success text-xs">{grayPercentageMessage}</div>
          ) : null}
        </div>
        <Button
          type="button"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={!canCreateRelease || grayPercentageMutation.isPending}
          onClick={onUpdate}
        >
          {grayPercentageMutation.isPending ? "更新中" : "更新比例"}
        </Button>
      </div>
    </Card>
  );
}
