import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  Box,
  Boxes,
  CircleAlert,
  GitFork,
  Hammer,
  Package,
  PenLine,
  UserRound,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { buildsSnapshotQueryKey } from "@/pages/builds";
import { environmentsSnapshotQueryKey, fetchEnvironmentsSnapshot } from "@/pages/environments";

import {
  createModuleBuild,
  fetchModuleDetailSnapshot,
  moduleDetailQueryKey,
} from "./api/modules-snapshot";
import { kindClass } from "./constants";
import type { ModuleBuildFormState, ModuleRecord } from "./types";

type ModuleDetailPageProps = {
  moduleId: string;
  onBack: () => void;
  onEditModule: (moduleId: string) => void;
};

export function ModuleDetailPage({ moduleId, onBack, onEditModule }: ModuleDetailPageProps) {
  const queryClient = useQueryClient();
  const { data: snapshot, isFetching } = useQuery({
    queryFn: () => fetchModuleDetailSnapshot(moduleId),
    queryKey: moduleDetailQueryKey(moduleId),
  });
  const { data: environmentSnapshot, isFetching: isEnvironmentsFetching } = useQuery({
    queryFn: fetchEnvironmentsSnapshot,
    queryKey: environmentsSnapshotQueryKey,
  });
  const [isBuildDialogOpen, setIsBuildDialogOpen] = useState(false);
  const [buildError, setBuildError] = useState("");
  const [buildSuccess, setBuildSuccess] = useState("");
  const module = snapshot?.modules[0];
  const environmentOptions = useMemo(
    () =>
      environmentSnapshot?.environments.map((environment) => ({
        label: environment.name,
        value: environment.id,
      })) ?? [],
    [environmentSnapshot],
  );

  if (!module) {
    return <ModuleDetailFallback isFetching={isFetching} onBack={onBack} />;
  }

  const ModuleIcon = module.kind === "Common" ? Box : Package;

  return (
    <>
      <div className="border-slate-200 border-b bg-white px-6 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <Button
              variant="ghost"
              type="button"
              className="-ml-2 mb-3 h-8 gap-2 px-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              onClick={onBack}
            >
              <ArrowLeft className="size-4" />
              返回模块管理
            </Button>
            <div className="flex flex-wrap items-center gap-3">
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-lg text-white shadow-sm",
                  module.kind === "Common" ? "bg-amber-500" : "bg-sky-600",
                )}
              >
                <ModuleIcon className="size-5" />
              </div>
              <h1 className="font-semibold text-2xl text-slate-950 tracking-tight">
                {module.name}
              </h1>
              <span
                className={cn(
                  "inline-flex h-6 items-center rounded border px-2 font-semibold text-xs leading-none",
                  kindClass[module.kind],
                )}
              >
                {module.kind}
              </span>
              <Badge variant="outline" className="border-slate-200 font-mono text-slate-600">
                {module.id}
              </Badge>
            </div>
            <p className="mt-2 text-slate-600 text-sm">
              {module.kind === "Common"
                ? "通用模块提供应用内功能模块的基础依赖。"
                : "功能模块绑定宿主应用，并依赖同应用下的通用模块。"}
            </p>
          </div>

          <div className="space-y-3 xl:w-150">
            <div className="grid min-w-0 gap-2 text-sm md:grid-cols-2">
              <InfoPill icon={Boxes} label="关联应用" value={module.applicationName || "-"} />
              <OwnerInfoPill module={module} />
              <InfoPill icon={GitFork} label="默认分支" value={module.defaultBranch || "-"} />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  setBuildError("");
                  setBuildSuccess("");
                  setIsBuildDialogOpen(true);
                }}
              >
                <Hammer className="size-4" />
                构建
              </Button>
              <Button variant="outline" type="button" onClick={() => onEditModule(module.id)}>
                <PenLine className="size-4" />
                编辑配置
              </Button>
            </div>
            {buildSuccess ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700 text-sm">
                {buildSuccess}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-4 px-6 py-5">
        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="gap-0 rounded-lg border-slate-200 py-0 shadow-sm">
            <SectionHeader title="仓库绑定" description="模块代码源与默认分支" />
            <div className="grid gap-3 p-4 md:grid-cols-2">
              <DetailItem icon={GitFork} label="仓库" value={module.repository} />
              <DetailItem icon={GitFork} label="完整仓库名" value={module.repositoryFullName} />
              <DetailItem icon={GitFork} label="默认分支" value={module.defaultBranch} />
              <DetailItem icon={GitFork} label="Provider" value={module.repositoryProvider} />
              <DetailItem icon={GitFork} label="Clone URL" value={module.repositoryCloneUrl} wide />
              <DetailItem icon={GitFork} label="SSH URL" value={module.repositorySshUrl} wide />
            </div>
          </Card>

          <Card className="gap-0 rounded-lg border-slate-200 py-0 shadow-sm">
            <SectionHeader title="模块关系" description="应用归属与通用模块依赖" />
            <div className="grid gap-3 p-4">
              <DetailItem icon={Boxes} label="关联应用" value={module.applicationName} />
              <DetailItem icon={Boxes} label="应用 ID" value={module.applicationId} />
              <DetailItem icon={Package} label="通用模块" value={formatCommonModule(module)} />
            </div>
          </Card>
        </section>
      </div>

      <ModuleBuildDialog
        environmentOptions={environmentOptions}
        isEnvironmentsFetching={isEnvironmentsFetching}
        isOpen={isBuildDialogOpen}
        module={module}
        submitError={buildError}
        onClose={() => {
          setIsBuildDialogOpen(false);
          setBuildError("");
        }}
        onSubmit={async (form) => {
          setBuildError("");
          setBuildSuccess("");

          try {
            const build = await createModuleBuild({
              branch: form.branch.trim(),
              environment: form.environment,
              moduleId: module.id,
            });
            setBuildSuccess(`构建已提交：${build.id}`);
            setIsBuildDialogOpen(false);
            await queryClient.invalidateQueries({ queryKey: buildsSnapshotQueryKey });
          } catch (error) {
            setBuildError(error instanceof Error ? error.message : "提交构建失败，请稍后重试");
          }
        }}
      />
    </>
  );
}

function InfoPill({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <Icon className="size-4 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <div className="text-slate-500 text-xs">{label}</div>
        <div className="truncate font-semibold text-slate-800 text-sm">{value}</div>
      </div>
    </div>
  );
}

function OwnerInfoPill({ module }: { module: ModuleRecord }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <OwnerAvatar avatarUrl={module.ownerAvatarUrl} name={module.owner} />
      <div className="min-w-0">
        <div className="text-slate-500 text-xs">负责人</div>
        <div className="truncate font-semibold text-slate-800 text-sm">{module.owner || "-"}</div>
        {module.ownerEmail ? (
          <div className="truncate text-slate-500 text-xs">{module.ownerEmail}</div>
        ) : null}
      </div>
    </div>
  );
}

function OwnerAvatar({ avatarUrl, name }: { avatarUrl: string; name: string }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className="size-8 shrink-0 rounded-full object-cover" />;
  }

  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-rose-500 font-semibold text-white text-xs">
      {name.slice(0, 1).toUpperCase() || <UserRound className="size-4" />}
    </span>
  );
}

function SectionHeader({ description, title }: { description: string; title: string }) {
  return (
    <div className="flex h-12 items-center justify-between border-slate-200 border-b px-4">
      <div>
        <div className="font-semibold text-slate-900 text-sm">{title}</div>
        <div className="text-slate-500 text-xs">{description}</div>
      </div>
    </div>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
  wide = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 gap-3 rounded-md border border-slate-200 bg-white px-3 py-3",
        wide && "md:col-span-2",
      )}
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <div className="font-medium text-slate-500 text-xs">{label}</div>
        <div className="mt-1 break-all font-semibold text-slate-800 text-sm">{value || "-"}</div>
      </div>
    </div>
  );
}

function formatCommonModule(module: ModuleRecord) {
  if (module.kind === "Common") {
    return "-";
  }

  return module.commonModuleName || module.commonModuleId || "-";
}

function ModuleBuildDialog({
  environmentOptions,
  isEnvironmentsFetching,
  isOpen,
  module,
  onClose,
  onSubmit,
  submitError,
}: {
  environmentOptions: Array<{ label: string; value: string }>;
  isEnvironmentsFetching: boolean;
  isOpen: boolean;
  module: ModuleRecord;
  onClose: () => void;
  onSubmit: (form: ModuleBuildFormState) => Promise<void>;
  submitError: string;
}) {
  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<ModuleBuildFormState>({
    defaultValues: {
      branch: module.defaultBranch,
      environment: environmentOptions[0]?.value ?? "",
    },
  });
  const hasEnvironmentOptions = environmentOptions.length > 0;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    reset({
      branch: module.defaultBranch,
      environment: environmentOptions[0]?.value ?? "",
    });
  }, [environmentOptions, isOpen, module.defaultBranch, reset]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4 backdrop-blur-xs">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="module-build-dialog-title"
        aria-describedby="module-build-dialog-description"
        className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-5 shadow-xl"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <h2 id="module-build-dialog-title" className="font-semibold text-lg text-slate-950">
              新增构建
            </h2>
            <p id="module-build-dialog-description" className="text-slate-600 text-sm leading-6">
              为「{module.name}」创建构建记录，产物将上传到所选环境绑定的存储配置。
            </p>
          </div>

          <div className="mt-4 space-y-4">
            <Field label="分支" inputId="module-build-branch">
              <Input
                id="module-build-branch"
                placeholder={module.defaultBranch || "输入 Git 分支"}
                {...register("branch")}
              />
            </Field>
            <Field label="环境" inputId="module-build-environment">
              <Controller
                control={control}
                name="environment"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="module-build-environment" className="w-full">
                      <SelectValue
                        placeholder={isEnvironmentsFetching ? "环境加载中" : "选择环境"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {environmentOptions.map((environment) => (
                        <SelectItem key={environment.value} value={environment.value}>
                          {environment.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            {submitError ? (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-rose-600 text-sm">
                {submitError}
              </div>
            ) : null}
            {!isEnvironmentsFetching && !hasEnvironmentOptions ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700 text-sm">
                暂无可用环境，请先在环境管理中创建环境。
              </div>
            ) : null}
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" type="button" disabled={isSubmitting} onClick={onClose}>
              取消
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 text-white hover:bg-blue-700"
              disabled={isSubmitting || isEnvironmentsFetching || !hasEnvironmentOptions}
            >
              {isSubmitting ? "提交中" : "提交构建"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}

function Field({
  children,
  inputId,
  label,
}: {
  children: ReactNode;
  inputId: string;
  label: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="font-medium text-slate-600 text-xs">
        {label}
      </label>
      {children}
    </div>
  );
}

function ModuleDetailFallback({ isFetching, onBack }: { isFetching: boolean; onBack: () => void }) {
  return (
    <div className="space-y-4 px-6 py-5">
      <Button
        variant="ghost"
        type="button"
        className="-ml-2 h-8 gap-2 px-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        onClick={onBack}
      >
        <ArrowLeft className="size-4" />
        返回模块管理
      </Button>

      <Card className="rounded-lg border-slate-200 p-6 shadow-none">
        {isFetching ? (
          <div className="space-y-3">
            <div className="h-5 w-36 animate-pulse rounded bg-slate-100" />
            <div className="h-10 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-32 w-full animate-pulse rounded bg-slate-100" />
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 size-5 shrink-0 text-amber-500" />
            <div>
              <div className="font-semibold text-slate-900">未找到模块详情</div>
              <div className="mt-1 text-slate-500 text-sm">当前接口没有返回对应的模块。</div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
