import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import {
  Box,
  Circle,
  GitBranch,
  LoaderCircle,
  Plus,
  RefreshCw,
  Rocket,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { buildsSnapshotQueryKey, fetchBuildsSnapshot } from "@/api/builds";
import { fetchModulesSnapshot, modulesRootQueryKey } from "@/api/modules";
import { createBuildRelease } from "@/api/releases";
import { ConsoleClearableFilterSelect } from "@/components/common/ConsoleControls";
import { EnvironmentBadge } from "@/components/common/EnvironmentBadge";
import { Field } from "@/components/common/Field";
import { Modal, ModalFooter, ModalHeader } from "@/components/common/Modal";
import { DataTable, FilterBar, KpiCard, PageHeader, TablePagination } from "@/components/layout";
import { Alert } from "@/components/ui/alert";
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
import { environmentsSnapshotQueryKey, fetchEnvironmentsSnapshot } from "@/pages/environments";
import { useAuthStore } from "@/store/use-auth-store";
import type { BuildRunRecord } from "@/types/builds";
import type {
  BuildReleaseFormState,
  BuildReleaseGrayStrategy,
  BuildReleaseType,
} from "@/types/releases";

import {
  fetchReleaseRecordsSnapshot,
  releaseRecordsSnapshotQueryKey,
  releaseRecordsSnapshotQueryKeyWithFilters,
} from "./api/release-records-snapshot";
import {
  getReleaseRecordTypeLabel,
  releaseRecordStatusClass,
  releaseRecordStatusLabels,
} from "./constants";
import type { ReleasePointerRecord, ReleaseRecordStatus, ReleaseRecordsFilters } from "./types";

const PAGE_SIZE = 20;

const emptyReleaseRecordsFilters: ReleaseRecordsFilters = {
  environment: "",
  moduleId: "",
  releaseType: "",
  status: "",
};

const releaseStatusFilterOptions = [
  { label: "生效中", value: "active" },
  { label: "已失效", value: "inactive" },
];

const releaseTypeFilterOptions = [
  { label: "全量", value: "full" },
  { label: "灰度", value: "gray" },
];

type CreateReleaseFormState = BuildReleaseFormState & {
  buildRecordId: string;
};

type ReleaseRecordsPageProps = {
  onOpenRelease: (releaseId: string) => void;
};

export function ReleaseRecordsPage({ onOpenRelease }: ReleaseRecordsPageProps) {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const canCreateRelease = Boolean(session?.capabilities.canCreateRelease);
  const [filters, setFilters] = useState<ReleaseRecordsFilters>(emptyReleaseRecordsFilters);
  const [page, setPage] = useState(1);
  const {
    data: snapshot,
    isFetching,
    refetch,
  } = useQuery({
    placeholderData: keepPreviousData,
    queryFn: () => fetchReleaseRecordsSnapshot(filters),
    queryKey: releaseRecordsSnapshotQueryKeyWithFilters(filters),
  });
  const { data: overviewSnapshot, refetch: refetchOverview } = useQuery({
    queryFn: () => fetchReleaseRecordsSnapshot(),
    queryKey: releaseRecordsSnapshotQueryKey,
  });
  const { data: buildsSnapshot, isFetching: isBuildsFetching } = useQuery({
    queryFn: () => fetchBuildsSnapshot(),
    queryKey: buildsSnapshotQueryKey(),
  });
  const { data: modulesSnapshot } = useQuery({
    queryFn: () => fetchModulesSnapshot(),
    queryKey: modulesRootQueryKey,
  });
  const { data: environmentSnapshot } = useQuery({
    queryFn: fetchEnvironmentsSnapshot,
    queryKey: environmentsSnapshotQueryKey,
  });
  const buildOptions = useMemo(
    () => buildsSnapshot?.builds.filter((build) => build.status === "success") ?? [],
    [buildsSnapshot],
  );
  const [isCreateReleaseDialogOpen, setIsCreateReleaseDialogOpen] = useState(false);
  const [releaseError, setReleaseError] = useState("");
  const [releaseSuccess, setReleaseSuccess] = useState("");
  const moduleOptions = useMemo(
    () =>
      modulesSnapshot?.modules.map((module) => ({
        label: module.name,
        value: module.id,
      })) ?? [],
    [modulesSnapshot],
  );
  const environmentOptions = useMemo(
    () =>
      environmentSnapshot?.environments.map((environment) => ({
        label: environment.name,
        value: environment.id,
      })) ?? [],
    [environmentSnapshot],
  );
  const updateFilters = (patch: Partial<ReleaseRecordsFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
  };
  const stats = useMemo(
    () =>
      overviewSnapshot
        ? [
            {
              detail: "全部发布记录",
              icon: Rocket,
              id: "total",
              label: "总发布",
              tone: "info" as const,
              value: overviewSnapshot.summary.total,
            },
            {
              detail: "当前可访问",
              icon: ShieldCheck,
              id: "active",
              label: "生效中",
              tone: "success" as const,
              value: overviewSnapshot.summary.active,
            },
            {
              detail: "已被替换",
              icon: Circle,
              id: "inactive",
              label: "已失效",
              tone: "muted" as const,
              value: overviewSnapshot.summary.inactive,
            },
          ]
        : [],
    [overviewSnapshot],
  );
  const columnDefs = useMemo<ColDef<ReleasePointerRecord>[]>(
    () => [
      {
        cellRenderer: ReleaseIDCell,
        field: "id",
        flex: 0.45,
        headerName: "ID",
        minWidth: 96,
      },
      {
        cellRenderer: ReleaseRecordCell,
        field: "createdAt",
        flex: 1,
        headerName: "发布时间",
        minWidth: 176,
      },
      {
        field: "application",
        flex: 0.75,
        headerName: "应用",
        minWidth: 120,
      },
      {
        cellRenderer: ModuleCell,
        field: "module",
        flex: 0.75,
        headerName: "模块",
        minWidth: 130,
      },
      {
        cellRenderer: EnvironmentCell,
        field: "environment",
        flex: 0.58,
        headerName: "环境",
        minWidth: 90,
      },
      {
        cellRenderer: ReleaseTypeCell,
        field: "releaseType",
        flex: 0.65,
        headerName: "发布类型",
        minWidth: 102,
      },
      {
        cellRenderer: GrayConfigCell,
        field: "grayStrategy",
        flex: 0.82,
        headerName: "灰度配置",
        minWidth: 136,
      },
      {
        cellRenderer: ExpiresAtCell,
        field: "expiresAt",
        flex: 0.8,
        headerName: "过期时间",
        minWidth: 132,
      },
      {
        cellRenderer: StatusCell,
        field: "status",
        flex: 0.65,
        headerName: "状态",
        minWidth: 92,
      },
      {
        field: "operator",
        flex: 0.7,
        headerName: "操作人",
        minWidth: 100,
      },
    ],
    [],
  );

  if (!snapshot) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="发布管理" description="管理构建产物发布后的访问路由指向变更" />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((item) => (
          <KpiCard
            key={item.id}
            icon={item.icon}
            label={item.label}
            value={item.value}
            detail={item.detail}
            tone={item.tone}
          />
        ))}
      </section>

      <FilterBar
        label="最近发布"
        primary={
          <>
            <ConsoleClearableFilterSelect
              icon={ShieldCheck}
              label="状态"
              value={filters.status}
              options={releaseStatusFilterOptions}
              clearLabel="清空状态筛选"
              onClear={() => updateFilters({ status: "" })}
              onValueChange={(status) =>
                updateFilters({ status: status as ReleaseRecordsFilters["status"] })
              }
            />
            <ConsoleClearableFilterSelect
              icon={Rocket}
              label="类型"
              value={filters.releaseType}
              options={releaseTypeFilterOptions}
              clearLabel="清空类型筛选"
              onClear={() => updateFilters({ releaseType: "" })}
              onValueChange={(releaseType) =>
                updateFilters({ releaseType: releaseType as ReleaseRecordsFilters["releaseType"] })
              }
            />
            <ConsoleClearableFilterSelect
              icon={Box}
              label="模块"
              value={filters.moduleId}
              options={moduleOptions}
              clearLabel="清空模块筛选"
              onClear={() => updateFilters({ moduleId: "" })}
              onValueChange={(moduleId) => updateFilters({ moduleId })}
            />
            <ConsoleClearableFilterSelect
              icon={GitBranch}
              label="环境"
              value={filters.environment}
              options={environmentOptions}
              clearLabel="清空环境筛选"
              onClear={() => updateFilters({ environment: "" })}
              onValueChange={(environment) => updateFilters({ environment })}
            />
          </>
        }
        actions={
          <>
            <Button
              type="button"
              size="sm"
              disabled={!canCreateRelease}
              onClick={() => {
                setReleaseError("");
                setReleaseSuccess("");
                setIsCreateReleaseDialogOpen(true);
              }}
            >
              <Plus className="size-4" />
              新建发布
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="刷新发布记录"
              disabled={isFetching}
              onClick={() => {
                void refetch();
                void refetchOverview();
              }}
            >
              <RefreshCw className="size-4" />
            </Button>
          </>
        }
      />

      {releaseSuccess ? <Alert variant="success">{releaseSuccess}</Alert> : null}

      <DataTable
        rows={snapshot.records}
        columnDefs={columnDefs}
        getRowId={({ data }) => data.id}
        onRowClicked={({ data }) => {
          if (data) {
            onOpenRelease(data.id);
          }
        }}
      />

      <Card className="rounded-xl border-border bg-card py-0 shadow-xs">
        <TablePagination
          page={page}
          pageSize={PAGE_SIZE}
          total={snapshot.records.length}
          onPageChange={setPage}
          onPageSizeChange={() => {
            // hook left here for future wiring; current snapshot returns the full list
          }}
        />
      </Card>

      <CreateReleaseDialog
        buildOptions={buildOptions}
        isBuildsFetching={isBuildsFetching}
        isOpen={isCreateReleaseDialogOpen}
        submitError={releaseError}
        onClose={() => {
          setIsCreateReleaseDialogOpen(false);
          setReleaseError("");
        }}
        onSubmit={async (form) => {
          setReleaseError("");
          setReleaseSuccess("");

          try {
            const releaseCreatedAt = await createBuildRelease({
              buildRecordId: form.buildRecordId,
              expiresAt: form.expiresAt,
              grayPercentage: form.grayPercentage,
              grayStrategy: form.grayStrategy,
              identifier: form.identifier,
              releaseType: form.releaseType,
            });
            setReleaseSuccess(`发布已生效：${releaseCreatedAt}`);
            setIsCreateReleaseDialogOpen(false);
            await queryClient.invalidateQueries({ queryKey: releaseRecordsSnapshotQueryKey });
            await queryClient.invalidateQueries({ queryKey: buildsSnapshotQueryKey() });
          } catch (error) {
            setReleaseError(error instanceof Error ? error.message : "发布失败，请稍后重试");
          }
        }}
      />
    </div>
  );
}

function CreateReleaseDialog({
  buildOptions,
  isBuildsFetching,
  isOpen,
  onClose,
  onSubmit,
  submitError,
}: {
  buildOptions: BuildRunRecord[];
  isBuildsFetching: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (form: CreateReleaseFormState) => Promise<void>;
  submitError: string;
}) {
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
  } = useForm<CreateReleaseFormState>({
    defaultValues: {
      buildRecordId: "",
      expiresAt: defaultTargetedGrayExpiresAt(),
      grayPercentage: 0,
      grayStrategy: "targeted",
      identifier: "",
      releaseType: "full",
    },
  });
  const buildRecordId = watch("buildRecordId");
  const releaseType = watch("releaseType");
  const grayStrategy = watch("grayStrategy");
  const selectedBuild = buildOptions.find((build) => build.id === buildRecordId);
  const hasBuildOptions = buildOptions.length > 0;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    reset({
      buildRecordId: "",
      expiresAt: defaultTargetedGrayExpiresAt(),
      grayPercentage: 0,
      grayStrategy: "targeted",
      identifier: "",
      releaseType: "full",
    });
  }, [isOpen, reset]);

  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="release-create-dialog-title"
      describedBy="release-create-dialog-description"
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalHeader
          title="新建发布"
          titleId="release-create-dialog-title"
          descriptionId="release-create-dialog-description"
          description="选择已成功的构建记录并配置发布类型，提交后会更新访问路由指向。"
        />

        <div className="mt-4 space-y-4">
          <Field
            label="构建记录"
            htmlFor="release-create-build"
            required
            error={errors.buildRecordId?.message}
          >
            <Controller
              control={control}
              name="buildRecordId"
              rules={{ required: "请选择构建记录" }}
              render={({ field }) => (
                <Select
                  value={field.value}
                  disabled={isBuildsFetching || !hasBuildOptions}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger id="release-create-build" className="w-full">
                    <SelectValue
                      placeholder={
                        isBuildsFetching
                          ? "构建记录加载中"
                          : hasBuildOptions
                            ? "选择构建记录"
                            : "暂无成功构建"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {buildOptions.map((build) => (
                      <SelectItem key={build.id} value={build.id}>
                        {build.createdAt} / {build.module} / {build.version}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {selectedBuild ? (
              <div className="truncate text-muted-foreground text-xs">
                {selectedBuild.application} / {selectedBuild.branch} / #{selectedBuild.id.slice(-8)}
              </div>
            ) : null}
          </Field>

          <Field label="发布类型" htmlFor="release-create-type">
            <Controller
              control={control}
              name="releaseType"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value: BuildReleaseType) => field.onChange(value)}
                >
                  <SelectTrigger id="release-create-type" className="w-full">
                    <SelectValue placeholder="选择发布类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">全量</SelectItem>
                    <SelectItem value="gray">灰度</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          {releaseType === "gray" ? (
            <Field label="灰度方式" htmlFor="release-create-gray-strategy">
              <Controller
                control={control}
                name="grayStrategy"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value: BuildReleaseGrayStrategy) => field.onChange(value)}
                  >
                    <SelectTrigger id="release-create-gray-strategy" className="w-full">
                      <SelectValue placeholder="选择灰度方式" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="targeted">定向</SelectItem>
                      <SelectItem value="percentage">比例</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          ) : null}

          {releaseType === "gray" && grayStrategy === "targeted" ? (
            <Field
              label="定向标识"
              htmlFor="release-create-identifier"
              error={errors.identifier?.message}
            >
              <Input
                id="release-create-identifier"
                placeholder="输入用户、设备或实验标识"
                {...register("identifier", {
                  validate: (value) =>
                    releaseType !== "gray" || grayStrategy !== "targeted" || value.trim()
                      ? true
                      : "请输入定向标识",
                })}
              />
            </Field>
          ) : null}

          {releaseType === "gray" && grayStrategy === "targeted" ? (
            <Field
              label="过期时间"
              htmlFor="release-create-expires-at"
              error={errors.expiresAt?.message}
            >
              <div className="grid gap-2">
                <Input
                  id="release-create-expires-at"
                  type="datetime-local"
                  {...register("expiresAt", {
                    validate: (value) => {
                      if (releaseType !== "gray" || grayStrategy !== "targeted") {
                        return true;
                      }
                      if (!value) {
                        return "请选择过期时间";
                      }
                      const expiresAt = new Date(value);
                      if (Number.isNaN(expiresAt.getTime())) {
                        return "请选择有效过期时间";
                      }
                      return expiresAt.getTime() > Date.now() ? true : "过期时间必须晚于当前时间";
                    },
                  })}
                />
                <div className="flex flex-wrap gap-2">
                  {[7, 15, 30].map((days) => (
                    <Button
                      key={days}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 border-border bg-card text-foreground"
                      onClick={() =>
                        setValue("expiresAt", targetedGrayExpiresAt(days), {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    >
                      {days} 天
                    </Button>
                  ))}
                </div>
              </div>
            </Field>
          ) : null}

          {releaseType === "gray" && grayStrategy === "percentage" ? (
            <Field
              label="初始比例"
              htmlFor="release-create-gray-percentage"
              error={errors.grayPercentage?.message}
            >
              <Controller
                control={control}
                name="grayPercentage"
                rules={{
                  max: { message: "初始比例不能超过 99", value: 99 },
                  min: { message: "初始比例不能小于 0", value: 0 },
                }}
                render={({ field }) => {
                  const value =
                    typeof field.value === "number" && !Number.isNaN(field.value) ? field.value : 0;
                  const updateValue = (nextValue: number) =>
                    field.onChange(Math.min(99, Math.max(0, nextValue)));

                  return (
                    <div className="flex items-center gap-3">
                      <input
                        id="release-create-gray-percentage"
                        type="range"
                        min={0}
                        max={99}
                        value={value}
                        onChange={(event) => updateValue(Number(event.target.value))}
                        className="h-2 flex-1 accent-primary"
                      />
                      <Input
                        type="number"
                        min={0}
                        max={99}
                        value={value}
                        onChange={(event) => updateValue(Number(event.target.value))}
                        className="w-24"
                      />
                    </div>
                  );
                }}
              />
            </Field>
          ) : null}

          {!isBuildsFetching && !hasBuildOptions ? (
            <Alert variant="warning">暂无可发布的成功构建，请先完成构建。</Alert>
          ) : null}
          {submitError ? <Alert variant="danger">{submitError}</Alert> : null}
        </div>

        <ModalFooter>
          <Button variant="outline" type="button" disabled={isSubmitting} onClick={onClose}>
            取消
          </Button>
          <Button
            type="submit"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isSubmitting || !hasBuildOptions}
          >
            {isSubmitting ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                发布中
              </>
            ) : (
              "确认发布"
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

function ReleaseRecordCell({ data }: ICellRendererParams<ReleasePointerRecord>) {
  if (!data) {
    return null;
  }

  return <span className="truncate font-semibold text-primary text-sm">{data.createdAtShort}</span>;
}

function ReleaseIDCell({ value }: ICellRendererParams<ReleasePointerRecord, string>) {
  return value ? (
    <span className="truncate font-mono font-semibold text-foreground text-xs">
      #{value.trim().slice(-8)}
    </span>
  ) : null;
}

function ModuleCell({ data }: ICellRendererParams<ReleasePointerRecord>) {
  if (!data) {
    return null;
  }

  return (
    <div className="min-w-0 leading-tight">
      <div className="truncate font-semibold text-foreground text-sm">{data.module}</div>
    </div>
  );
}

function EnvironmentCell({ data }: ICellRendererParams<ReleasePointerRecord>) {
  return data ? (
    <EnvironmentBadge environment={data.environment}>{data.environmentName}</EnvironmentBadge>
  ) : null;
}

function ReleaseTypeCell({ data }: ICellRendererParams<ReleasePointerRecord>) {
  return data ? (
    <span className="font-medium text-foreground text-xs">{getReleaseRecordTypeLabel(data)}</span>
  ) : null;
}

function GrayConfigCell({ data }: ICellRendererParams<ReleasePointerRecord>) {
  if (!data) {
    return null;
  }

  if (data.releaseType !== "gray") {
    return <span className="text-muted-foreground text-xs">-</span>;
  }

  if (data.grayStrategy === "targeted") {
    return (
      <span className="truncate font-mono font-semibold text-foreground text-xs">
        {data.identifier || "-"}
      </span>
    );
  }

  if (data.grayStrategy === "percentage") {
    const percentage = Math.max(0, Math.min(100, data.grayPercentage));

    return (
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-foreground text-xs">{percentage}%</div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${percentage}%` }} />
        </div>
      </div>
    );
  }

  return <span className="text-muted-foreground text-xs">-</span>;
}

function ExpiresAtCell({ data }: ICellRendererParams<ReleasePointerRecord>) {
  if (!data) {
    return null;
  }

  return <span className="truncate text-muted-foreground text-xs">{data.expiresAtShort}</span>;
}

function StatusCell({ value }: ICellRendererParams<ReleasePointerRecord, ReleaseRecordStatus>) {
  if (!value) {
    return null;
  }

  const Icon = value === "active" ? ShieldCheck : Rocket;

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded border px-2 font-semibold text-xs leading-none",
        releaseRecordStatusClass[value],
      )}
    >
      <Icon className="size-3" />
      {releaseRecordStatusLabels[value]}
    </span>
  );
}

function defaultTargetedGrayExpiresAt() {
  return targetedGrayExpiresAt(7);
}

function targetedGrayExpiresAt(days: number) {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return formatDatetimeLocal(value);
}

function formatDatetimeLocal(value: Date) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  const hour = `${value.getHours()}`.padStart(2, "0");
  const minute = `${value.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
}
