import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import { CommitComparison } from "@/components/common/CommitComparison";
import { CommitInline } from "@/components/common/CommitInfo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RuntimeEnvironment } from "@/pages/environments";
import type { BuildRunRecord } from "@/types/builds";
import type { ModuleRecord } from "@/types/modules";

import { environmentDotClass, releaseKindLabels, releaseKindSubmitLabels } from "../constants";
import type {
  GrayPercentageForm,
  ReleaseComposerForm,
  ReleaseKind,
  RouteCell,
  RouteEntry,
} from "../types";
import { candidateAction, isEmptyCell, relativeTime, routeUsages } from "../utils";
import { SplitBar } from "./RouteMatrix";

type RouteInspectorProps = {
  builds: BuildRunRecord[];
  canCreateRelease: boolean;
  cell: RouteCell | undefined;
  composerBuildId: string;
  environment: RuntimeEnvironment;
  module: ModuleRecord;
  onCloseComposer: () => void;
  onOpenBuild: (buildId: string) => void;
  onOpenComposer: (buildId: string) => void;
  onRelease: (build: BuildRunRecord, form: ReleaseComposerForm, rollback: boolean) => Promise<void>;
  onUpdateGray: (entry: RouteEntry, grayPercentage: number) => Promise<void>;
  runtimeVersion: string;
};

export function RouteInspector(props: RouteInspectorProps) {
  const { builds, cell, environment, module, runtimeVersion } = props;

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
        <i className={cn("size-2 rounded-sm", environmentDotClass[environment.tone])} />
        {environment.name} · {environment.id}
      </div>
      <h2 className="m-0 mt-1.5 truncate font-semibold text-xl tracking-tight">{module.name}</h2>
      <p className="m-0 mt-1 truncate text-faint text-xs">
        {module.repositoryFullName || module.repository} · 运行时版本 {runtimeVersion}
      </p>

      <section className="mt-5">
        <SectionTitle hint="按匹配顺序" title="当前路由" />
        <CurrentRoutes {...props} />
      </section>

      <section className="mt-6">
        <SectionTitle
          hint={`${builds.length} 个 · 只能发布到构建所在环境`}
          title={`${environment.name}的构建`}
        />
        {builds.length === 0 ? (
          <Box>
            <p className="m-0 p-3 text-muted-foreground text-sm">
              运行时版本 {runtimeVersion} 下还没有{environment.name}的构建。
            </p>
          </Box>
        ) : (
          <Box>
            {builds.map((build, index) => (
              <Candidate
                key={build.id}
                {...props}
                build={build}
                cell={cell}
                isFirstRelease={
                  index ===
                  builds.findIndex((item) => candidateAction(item, cell).kind === "release")
                }
              />
            ))}
          </Box>
        )}
      </section>
    </div>
  );
}

function SectionTitle({ hint, title }: { hint: string; title: string }) {
  return (
    <h3 className="m-0 mb-2 flex items-baseline justify-between px-0.5 font-medium text-muted-foreground text-xs">
      {title}
      <span className="font-normal text-faint">{hint}</span>
    </h3>
  );
}

function Box({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl bg-card p-1 shadow-edge">{children}</div>;
}

function CurrentRoutes({
  canCreateRelease,
  cell,
  onUpdateGray,
  runtimeVersion,
}: RouteInspectorProps) {
  if (isEmptyCell(cell) || !cell) {
    return (
      <Box>
        <p className="m-0 p-3 text-muted-foreground text-sm">
          这个环境在运行时版本 {runtimeVersion} 下还没有发布过。从下面选一个构建开始。
        </p>
      </Box>
    );
  }

  const fullOrder = cell.percentage ? 2 : 1;
  return (
    <>
      <p className="m-0 mb-2.5 px-0.5 text-faint text-xs leading-relaxed">
        先按用户 ID 分流比例灰度，其余请求走全量。
      </p>
      <Box>
        {cell.percentage ? (
          <SplitBar
            className="mx-2.5 mt-2 mb-1.5 h-2 w-auto"
            percentage={cell.percentage.release.grayPercentage}
          />
        ) : null}
        {cell.percentage ? (
          <RouteRow
            entry={cell.percentage}
            meta={`${relativeTime(cell.percentage.release.updatedAtRaw)} · ${cell.percentage.release.operator}`}
            order={1}
            tag={`比例 ${cell.percentage.release.grayPercentage}%`}
            tagClass="bg-route-percentage-soft text-route-percentage"
          >
            {cell.full ? (
              <CommitComparison
                className="mb-2"
                from={cell.full.release.commit.sha}
                fromLabel="全量"
                moduleId={cell.percentage.release.moduleId}
                to={cell.percentage.release.commit.sha}
                toLabel="灰度"
              />
            ) : null}
            {canCreateRelease ? (
              <GrayPercentageEditor entry={cell.percentage} onSubmit={onUpdateGray} />
            ) : null}
          </RouteRow>
        ) : null}
        {cell.full ? (
          <RouteRow
            entry={cell.full}
            meta={`${relativeTime(cell.full.release.updatedAtRaw)} · ${cell.full.release.operator}`}
            order={fullOrder}
            tag="全量"
            tagClass="bg-primary-soft text-primary-text"
          />
        ) : (
          <div className="flex items-center gap-2 px-2.5 py-2.5 text-sm">
            <Order value={fullOrder} />
            <span className="rounded-md bg-muted px-1.5 text-muted-foreground text-xs">全量</span>
            <span className="ml-auto text-faint text-xs">还没有全量构建</span>
          </div>
        )}
      </Box>
    </>
  );
}

function Order({ value }: { value: number }) {
  return (
    <span className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-muted text-faint text-xs">
      {value}
    </span>
  );
}

type RouteRowProps = {
  children?: React.ReactNode;
  entry: RouteEntry;
  meta: string;
  order: number;
  tag: string;
  tagClass: string;
};

function RouteRow({ children, entry, meta, order, tag, tagClass }: RouteRowProps) {
  return (
    <div className="px-2.5 py-2.5">
      <div className="flex items-center gap-2 text-sm">
        <Order value={order} />
        <span className={cn("whitespace-nowrap rounded-md px-1.5 text-xs", tagClass)}>{tag}</span>
        <span className="font-medium tabular-nums">
          {entry.build ? `#${entry.build.number}` : "构建已清理"}
        </span>
        <span className="ml-auto min-w-0 truncate text-right text-faint text-xs">{meta}</span>
      </div>
      <div className="mt-1 flex min-w-0 pl-6.5">
        <CommitInline commit={entry.release.commit} />
      </div>
      {children ? <div className="mt-2 pl-6.5">{children}</div> : null}
    </div>
  );
}

function GrayPercentageEditor({
  entry,
  onSubmit,
}: {
  entry: RouteEntry;
  onSubmit: (entry: RouteEntry, grayPercentage: number) => Promise<void>;
}) {
  const current = entry.release.grayPercentage;
  const { control, formState, handleSubmit, reset, watch } = useForm<GrayPercentageForm>({
    defaultValues: { grayPercentage: current },
  });
  useEffect(() => reset({ grayPercentage: current }), [current, reset]);
  const value = watch("grayPercentage");

  let hint = "拖动后点更新才会生效";
  if (value >= 100) hint = "调到 100% 会转为全量";
  else if (value === 0) hint = "调到 0% 等于暂停这条灰度";

  return (
    <form onSubmit={handleSubmit((form) => onSubmit(entry, form.grayPercentage))}>
      <Controller
        control={control}
        name="grayPercentage"
        render={({ field }) => (
          <div className="flex items-center gap-2.5">
            <input
              aria-label="灰度比例"
              className="h-2 flex-1 accent-route-percentage"
              max={100}
              min={0}
              onChange={(event) => field.onChange(Number(event.target.value))}
              type="range"
              value={field.value}
            />
            <b className="w-11 text-right font-semibold tabular-nums">{field.value}%</b>
          </div>
        )}
      />
      <div className="mt-1.5 flex items-center justify-between text-faint text-xs">
        <span>{hint}</span>
        <Button
          disabled={value === current}
          loading={formState.isSubmitting}
          size="sm"
          type="submit"
          variant="outline"
        >
          {value >= 100 ? "转为全量" : "更新比例"}
        </Button>
      </div>
    </form>
  );
}

type CandidateProps = RouteInspectorProps & { build: BuildRunRecord; isFirstRelease: boolean };

function Candidate(props: CandidateProps) {
  const { build, canCreateRelease, cell, composerBuildId, isFirstRelease } = props;
  const action = candidateAction(build, cell);
  const open = composerBuildId === build.id;
  const full = cell?.full?.build;
  const usages = routeUsages(cell, build.id);

  let delta = "";
  if (full && build.status === "success" && build.id !== full.id) {
    delta = build.number > full.number ? "比当前全量新" : "比当前全量旧";
  }

  return (
    <div
      className={cn(
        "rounded-lg transition-colors",
        open ? "bg-primary-wash ring-2 ring-primary ring-inset" : "hover:bg-hover",
      )}
    >
      <div className="grid grid-cols-[1fr_auto] items-center gap-x-2.5 gap-y-0.5 px-2.5 py-2.5">
        <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
          <span className="font-medium tabular-nums">#{build.number}</span>
          {delta ? (
            <span
              className={cn(
                "text-xs",
                build.number > (full?.number ?? 0) ? "text-primary-text" : "text-route-percentage",
              )}
            >
              {delta}
            </span>
          ) : null}
          {usages.map((usage) => (
            <span
              key={usage.label}
              className={cn(
                "rounded-md px-1.5 text-xs",
                usage.kind === "full" && "bg-primary-soft text-primary-text",
                usage.kind === "percentage" && "bg-route-percentage-soft text-route-percentage",
              )}
            >
              {usage.label}
            </span>
          ))}
        </span>
        <span className="col-start-1 flex min-w-0 items-center gap-1.5 text-faint text-xs">
          <span className="shrink-0 font-mono">{build.branch}</span>
          <span className="shrink-0">·</span>
          <CommitInline commit={build.commit} />
          <span className="shrink-0">· {relativeTime(build.createdAtRaw)}</span>
        </span>
        <span className="col-start-2 row-span-2 row-start-1 flex items-center gap-1.5">
          <CandidateButton
            action={action.kind}
            build={build}
            canCreateRelease={canCreateRelease}
            highlight={isFirstRelease && !open}
            onOpenBuild={props.onOpenBuild}
            onToggle={() => (open ? props.onCloseComposer() : props.onOpenComposer(build.id))}
            open={open}
          />
        </span>
      </div>
      {open ? (
        <ReleaseComposer
          {...props}
          compareFrom={full?.commitSha ?? cell?.full?.release.commit.sha ?? ""}
          rollback={action.kind === "rollback"}
        />
      ) : null}
    </div>
  );
}

function CandidateButton({
  action,
  build,
  canCreateRelease,
  highlight,
  onOpenBuild,
  onToggle,
  open,
}: {
  action: ReturnType<typeof candidateAction>["kind"];
  build: BuildRunRecord;
  canCreateRelease: boolean;
  highlight: boolean;
  onOpenBuild: (buildId: string) => void;
  onToggle: () => void;
  open: boolean;
}) {
  if (action === "busy") {
    return (
      <Button size="sm" variant="ghost" className="text-info" onClick={() => onOpenBuild(build.id)}>
        {build.status === "queued" ? "排队中" : "构建中"}
      </Button>
    );
  }
  if (action === "failed") {
    return (
      <Button
        size="sm"
        variant="ghost"
        className="text-destructive"
        onClick={() => onOpenBuild(build.id)}
      >
        失败 · 看日志
      </Button>
    );
  }
  if (action === "current") {
    return <span className="text-faint text-xs">当前全量</span>;
  }
  if (!canCreateRelease) {
    return null;
  }
  return (
    <Button size="sm" variant={highlight ? "default" : "outline"} onClick={onToggle}>
      {open ? "收起" : action === "rollback" ? "回退到此" : "发布"}
    </Button>
  );
}

type ReleaseComposerProps = CandidateProps & {
  /** 当前全量的 commit，没有全量时为空字符串。 */
  compareFrom: string;
  rollback: boolean;
};

function ReleaseComposer({
  build,
  cell,
  compareFrom,
  environment,
  module,
  onCloseComposer,
  onRelease,
  rollback,
}: ReleaseComposerProps) {
  const { control, formState, handleSubmit, setError, watch } = useForm<ReleaseComposerForm>({
    defaultValues: { grayPercentage: 10, kind: "full" },
  });
  const form = watch();
  const percentageTaken = Boolean(cell?.percentage);
  const kinds: { disabled: boolean; kind: ReleaseKind }[] = [
    { disabled: false, kind: "full" },
    { disabled: percentageTaken, kind: "percentage" },
  ];

  const submit = handleSubmit(async (values) => {
    try {
      await onRelease(build, { ...values, kind: rollback ? "full" : values.kind }, rollback);
    } catch (error) {
      setError("root", { message: error instanceof Error ? error.message : "发布失败" });
    }
  });

  return (
    <form className="flex flex-col gap-3 px-2.5 pb-3" onSubmit={submit}>
      {compareFrom && build.commitSha ? (
        <CommitComparison
          from={compareFrom}
          fromLabel="当前全量"
          moduleId={module.id}
          to={build.commitSha}
          toLabel="这个构建"
        />
      ) : null}

      {rollback ? null : (
        <>
          <Controller
            control={control}
            name="kind"
            render={({ field }) => (
              <div className="flex items-center gap-2.5 text-xs">
                <span className="w-8 shrink-0 text-faint">方式</span>
                <div className="inline-flex gap-px rounded-lg bg-muted p-0.5">
                  {kinds.map(({ disabled, kind }) => (
                    <Button
                      key={kind}
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={disabled}
                      aria-pressed={field.value === kind}
                      onClick={() => field.onChange(kind)}
                      className={cn(
                        "h-6.5 rounded-md px-2.5 font-normal text-muted-foreground hover:bg-transparent hover:text-foreground",
                        field.value === kind &&
                          "bg-background text-foreground shadow-edge hover:bg-background",
                      )}
                    >
                      {releaseKindLabels[kind]}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          />
          {percentageTaken ? (
            <p className="m-0 text-route-percentage text-xs leading-relaxed">
              已有比例灰度 #{cell?.percentage?.build?.number ?? "-"}
              ，同一时间只能有一条。要换构建，先在上方把它调到 100% 转为全量。
            </p>
          ) : null}
          {form.kind === "percentage" ? (
            <Controller
              control={control}
              name="grayPercentage"
              render={({ field }) => (
                <div className="flex items-center gap-2.5 text-xs">
                  <span className="w-8 shrink-0 text-faint">比例</span>
                  <input
                    aria-label="初始比例"
                    className="h-2 flex-1 accent-primary"
                    max={99}
                    min={1}
                    onChange={(event) => field.onChange(Number(event.target.value))}
                    type="range"
                    value={field.value}
                  />
                  <b className="w-11 text-right font-semibold text-base tabular-nums">
                    {field.value}%
                  </b>
                </div>
              )}
            />
          ) : null}
        </>
      )}

      <p
        className={cn(
          "m-0 rounded-lg bg-card px-3 py-2.5 text-sm leading-relaxed shadow-edge",
          rollback && "bg-route-percentage-soft",
        )}
      >
        {impactText({ build, cell, environment, form, rollback })}
        <small className="mt-0.5 block text-muted-foreground text-xs">
          {impactNote(cell, form, rollback)}
        </small>
      </p>

      {formState.errors.root ? (
        <p className="m-0 text-destructive text-xs">{formState.errors.root.message}</p>
      ) : null}

      <div className="flex justify-end gap-1.5">
        <Button size="sm" type="button" variant="ghost" onClick={onCloseComposer}>
          取消
        </Button>
        <Button size="sm" type="submit" loading={formState.isSubmitting}>
          {rollback ? `回退到 #${build.number}` : releaseKindSubmitLabels[form.kind]}
        </Button>
      </div>
    </form>
  );
}

function impactText({
  build,
  cell,
  environment,
  form,
  rollback,
}: {
  build: BuildRunRecord;
  cell: RouteCell | undefined;
  environment: RuntimeEnvironment;
  form: ReleaseComposerForm;
  rollback: boolean;
}) {
  const current = cell?.full?.build ? `#${cell.full.build.number}` : "";
  if (rollback) return `${environment.name}的全量从 ${current} 回退到 #${build.number}。`;
  if (form.kind === "full") {
    return current
      ? `${environment.name}的全量从 ${current} 换成 #${build.number}。`
      : `${environment.name}开始有全量：除提测单成员外，所有请求都拿到 #${build.number}。`;
  }
  const rest = current ? `其余继续用 ${current}` : "其余用户暂时没有全量构建可用";
  return `按用户 ID 分流，${form.grayPercentage}% 的用户拿到 #${build.number}，${rest}。`;
}

function impactNote(cell: RouteCell | undefined, form: ReleaseComposerForm, rollback: boolean) {
  if (form.kind === "percentage" && !rollback)
    return "之后可以随时调整比例，调到 100% 即转为全量。";
  return cell?.percentage
    ? `进行中的比例灰度 #${cell.percentage.build?.number ?? "-"} 会同时结束，原本命中灰度的请求也换成新的全量。`
    : "确认后立即对所有请求生效。";
}
