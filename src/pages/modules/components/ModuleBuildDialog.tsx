import { type ReactNode, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from "@/components/common/Drawer";
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

import type { ModuleBuildFormState, ModuleRecord } from "../types";

export function ModuleBuildDialog({
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
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="module-build-dialog-title"
      describedBy="module-build-dialog-description"
      className="max-w-lg"
    >
      <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit(onSubmit)}>
        <DrawerHeader
          onClose={onClose}
          title="新增构建"
          titleId="module-build-dialog-title"
          descriptionId="module-build-dialog-description"
          description={`为「${module.name}」创建构建记录，产物将上传到所选环境绑定的存储配置。`}
        />

        <DrawerBody className="space-y-5">
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
          </Field>
          {submitError ? <Alert variant="danger">{submitError}</Alert> : null}
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
            disabled={isSubmitting || isEnvironmentsFetching || !hasEnvironmentOptions}
          >
            {isSubmitting ? "提交中" : "提交构建"}
          </Button>
        </DrawerFooter>
      </form>
    </Drawer>
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
      <label htmlFor={inputId} className="font-medium text-muted-foreground text-xs">
        {label}
      </label>
      {children}
    </div>
  );
}
