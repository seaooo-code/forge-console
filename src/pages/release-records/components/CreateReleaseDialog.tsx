import { LoaderCircle } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from "@/components/common/Drawer";
import { Field } from "@/components/common/Field";
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
import type { BuildRunRecord } from "@/types/builds";
import type {
  BuildReleaseFormState,
  BuildReleaseGrayStrategy,
  BuildReleaseType,
} from "@/types/releases";

import { defaultTargetedGrayExpiresAt, targetedGrayExpiresAt } from "../utils";
import { ReleaseRuntimeVersionNotice } from "./ReleaseRuntimeVersionNotice";

type CreateReleaseFormState = BuildReleaseFormState & {
  buildRecordId: string;
};

type CreateReleaseDialogProps = {
  buildOptions: BuildRunRecord[];
  isBuildsFetching: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (form: CreateReleaseFormState) => Promise<void>;
  submitError: string;
};

export function CreateReleaseDialog({
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
                        {build.runtimeVersion ? ` / ${build.runtimeVersion}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {selectedBuild ? (
              <div className="truncate text-muted-foreground text-xs">
                {selectedBuild.application} / {selectedBuild.branch}
                {selectedBuild.commitShortSha ? ` @ ${selectedBuild.commitShortSha}` : ""} / #
                {selectedBuild.id.slice(-8)}
              </div>
            ) : null}
          </Field>

          {selectedBuild ? (
            <ReleaseRuntimeVersionNotice runtimeVersion={selectedBuild.runtimeVersion} />
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
                      id="release-create-expires-at"
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
                      className="h-8 text-foreground"
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
