import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import { applicationScopeOptionsQueryKey, fetchApplicationScopeOptions } from "@/api/applications";
import { PageErrorState } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useApplicationScopeStore } from "@/store/use-application-scope-store";
import { useAuthStore } from "@/store/use-auth-store";
import type { BuildRunRecord } from "@/types/builds";

import { AttentionList } from "./components/AttentionList";
import { CreateApplicationGuide } from "./components/CreateApplicationGuide";
import { RouteInspector } from "./components/RouteInspector";
import { RouteMatrix } from "./components/RouteMatrix";
import { releaseKindLabels } from "./constants";
import {
  useOverviewData,
  useRebuild,
  useReleaseBuild,
  useSetupProgress,
  useUpdateGrayPercentage,
} from "./hooks";
import type { CellKey, CellLocation, ReleaseComposerForm, RouteEntry, RuntimeGroup } from "./types";
import {
  buildRouteCells,
  cellBuilds,
  cellId,
  collectAttentionItems,
  collectRuntimeGroups,
  newerBuildCount,
  splitRuntimeGroups,
} from "./utils";

type OverviewPageProps = {
  onCreateApplication: () => void;
  onCreateEnvironment: () => void;
  onCreateModule: () => void;
  onCreateStorage: () => void;
  onOpenBuild: (buildId: string) => void;
  onOpenCodeSources: () => void;
};

const canvas = "min-h-0 rounded-xl bg-background shadow-edge";

export function OverviewPage({
  onCreateApplication,
  onCreateEnvironment,
  onCreateModule,
  onCreateStorage,
  onOpenBuild,
  onOpenCodeSources,
}: OverviewPageProps) {
  const applicationId = useApplicationScopeStore((state) => state.applicationId);
  const session = useAuthStore((state) => state.session);
  const canCreateBuild = Boolean(session?.capabilities.canCreateBuild);
  const canCreateRelease = Boolean(session?.capabilities.canCreateRelease);
  const { connections, error, isLoading, model, refetch } = useOverviewData(applicationId);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [picked, setPicked] = useState<CellKey | null>(null);
  const [composerBuildId, setComposerBuildId] = useState("");
  const [toast, setToast] = useState("");

  const releaseBuild = useReleaseBuild();
  const updateGray = useUpdateGrayPercentage();
  const rebuild = useRebuild();

  const { history, leading } = useMemo(
    () => splitRuntimeGroups(model ? collectRuntimeGroups(model) : []),
    [model],
  );
  const visibleGroups = useMemo(
    () => (isHistoryOpen ? [...leading, ...history] : leading),
    [history, isHistoryOpen, leading],
  );
  // 还没产出版本号的构建（排队、构建中、失败）不知道属于哪个版本，统一放在最上面那一段。
  const pendingRuntimeVersion = leading[0]?.runtimeVersion ?? "";
  const cells = useMemo(() => (model ? buildRouteCells(model) : new Map()), [model]);
  const modules = model?.modules ?? [];
  const environments = model?.environments ?? [];
  const selected = resolveSelection(picked, modules, environments, visibleGroups);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  /** 没带运行时版本的位置（例如「需要处理」里的失败构建）落到最上面那一段。 */
  const select = useCallback(
    (key: CellLocation & { runtimeVersion?: string }) => {
      setPicked({ ...key, runtimeVersion: key.runtimeVersion ?? pendingRuntimeVersion });
      setComposerBuildId("");
    },
    [pendingRuntimeVersion],
  );

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [role=dialog]")) return;
      if (event.key === "Escape") {
        setComposerBuildId("");
        return;
      }
      const moves: Record<string, [number, number]> = {
        ArrowDown: [1, 0],
        ArrowLeft: [0, -1],
        ArrowRight: [0, 1],
        ArrowUp: [-1, 0],
      };
      const move = moves[event.key];
      if (!move || !selected) return;
      event.preventDefault();
      // 上下方向键在所有展开的分段之间连续移动：分段内是模块行，到底后进入下一段。
      const rows = visibleGroups.flatMap((group) =>
        modules.map((module) => ({ moduleId: module.id, runtimeVersion: group.runtimeVersion })),
      );
      const row = rows.findIndex(
        (item) =>
          item.moduleId === selected.moduleId && item.runtimeVersion === selected.runtimeVersion,
      );
      const col = environments.findIndex((env) => env.id === selected.environment);
      const next = {
        ...rows[clamp(row + move[0], rows.length)],
        environment: environments[clamp(col + move[1], environments.length)].id,
      };
      select(next);
      document.querySelector<HTMLElement>(`[data-cell-id="${cellId(next)}"]`)?.focus();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [environments, modules, select, selected, visibleGroups]);

  if (!applicationId) {
    return (
      <PickApplication
        onCreateApplication={onCreateApplication}
        onCreateEnvironment={onCreateEnvironment}
        onCreateStorage={onCreateStorage}
      />
    );
  }
  if (error) {
    return (
      <section className={cn(canvas, "flex-1 p-8")}>
        <PageErrorState
          message={error instanceof Error ? error.message : undefined}
          onRetry={() => void refetch()}
          title="线上现状加载失败"
        />
      </section>
    );
  }
  if (isLoading || !model) {
    return (
      <>
        <section className={cn(canvas, "flex-1 animate-pulse")} />
        <aside className={cn(canvas, "hidden w-100 shrink-0 animate-pulse xl:block")} />
      </>
    );
  }

  const attention = collectAttentionItems(model, connections);
  const moduleName = (moduleId: string) =>
    modules.find((module) => module.id === moduleId)?.name ?? moduleId;
  // 只统计默认展示的分段，历史版本没有生效路由。
  let percentageCount = 0;
  let newerCells = 0;
  for (const group of leading) {
    for (const module of modules) {
      for (const env of environments) {
        const key = {
          environment: env.id,
          moduleId: module.id,
          runtimeVersion: group.runtimeVersion,
        };
        const cell = cells.get(cellId(key));
        if (cell?.percentage) percentageCount += 1;
        const builds = cellBuilds(
          model.builds,
          key,
          group.runtimeVersion === pendingRuntimeVersion,
        );
        if (newerBuildCount(builds, cell)) newerCells += 1;
      }
    }
  }

  const selectedModule = modules.find((module) => module.id === selected?.moduleId);
  const selectedEnv = environments.find((env) => env.id === selected?.environment);
  const selectedCell = selected ? cells.get(cellId(selected)) : undefined;

  const handleRelease = async (
    build: BuildRunRecord,
    form: ReleaseComposerForm,
    rollback: boolean,
  ) => {
    await releaseBuild.mutateAsync({ buildId: build.id, form });
    setComposerBuildId("");
    const where = `${moduleName(build.moduleId)} ${selectedEnv?.name ?? build.environment}`;
    if (rollback) setToast(`已回退：${where}全量回到 #${build.number}`);
    else if (form.kind === "percentage") {
      setToast(`已开始比例灰度：${where} #${build.number}，${form.grayPercentage}%`);
    } else {
      setToast(`已${releaseKindLabels[form.kind]}发布：${where} #${build.number}`);
    }
  };

  const handleUpdateGray = async (entry: RouteEntry, grayPercentage: number) => {
    try {
      await updateGray.mutateAsync({ grayPercentage, releaseId: entry.release.id });
      setToast(
        grayPercentage >= 100
          ? `比例灰度 #${entry.build?.number ?? "-"} 已转为全量`
          : `灰度比例已更新为 ${grayPercentage}%`,
      );
    } catch (mutationError) {
      setToast(mutationError instanceof Error ? mutationError.message : "灰度比例更新失败");
    }
  };

  const handleRebuild = async (input: {
    branch: string;
    environment: string;
    moduleId: string;
  }) => {
    try {
      const result = await rebuild.mutateAsync(input);
      select({ environment: input.environment, moduleId: input.moduleId });
      setToast(`已触发构建 #${result.number}：${moduleName(input.moduleId)}`);
    } catch (mutationError) {
      setToast(mutationError instanceof Error ? mutationError.message : "构建触发失败");
    }
  };

  return (
    <>
      <section className={cn(canvas, "min-w-0 flex-1 overflow-y-auto px-6 py-6 lg:px-7")}>
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="m-0 font-semibold text-2xl tracking-tight">线上现状</h1>
            <p className="m-0 mt-1.5 text-muted-foreground text-sm">
              {modules.length} 个模块 · {percentageCount} 条比例灰度生效中 · {newerCells}{" "}
              个格子有新构建可发布
            </p>
          </div>
        </header>

        <AttentionList
          canCreateBuild={canCreateBuild}
          environments={environments}
          items={attention}
          moduleName={moduleName}
          onOpenBuild={onOpenBuild}
          onOpenCodeSources={onOpenCodeSources}
          onRebuild={handleRebuild}
          onSelect={select}
          isRebuilding={rebuild.isPending}
        />

        {modules.length === 0 ? (
          <div className="mt-7 rounded-2xl bg-card px-5 py-6 shadow-edge">
            <p className="m-0 font-medium text-sm">这个应用还没有模块</p>
            <p className="m-0 mt-1 text-muted-foreground text-sm">
              新建模块并完成第一次构建后，这里会显示它在各个环境的线上构建。
            </p>
            <Button className="mt-4" onClick={onCreateModule}>
              新建模块
            </Button>
          </div>
        ) : (
          <RouteMatrix
            builds={model.builds}
            cells={cells}
            environments={environments}
            history={history}
            isHistoryOpen={isHistoryOpen}
            leading={leading}
            modules={modules}
            onSelect={select}
            onToggleHistory={() => setIsHistoryOpen((open) => !open)}
            pendingRuntimeVersion={pendingRuntimeVersion}
            selected={selected}
          />
        )}
      </section>

      <aside
        aria-label="所选路由"
        className={cn(canvas, "hidden w-100 shrink-0 overflow-y-auto px-5 py-5.5 xl:block")}
      >
        {selectedModule && selectedEnv && selected ? (
          <RouteInspector
            builds={cellBuilds(
              model.builds,
              selected,
              selected.runtimeVersion === pendingRuntimeVersion,
            )}
            canCreateRelease={canCreateRelease}
            cell={selectedCell}
            composerBuildId={composerBuildId}
            environment={selectedEnv}
            module={selectedModule}
            onCloseComposer={() => setComposerBuildId("")}
            onOpenBuild={onOpenBuild}
            onOpenComposer={setComposerBuildId}
            onRelease={handleRelease}
            onUpdateGray={handleUpdateGray}
            runtimeVersion={selected.runtimeVersion || "（暂无）"}
          />
        ) : (
          <p className="m-0 text-muted-foreground text-sm">
            选择一个格子，查看它的路由和可发布的构建。
          </p>
        )}
      </aside>

      <output
        aria-live="polite"
        className={cn(
          "pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-foreground px-4.5 py-2.5 text-background text-sm shadow-raise transition-all",
          toast ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
        )}
      >
        {toast}
      </output>
    </>
  );
}

function clamp(index: number, length: number) {
  return Math.min(length - 1, Math.max(0, index));
}

/** 选中的格子不在当前展开的分段里（例如收起了历史版本）时，回到第一段第一个模块的最后一个环境。 */
function resolveSelection(
  picked: CellKey | null,
  modules: { id: string }[],
  environments: { id: string }[],
  groups: RuntimeGroup[],
): CellKey | null {
  if (
    picked &&
    modules.some((module) => module.id === picked.moduleId) &&
    environments.some((env) => env.id === picked.environment) &&
    groups.some((group) => group.runtimeVersion === picked.runtimeVersion)
  ) {
    return picked;
  }
  const module = modules[0];
  const env = environments[environments.length - 1];
  const group = groups[0];
  return module && env && group
    ? { environment: env.id, moduleId: module.id, runtimeVersion: group.runtimeVersion }
    : null;
}

function PickApplication({
  onCreateApplication,
  onCreateEnvironment,
  onCreateStorage,
}: {
  onCreateApplication: () => void;
  onCreateEnvironment: () => void;
  onCreateStorage: () => void;
}) {
  const setApplicationId = useApplicationScopeStore((state) => state.setApplicationId);
  const capabilities = useAuthStore((state) => state.session?.capabilities);
  const { isReady, ...progress } = useSetupProgress();
  const { data: applications = [], isSuccess } = useQuery({
    queryFn: fetchApplicationScopeOptions,
    queryKey: applicationScopeOptionsQueryKey,
  });

  return (
    <section className={cn(canvas, "flex-1 overflow-y-auto px-8 py-10")}>
      <h1 className="m-0 font-semibold text-2xl tracking-tight">线上现状</h1>
      <p className="m-0 mt-1.5 text-muted-foreground text-sm">
        {isSuccess && applications.length === 0
          ? "线上现状按应用展示每个模块在各环境的全量与灰度。"
          : "线上现状按应用展示。选一个应用开始，之后也可以在左上角切换。"}
      </p>
      {isSuccess && applications.length === 0 ? (
        <CreateApplicationGuide
          capabilities={{
            application: Boolean(capabilities?.canCreateApplication),
            environment: Boolean(capabilities?.canManageEnvironments),
            storage: Boolean(capabilities?.canManageStorage),
          }}
          isReady={isReady}
          onCreateApplication={onCreateApplication}
          onCreateEnvironment={onCreateEnvironment}
          onCreateStorage={onCreateStorage}
          progress={progress}
        />
      ) : null}
      <div className="mt-6 grid max-w-3xl grid-cols-1 gap-2.5 sm:grid-cols-2">
        {applications.map((application) => (
          <Button
            key={application.id}
            variant="ghost"
            onClick={() => setApplicationId(application.id)}
            className="h-auto justify-start gap-3 rounded-xl bg-card px-4 py-3.5 text-left shadow-edge hover:bg-hover"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-foreground font-medium text-background">
              {application.name.slice(0, 1)}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-medium text-sm">{application.name}</span>
              <span className="block truncate font-normal text-faint text-xs">
                {application.moduleCount} 个模块 · {application.slug}
              </span>
            </span>
          </Button>
        ))}
      </div>
    </section>
  );
}
