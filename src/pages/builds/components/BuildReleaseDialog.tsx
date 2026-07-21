import { LoaderCircle } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import { Modal, ModalFooter, ModalHeader } from "@/components/common/Modal";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type {
  ActiveFullReleaseTarget,
  BuildReleaseFormState,
  BuildReleaseGrayStrategy,
  BuildReleaseType,
  BuildRunRecord,
} from "../types";
import {
  defaultTargetedGrayExpiresAt,
  isBuildOlderThanActiveRelease,
  targetedGrayExpiresAt,
} from "../utils";
import { Field } from "./Field";

export function BuildReleaseDialog({
  activeFullRelease,
  build,
  isOpen,
  onClose,
  onSubmit,
  submitError,
}: {
  activeFullRelease?: ActiveFullReleaseTarget;
  build: BuildRunRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (form: BuildReleaseFormState) => Promise<void>;
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
  } = useForm<BuildReleaseFormState>({
    defaultValues: {
      expiresAt: defaultTargetedGrayExpiresAt(),
      grayPercentage: 0,
      grayStrategy: "targeted",
      identifier: "",
      releaseType: "full",
    },
  });
  const releaseType = watch("releaseType");
  const grayStrategy = watch("grayStrategy");
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
      expiresAt: defaultTargetedGrayExpiresAt(),
      grayPercentage: 0,
      grayStrategy: "targeted",
      identifier: "",
      releaseType: "full",
    });
  }, [isOpen, reset]);

  if (!isOpen || !build) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="build-release-dialog-title"
      describedBy="build-release-dialog-description"
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalHeader
          title="发布构建"
          titleId="build-release-dialog-title"
          descriptionId="build-release-dialog-description"
          description={`将 ${build.createdAt} 创建的构建发布到 ${build.version} 环境，发布后会更新访问路由指向。`}
        />

        <div className="mt-4 space-y-4">
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
                    <SelectItem value="gray">灰度</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          {releaseType === "gray" ? (
            <Field label="灰度方式" inputId="build-release-gray-strategy">
              <Controller
                control={control}
                name="grayStrategy"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value: BuildReleaseGrayStrategy) => field.onChange(value)}
                  >
                    <SelectTrigger id="build-release-gray-strategy" className="w-full">
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
            <Field label="定向标识" inputId="build-release-identifier">
              <Input
                id="build-release-identifier"
                placeholder="输入用户、设备或实验标识"
                {...register("identifier", {
                  validate: (value) =>
                    releaseType !== "gray" || grayStrategy !== "targeted" || value.trim()
                      ? true
                      : "请输入定向标识",
                })}
              />
              {errors.identifier ? (
                <div className="text-destructive text-xs">{errors.identifier.message}</div>
              ) : null}
            </Field>
          ) : null}

          {releaseType === "gray" && grayStrategy === "targeted" ? (
            <Field label="过期时间" inputId="build-release-expires-at">
              <div className="grid gap-2">
                <Controller
                  control={control}
                  name="expiresAt"
                  rules={{
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
                  }}
                  render={({ field }) => (
                    <DateTimePicker
                      ref={field.ref}
                      id="build-release-expires-at"
                      value={field.value}
                      invalid={Boolean(errors.expiresAt)}
                      onBlur={field.onBlur}
                      onChange={field.onChange}
                    />
                  )}
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
                {errors.expiresAt ? (
                  <div className="text-destructive text-xs">{errors.expiresAt.message}</div>
                ) : null}
              </div>
            </Field>
          ) : null}

          {releaseType === "gray" && grayStrategy === "percentage" ? (
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
            <Alert variant="warning">该构建已有生效中的全量发布，不能重复提交全量发布。</Alert>
          ) : null}
          {isRollbackFullRelease ? (
            <Alert variant="warning">
              当前生效构建创建于 {activeFullRelease?.build?.createdAt}
              ，早于它的构建发布会回退访问路由。
            </Alert>
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
            disabled={isSubmitting || isDuplicateFullRelease}
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
