import { skipToken, useQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { CommitCard } from "@/components/common/CommitInfo";
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from "@/components/common/Drawer";
import { Field } from "@/components/common/Field";
import { ReleaseChannelField } from "@/components/common/ReleaseChannelField";
import { ReleaseCommitDiff } from "@/components/common/ReleaseCommitDiff";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BuildRunRecord } from "@/types/builds";
import type { BuildReleaseFormState, BuildReleaseType } from "@/types/releases";

import {
  fetchAllReleaseRecordsSnapshot,
  releaseRecordsAllQueryKey,
} from "../api/release-records-snapshot";
import { ReleaseRuntimeVersionNotice } from "./ReleaseRuntimeVersionNotice";

type CreateReleaseFormState = BuildReleaseFormState & {
  buildRecordId: string;
};

type CreateReleaseDialogProps = {
  /** 模块 ID 到所属应用 slug 的映射，用来读取构建所属应用的发布渠道。 */
  applicationSlugByModuleId: Map<string, string>;
  buildOptions: BuildRunRecord[];
  isBuildsFetching: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (form: CreateReleaseFormState) => Promise<void>;
  submitError: string;
};

export function CreateReleaseDialog({
  applicationSlugByModuleId,
  buildOptions,
  isBuildsFetching,
  isOpen,
  onClose,
  onSubmit,
  submitError,
}: CreateReleaseDialogProps) {
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
    setValue,
    watch,
  } = useForm<CreateReleaseFormState>({
    defaultValues: {
      buildRecordId: "",
      channel: "",
      grayPercentage: 0,
      releaseType: "full",
    },
  });
  const buildRecordId = watch("buildRecordId");
  const releaseType = watch("releaseType");
  const channel = watch("channel");
  const selectedBuild = buildOptions.find((build) => build.id === buildRecordId);
  // 选中构建所在模块和环境里生效中的发布，用来展示和线上全量相差的提交。
  const activeReleaseFilters = {
    environment: selectedBuild?.environment ?? "",
    moduleId: selectedBuild?.moduleId ?? "",
    status: "active" as const,
  };
  const { data: activeReleases } = useQuery({
    queryFn: selectedBuild ? () => fetchAllReleaseRecordsSnapshot(activeReleaseFilters) : skipToken,
    queryKey: releaseRecordsAllQueryKey(activeReleaseFilters),
  });
  const onlineFull = activeReleases?.records.find(
    (record) =>
      record.releaseType === "full" &&
      record.runtimeVersion === selectedBuild?.runtimeVersion &&
      record.channel === channel,
  );
  const hasBuildOptions = buildOptions.length > 0;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    reset({
      buildRecordId: "",
      channel: "",
      grayPercentage: 0,
      releaseType: "full",
    });
  }, [isOpen, reset]);

  if (!isOpen) {
    return null;
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="release-create-dialog-title"
      describedBy="release-create-dialog-description"
      className="max-w-lg"
    >
      <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit(onSubmit)}>
        <DrawerHeader
          onClose={onClose}
          title="新建发布"
          titleId="release-create-dialog-title"
          descriptionId="release-create-dialog-description"
          description="选择已成功的构建记录并配置发布类型，提交后会更新访问路由指向。"
        />

        <DrawerBody className="space-y-5">
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
                  onValueChange={(value) => {
                    field.onChange(value);
                    // 换了构建可能换了应用，已选的渠道不一定还存在。
                    setValue("channel", "");
                  }}
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
                        {build.createdAt} / {build.module} #{build.number} / {build.version}
                        {build.runtimeVersion ? ` / ${build.runtimeVersion}` : ""}
                        {build.commit.title ? ` / ${build.commit.title}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {selectedBuild ? (
              <div className="truncate text-muted-foreground text-xs">
                {selectedBuild.application} / {selectedBuild.branch} / #{selectedBuild.number}
              </div>
            ) : null}
          </Field>

          {selectedBuild ? (
            <section className="space-y-2">
              <h3 className="m-0 font-medium text-muted-foreground text-xs">要发布的代码</h3>
              <CommitCard commit={selectedBuild.commit} />
              <ReleaseCommitDiff
                buildId={selectedBuild.id}
                commitSha={selectedBuild.commitSha}
                moduleId={selectedBuild.moduleId}
                online={
                  onlineFull
                    ? {
                        buildId: onlineFull.buildRecordId,
                        buildNumber: onlineFull.buildNumber,
                        commit: onlineFull.commit,
                      }
                    : undefined
                }
              />
            </section>
          ) : null}

          {selectedBuild ? (
            <ReleaseRuntimeVersionNotice runtimeVersion={selectedBuild.runtimeVersion} />
          ) : null}

          {selectedBuild ? (
            <Controller
              control={control}
              name="channel"
              render={({ field }) => (
                <ReleaseChannelField
                  applicationSlug={applicationSlugByModuleId.get(selectedBuild.moduleId) ?? ""}
                  id="release-create-channel"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          ) : null}

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
                    <SelectItem value="gray">比例灰度</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          {releaseType === "gray" ? (
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
        </DrawerBody>

        <DrawerFooter>
          <Button variant="outline" type="button" disabled={isSubmitting} onClick={onClose}>
            取消
          </Button>
          <Button type="submit" disabled={isSubmitting || !hasBuildOptions}>
            {isSubmitting ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                发布中
              </>
            ) : (
              "确认发布"
            )}
          </Button>
        </DrawerFooter>
      </form>
    </Drawer>
  );
}
