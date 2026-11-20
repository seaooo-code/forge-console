import { ExternalLink, Package, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DetailList, ErrorMessage } from "@/components/layout";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import { getReleaseRecordTargetLabel } from "../constants";
import { useReleaseRecordDetail } from "../hooks";
import type { ReleaseRecordDetail } from "../types";
import { ReleaseStatusBadge, ReleaseTypeBadge } from "./ReleaseBadges";

type ReleaseDetailPanelProps = {
  canCreateRelease: boolean;
  onClose: () => void;
  onOpenApplication: (applicationSlug: string) => void;
  onOpenBuild: (buildId: string) => void;
  onOpenEnvironment: (environmentId: string) => void;
  onOpenModule: (moduleId: string) => void;
  releaseId: string;
};

export function ReleaseDetailPanel({
  canCreateRelease,
  onClose,
  onOpenApplication,
  onOpenBuild,
  onOpenEnvironment,
  onOpenModule,
  releaseId,
}: ReleaseDetailPanelProps) {
  const {
    error,
    grayPercentageError,
    grayPercentageMessage,
    grayPercentageMutation,
    moduleSnapshot,
    release,
    setGrayPercentageError,
    setGrayPercentageMessage,
  } = useReleaseRecordDetail(releaseId);
  const [confirm, setConfirm] = useState<{ grayPercentage: number } | null>(null);

  const closeButton = (
    <Button aria-label="关闭详情" onClick={onClose} size="icon" type="button" variant="ghost">
      <X />
    </Button>
  );

  if (!release) {
    return (
      <div className="flex flex-col gap-4 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="h-6 w-32 animate-pulse rounded-md bg-muted" />
          {closeButton}
        </div>
        {error ? (
          <ErrorMessage error={error} />
        ) : (
          <div className="h-64 animate-pulse rounded-xl bg-muted" />
        )}
      </div>
    );
  }

  const applicationSlug = moduleSnapshot?.modules[0]?.applicationSlug ?? "";
  const isTargeted = release.releaseType === "gray" && release.grayStrategy === "targeted";
  const isPercentage = release.releaseType === "gray" && release.grayStrategy === "percentage";
  const link = (label: string, onClick?: () => void) =>
    onClick ? (
      <Button
        className="h-auto p-0 font-normal text-sm"
        onClick={onClick}
        type="button"
        variant="link"
      >
        {label}
      </Button>
    ) : (
      label
    );

  const updatePercentage = (grayPercentage: number) => {
    setGrayPercentageError("");
    setGrayPercentageMessage("");
    grayPercentageMutation.mutate(grayPercentage);
  };

  return (
    <div className="flex flex-col gap-6 px-6 pt-5 pb-6">
      <header className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="m-0 font-semibold text-foreground text-xl tracking-tight">
                发布 #{release.id.slice(-8)}
              </h2>
              <ReleaseStatusBadge status={release.status} />
              <ReleaseTypeBadge release={release} />
            </div>
            <p className="m-0 mt-1.5 truncate text-muted-foreground text-sm">
              {release.module} · {release.environmentName} · {release.createdAt}
            </p>
          </div>
          {closeButton}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            type="button"
            variant="outline"
            onClick={() => onOpenBuild(release.buildRecordId)}
          >
            <Package />
            打开构建
          </Button>
          {release.artifactUrl ? (
            <Button asChild size="sm" type="button" variant="outline">
              <a href={release.artifactUrl} rel="noreferrer" target="_blank">
                <ExternalLink />
                打开产物
              </a>
            </Button>
          ) : null}
        </div>
      </header>

      {release.description ? (
        <Alert variant="info">
          <div>
            <div className="font-medium">发布说明</div>
            <div className="mt-1 whitespace-pre-wrap leading-6">{release.description}</div>
          </div>
        </Alert>
      ) : null}

      {isPercentage ? (
        <GrayPercentageEditor
          canEdit={canCreateRelease && release.status === "active"}
          error={grayPercentageError}
          isPending={grayPercentageMutation.isPending}
          message={grayPercentageMessage}
          release={release}
          onSubmit={(grayPercentage) =>
            grayPercentage >= 100
              ? setConfirm({ grayPercentage })
              : updatePercentage(grayPercentage)
          }
        />
      ) : null}

      <section className="rounded-xl bg-card p-5 shadow-edge">
        <h3 className="m-0 mb-4 font-medium text-muted-foreground text-xs">发布信息</h3>
        <DetailList
          items={[
            { label: "发布目标", value: getReleaseRecordTargetLabel(release) },
            {
              hint: "只替换该运行时版本下的同类发布",
              label: "运行时版本",
              value: release.runtimeVersion || "-",
            },
            { label: "发布时间", value: release.createdAt },
            { label: "更新时间", value: release.updatedAtFull },
            isTargeted ? { label: "过期时间", value: release.expiresAt } : null,
            { label: "操作人", value: release.operator },
          ]}
        />
      </section>

      <section className="rounded-xl bg-card p-5 shadow-edge">
        <h3 className="m-0 mb-4 font-medium text-muted-foreground text-xs">路由指向</h3>
        <DetailList
          items={[
            {
              label: "应用",
              value: link(
                release.application,
                applicationSlug ? () => onOpenApplication(applicationSlug) : undefined,
              ),
            },
            {
              hint: release.environment,
              label: "环境",
              value: link(
                release.environmentName,
                release.environment && release.environment !== "-"
                  ? () => onOpenEnvironment(release.environment)
                  : undefined,
              ),
            },
            {
              hint: release.moduleId,
              label: "模块",
              value: link(
                release.module,
                release.moduleId && release.moduleId !== "-"
                  ? () => onOpenModule(release.moduleId)
                  : undefined,
              ),
            },
            { label: "产物", mono: true, value: release.artifactKey, wide: true },
          ]}
        />
      </section>

      <ConfirmDialog
        confirmLabel="转为全量"
        description="比例调到 100% 后，这条灰度会转为全量发布，并替换当前的全量路由。"
        isOpen={confirm !== null}
        isPending={grayPercentageMutation.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) {
            updatePercentage(confirm.grayPercentage);
          }
          setConfirm(null);
        }}
        title="把比例灰度转为全量？"
      />
    </div>
  );
}

function GrayPercentageEditor({
  canEdit,
  error,
  isPending,
  message,
  onSubmit,
  release,
}: {
  canEdit: boolean;
  error: string;
  isPending: boolean;
  message: string;
  onSubmit: (grayPercentage: number) => void;
  release: ReleaseRecordDetail;
}) {
  const current = release.grayPercentage;
  const { control, handleSubmit, reset, watch } = useForm<{ grayPercentage: number }>({
    defaultValues: { grayPercentage: current },
  });
  useEffect(() => reset({ grayPercentage: current }), [current, reset]);
  const value = watch("grayPercentage");

  let hint = "拖动后点更新才会生效";
  if (value >= 100) hint = "调到 100% 会转为全量";
  else if (value === 0) hint = "调到 0% 等于暂停这条灰度";

  return (
    <form
      className="rounded-xl bg-card p-5 shadow-edge"
      onSubmit={handleSubmit((form) => onSubmit(form.grayPercentage))}
    >
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="m-0 font-medium text-muted-foreground text-xs">比例灰度</h3>
        <span className="text-faint text-xs">当前 {current}%，按用户 ID 分流</span>
      </div>
      <span className="mb-4 flex h-2 gap-0.5">
        <i className="rounded-full bg-primary" style={{ width: `${100 - value}%` }} />
        <i className="rounded-full bg-route-percentage" style={{ width: `${value}%` }} />
      </span>
      <Controller
        control={control}
        name="grayPercentage"
        render={({ field }) => (
          <div className="flex items-center gap-3">
            <input
              aria-label="灰度比例"
              className="h-2 flex-1 accent-route-percentage"
              disabled={!canEdit || isPending}
              max={100}
              min={0}
              onChange={(event) => field.onChange(Number(event.target.value))}
              type="range"
              value={field.value}
            />
            <b className="w-12 text-right font-semibold text-lg tabular-nums">{field.value}%</b>
          </div>
        )}
      />
      <div className="mt-3 flex items-center justify-between gap-3 text-xs">
        <span className={error ? "text-destructive" : message ? "text-success" : "text-faint"}>
          {error || message || hint}
        </span>
        {canEdit ? (
          <Button disabled={value === current} loading={isPending} size="sm" type="submit">
            {value >= 100 ? "转为全量" : "更新比例"}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
