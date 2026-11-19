import { LoaderCircle } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import { BranchPicker } from "@/components/common/BranchPicker";
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from "@/components/common/Drawer";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { BuildCreateFormState, BuildEnvironmentOption, BuildModuleOption } from "../types";
import { Field } from "./Field";

export function BuildCreateDialog({
  environmentOptions,
  isEnvironmentsFetching,
  isModulesFetching,
  isOpen,
  moduleOptions,
  onClose,
  onSubmit,
  submitError,
}: {
  environmentOptions: BuildEnvironmentOption[];
  isEnvironmentsFetching: boolean;
  isModulesFetching: boolean;
  isOpen: boolean;
  moduleOptions: BuildModuleOption[];
  onClose: () => void;
  onSubmit: (form: BuildCreateFormState) => Promise<void>;
  submitError: string;
}) {
  const {
    control,
    formState: { errors, isSubmitting },
    getValues,
    handleSubmit,
    reset,
    setValue,
    watch,
  } = useForm<BuildCreateFormState>({
    defaultValues: {
      branch: "",
      environment: "",
      moduleId: "",
    },
  });
  const hasModuleOptions = moduleOptions.length > 0;
  const hasEnvironmentOptions = environmentOptions.length > 0;
  const selectedModuleId = watch("moduleId");
  const selectedModule = moduleOptions.find((module) => module.value === selectedModuleId);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    reset({
      branch: "",
      environment: "",
      moduleId: "",
    });
  }, [isOpen, reset]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const firstModule = moduleOptions[0];
    const firstEnvironment = environmentOptions[0];
    const currentForm = getValues();

    if (!currentForm.moduleId && firstModule) {
      setValue("moduleId", firstModule.value, { shouldValidate: true });
      if (!currentForm.branch) {
        setValue("branch", firstModule.defaultBranch, { shouldValidate: true });
      }
    }
    if (!currentForm.environment && firstEnvironment) {
      setValue("environment", firstEnvironment.value, { shouldValidate: true });
    }
  }, [environmentOptions, getValues, isOpen, moduleOptions, setValue]);

  if (!isOpen) {
    return null;
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="build-create-dialog-title"
      describedBy="build-create-dialog-description"
      className="max-w-lg"
    >
      <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit(onSubmit)}>
        <DrawerHeader
          onClose={onClose}
          title="新增构建"
          description="选择模块、分支与环境后提交构建，产物会上传到环境绑定的存储配置。"
          titleId="build-create-dialog-title"
          descriptionId="build-create-dialog-description"
        />

        <DrawerBody className="space-y-5">
          <Field label="模块" inputId="build-create-module">
            <Controller
              control={control}
              name="moduleId"
              rules={{ required: "请选择模块" }}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    const nextModule = moduleOptions.find((module) => module.value === value);
                    setValue("branch", nextModule?.defaultBranch ?? "");
                  }}
                >
                  <SelectTrigger id="build-create-module" className="w-full">
                    <SelectValue placeholder={isModulesFetching ? "模块加载中" : "选择模块"} />
                  </SelectTrigger>
                  <SelectContent>
                    {moduleOptions.map((module) => (
                      <SelectItem key={module.value} value={module.value}>
                        {module.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {selectedModule ? (
              <div className="truncate text-muted-foreground text-xs">
                {selectedModule.applicationName || "-"} · {selectedModule.repositoryFullName || "-"}
              </div>
            ) : null}
            {errors.moduleId ? (
              <div className="text-destructive text-xs">{errors.moduleId.message}</div>
            ) : null}
          </Field>

          <Field label="分支" inputId="build-create-branch">
            <Controller
              control={control}
              name="branch"
              rules={{ validate: (value) => (value.trim() ? true : "请输入分支") }}
              render={({ field }) => (
                <BranchPicker
                  id="build-create-branch"
                  moduleId={selectedModuleId}
                  defaultBranch={selectedModule?.defaultBranch}
                  invalid={Boolean(errors.branch)}
                  value={field.value}
                  onBlur={field.onBlur}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.branch ? (
              <div className="text-destructive text-xs">{errors.branch.message}</div>
            ) : null}
          </Field>

          <Field label="环境" inputId="build-create-environment">
            <Controller
              control={control}
              name="environment"
              rules={{ required: "请选择环境" }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="build-create-environment" className="w-full">
                    <SelectValue placeholder={isEnvironmentsFetching ? "环境加载中" : "选择环境"} />
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
            {errors.environment ? (
              <div className="text-destructive text-xs">{errors.environment.message}</div>
            ) : null}
          </Field>

          {submitError ? <Alert variant="danger">{submitError}</Alert> : null}
          {!isModulesFetching && !hasModuleOptions ? (
            <Alert variant="warning">暂无可用模块，请先在模块管理中创建模块。</Alert>
          ) : null}
          {!isEnvironmentsFetching && !hasEnvironmentOptions ? (
            <Alert variant="warning">暂无可用环境，请先在环境管理中创建环境。</Alert>
          ) : null}
        </DrawerBody>

        <DrawerFooter>
          <Button variant="outline" type="button" disabled={isSubmitting} onClick={onClose}>
            取消
          </Button>
          <Button
            type="submit"
            disabled={
              isSubmitting ||
              isModulesFetching ||
              isEnvironmentsFetching ||
              !hasModuleOptions ||
              !hasEnvironmentOptions
            }
          >
            {isSubmitting ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                提交中
              </>
            ) : (
              "提交构建"
            )}
          </Button>
        </DrawerFooter>
      </form>
    </Drawer>
  );
}
