import { ExternalLink, Package, PowerOff, Undo2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DetailList, ErrorMessage } from "@/components/layout";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { getReleaseRecordTargetLabel } from "../constants";
import { useReleaseRecordDetail } from "../hooks";
import type { ReleaseEvent, ReleasePullStats, ReleaseRecordDetail } from "../types";
import { describeReleaseEvent } from "../utils";
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
    deactivateMutation,
    error,
    events,
    eventsError,
    grayPercentageError,
    grayPercentageMessage,
    grayPercentageMutation,
    moduleSnapshot,
    pullStats,
    pullStatsError,
    release,
    rollbackMutation,
    setGrayPercentageError,
    setGrayPercentageMessage,
  } = useReleaseRecordDetail(releaseId);
  const [confirm, setConfirm] = useState<{ grayPercentage: number } | null>(null);
  const [operation, setOperation] = useState<"deactivate" | "rollback" | null>(null);
  const [operationMessage, setOperationMessage] = useState("");

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

  const canOperate = canCreateRelease && release.status === "active";
  const isFull = release.releaseType === "full";

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
          {canOperate && isFull ? (
            <Button
              size="sm"
              type="button"
              variant="outline"
              onClick={() => setOperation("rollback")}
            >
              <Undo2 />
              回滚到上一版本
            </Button>
          ) : null}
          {canOperate && (isFull || isPercentage) ? (
            <Button
              size="sm"
              type="button"
              variant="outline"
              onClick={() => setOperation("deactivate")}
            >
              <PowerOff />
              {isFull ? "停用全量" : "结束灰度"}
            </Button>
          ) : null}
        </div>
        {operationMessage ? <Alert variant="success">{operationMessage}</Alert> : null}
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
              hint: release.channel
                ? "只对上报该渠道的客户端生效，停用后这些客户端回落到默认渠道"
                : "所有客户端；渠道客户端在渠道里没有发布时也使用默认渠道",
              label: "发布渠道",
              mono: Boolean(release.channel),
              value: release.channel || "默认渠道",
            },
            {
              hint: "只影响该运行时版本下的发布",
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

      <PullStatsSection error={pullStatsError} stats={pullStats} />
      <ReleaseEventsSection error={eventsError} events={events} />

      <ReleaseOperationDialog
        description={
          operation === "rollback"
            ? "把同一运行时版本下上一次全量发布的构建重新发布为全量，并结束进行中的比例灰度。和普通发布一样会校验 Common 与业务包的能力兼容。"
            : isFull
              ? "停用后不会自动恢复其他发布：该运行时版本下没有命中灰度或提测单的客户端拿不到这个模块的包，会回退到 App 内置包。"
              : "结束后，原本命中这条灰度的用户回到全量发布。"
        }
        error={
          (operation === "rollback" ? rollbackMutation.error : deactivateMutation.error)?.message ??
          ""
        }
        isOpen={operation !== null}
        isPending={rollbackMutation.isPending || deactivateMutation.isPending}
        label={operation === "rollback" ? "回滚说明（可选）" : "原因（可选）"}
        onCancel={() => {
          setOperation(null);
          rollbackMutation.reset();
          deactivateMutation.reset();
        }}
        onConfirm={(text) => {
          const mutation = operation === "rollback" ? rollbackMutation : deactivateMutation;
          mutation.mutate(text, {
            onSuccess: (result) => {
              setOperationMessage(
                operation === "rollback"
                  ? `已回滚，新的全量发布 #${result.id.slice(-8)} 已生效`
                  : isFull
                    ? "全量发布已停用"
                    : "灰度已结束",
              );
              setOperation(null);
            },
          });
        }}
        title={
          operation === "rollback"
            ? "回滚到上一次全量？"
            : isFull
              ? "停用这条全量发布？"
              : "结束这条比例灰度？"
        }
        tone={operation === "rollback" ? "default" : "danger"}
        confirmLabel={operation === "rollback" ? "回滚" : isFull ? "停用" : "结束灰度"}
      />

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

function ReleaseOperationDialog({
  confirmLabel,
  description,
  error,
  isOpen,
  isPending,
  label,
  onCancel,
  onConfirm,
  title,
  tone,
}: {
  confirmLabel: string;
  description: string;
  error: string;
  isOpen: boolean;
  isPending: boolean;
  label: string;
  onCancel: () => void;
  onConfirm: (text: string) => void;
  title: string;
  tone: "danger" | "default";
}) {
  const { register, getValues, reset } = useForm<{ text: string }>({ defaultValues: { text: "" } });
  useEffect(() => {
    if (isOpen) reset({ text: "" });
  }, [isOpen, reset]);

  return (
    <ConfirmDialog
      confirmLabel={confirmLabel}
      description={description}
      isOpen={isOpen}
      isPending={isPending}
      onCancel={onCancel}
      onConfirm={() => onConfirm(getValues("text").trim())}
      title={title}
      tone={tone}
    >
      <div className="mt-4 flex flex-col gap-1.5 text-sm">
        <label className="text-muted-foreground text-xs" htmlFor="release-operation-text">
          {label}
        </label>
        <Textarea
          id="release-operation-text"
          maxLength={200}
          placeholder="会记录在操作记录里"
          {...register("text")}
        />
      </div>
      {error ? <p className="m-0 mt-2 text-destructive text-sm">{error}</p> : null}
    </ConfirmDialog>
  );
}

function PullStatsSection({ error, stats }: { error: Error | null; stats?: ReleasePullStats }) {
  return (
    <section className="rounded-xl bg-card p-5 shadow-edge">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="m-0 font-medium text-muted-foreground text-xs">近 7 天拉包</h3>
        <span className="text-faint text-xs">
          这个构建在该环境被客户端拉取的次数（含 304），约 30 秒更新
        </span>
      </div>
      {error ? (
        <ErrorMessage error={error} />
      ) : !stats ? (
        <div className="h-16 animate-pulse rounded-md bg-muted" />
      ) : stats.days.length === 0 ? (
        <p className="m-0 text-faint text-sm">近 7 天没有客户端拉到这个构建</p>
      ) : (
        <div className="flex flex-col gap-2 text-sm">
          <div className="font-semibold text-foreground text-lg tabular-nums">
            共 {stats.total} 次
          </div>
          {stats.days.map((day) => (
            <div className="flex items-center justify-between gap-3" key={day.day}>
              <span className="text-muted-foreground tabular-nums">{day.day}</span>
              <span className="truncate text-faint text-xs">
                {Object.entries(day.platforms)
                  .map(([platform, count]) => `${platform} ${count}`)
                  .join(" · ")}
              </span>
              <b className="font-medium tabular-nums">{day.total}</b>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ReleaseEventsSection({ error, events }: { error: Error | null; events?: ReleaseEvent[] }) {
  return (
    <section className="rounded-xl bg-card p-5 shadow-edge">
      <h3 className="m-0 mb-4 font-medium text-muted-foreground text-xs">操作记录</h3>
      {error ? (
        <ErrorMessage error={error} />
      ) : !events ? (
        <div className="h-16 animate-pulse rounded-md bg-muted" />
      ) : events.length === 0 ? (
        <p className="m-0 text-faint text-sm">暂无操作记录（这条发布早于操作记录功能上线）</p>
      ) : (
        <ol className="m-0 flex list-none flex-col gap-3 p-0 text-sm">
          {events.map((event) => (
            <li className="flex flex-col gap-0.5" key={event.id}>
              <span className="text-foreground">{describeReleaseEvent(event)}</span>
              <span className="text-faint text-xs">
                {event.actor} · {event.createdAt}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
