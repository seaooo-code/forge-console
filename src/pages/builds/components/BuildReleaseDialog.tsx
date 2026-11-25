import { LoaderCircle } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import { CommitCard } from "@/components/common/CommitInfo";
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from "@/components/common/Drawer";
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
import { ReleaseRuntimeVersionNotice } from "@/pages/release-records";

import type {
  ActiveFullReleaseTarget,
  BuildReleaseFormState,
  BuildReleaseType,
  BuildRunRecord,
} from "../types";
import { isBuildOlderThanActiveRelease } from "../utils";
import { Field } from "./Field";

export function BuildReleaseDialog({
  applicationSlug,
  build,
  getActiveFullRelease,
  isOpen,
  onClose,
  onSubmit,
  submitError,
}: {
  /** 构建所属应用的 slug，用来读取应用的发布渠道。 */
  applicationSlug: string;
  build: BuildRunRecord | null;
  /** 返回该构建所在模块、环境、运行时版本下指定渠道生效中的全量发布。 */
  getActiveFullRelease: (channel: string) => ActiveFullReleaseTarget | undefined;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (form: BuildReleaseFormState) => Promise<void>;
  submitError: string;
}) {
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
    watch,
  } = useForm<BuildReleaseFormState>({
    defaultValues: {
      channel: "",
      grayPercentage: 0,
      releaseType: "full",
    },
  });
  const releaseType = watch("releaseType");
  const activeFullRelease = getActiveFullRelease(watch("channel"));
  const isDuplicateFullRelease =
    releaseType === "full" && Boolean(build && activeFullRelease?.buildId === build.id);
  const isRollbackFullRelease =
    releaseType === "full" &&
    Boolean(
      build &&
        activeFullRelease &&
        activeFullRelease.buildId !== build.id &&
        isBuildOlderThanActiveRelease(build, activeFullRelease),
    );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    reset({
      channel: "",
      grayPercentage: 0,
      releaseType: "full",
    });
  }, [isOpen, reset]);

  if (!isOpen || !build) {
    return null;
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="build-release-dialog-title"
      describedBy="build-release-dialog-description"
      className="max-w-lg"
    >
      <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit(onSubmit)}>
        <DrawerHeader
          onClose={onClose}
          title="发布构建"
          titleId="build-release-dialog-title"
          descriptionId="build-release-dialog-description"
          description={`把构建 #${build.number}（${build.module}，${build.createdAt}）发布到${build.version}。`}
        />

        <DrawerBody className="space-y-5">
          <ReleaseRuntimeVersionNotice runtimeVersion={build.runtimeVersion} />
          <section className="space-y-2">
            <h3 className="m-0 font-medium text-muted-foreground text-xs">要发布的代码</h3>
            <CommitCard commit={build.commit} />
            <ReleaseCommitDiff
              buildId={build.id}
              commitSha={build.commitSha}
              moduleId={build.moduleId}
              online={activeFullRelease}
            />
          </section>

          <Controller
            control={control}
            name="channel"
            render={({ field }) => (
              <ReleaseChannelField
                applicationSlug={applicationSlug}
                id="build-release-channel"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />

          <Field label="发布类型" inputId="build-release-type">
            <Controller
              control={control}
              name="releaseType"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value: BuildReleaseType) => field.onChange(value)}
                >
                  <SelectTrigger id="build-release-type" className="w-full">
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
            <Field label="初始比例" inputId="build-release-gray-percentage">
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
                    <div className="grid gap-2">
                      <div className="flex items-center gap-3">
                        <input
                          id="build-release-gray-percentage"
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
                      {errors.grayPercentage ? (
                        <div className="text-destructive text-xs">
                          {errors.grayPercentage.message}
                        </div>
                      ) : null}
                    </div>
                  );
                }}
              />
            </Field>
          ) : null}

          {isDuplicateFullRelease ? (
            <Alert variant="warning">
              该构建已是该渠道、该运行时版本下生效中的全量发布，不能重复提交全量发布。
            </Alert>
          ) : null}
          {isRollbackFullRelease ? (
            <Alert variant="warning">
              当前生效构建创建于 {activeFullRelease?.build?.createdAt}
              ，早于它的构建发布会回退访问路由。
            </Alert>
          ) : null}

          {submitError ? <Alert variant="danger">{submitError}</Alert> : null}
        </DrawerBody>

        <DrawerFooter>
          <Button variant="outline" type="button" disabled={isSubmitting} onClick={onClose}>
            取消
          </Button>
          <Button type="submit" disabled={isSubmitting || isDuplicateFullRelease}>
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
