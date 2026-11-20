import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { applicationScopeOptionsQueryKey, fetchApplicationScopeOptions } from "@/api/applications";
import { Field } from "@/components/common/Field";
import { Modal, ModalFooter, ModalHeader } from "@/components/common/Modal";
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
import { environmentsSnapshotQueryKey, fetchEnvironmentsSnapshot } from "@/pages/environments";

import { createTestPlan } from "../api";
import { testPlanTtlDayOptions } from "../constants";
import type { TestPlanCreateFormState } from "../types";
import { expiresAtAfterDays } from "../utils";

type TestPlanCreateDialogProps = {
  defaultApplicationId: string;
  isOpen: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
};

/** 新建提测单：先填基本信息，条目和成员进入详情页后再添加。 */
export function TestPlanCreateDialog({
  defaultApplicationId,
  isOpen,
  onClose,
  onCreated,
}: TestPlanCreateDialogProps) {
  const { data: applications = [] } = useQuery({
    enabled: isOpen,
    queryFn: fetchApplicationScopeOptions,
    queryKey: applicationScopeOptionsQueryKey,
  });
  const { data: environmentSnapshot } = useQuery({
    enabled: isOpen,
    queryFn: fetchEnvironmentsSnapshot,
    queryKey: environmentsSnapshotQueryKey,
  });
  const environments = useMemo(
    () => (environmentSnapshot?.environments ?? []).filter((env) => env.allowTestPlans),
    [environmentSnapshot],
  );
  const [submitError, setSubmitError] = useState("");
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<TestPlanCreateFormState>({
    defaultValues: {
      applicationId: defaultApplicationId,
      environment: "",
      link: "",
      name: "",
      ttlDays: "7",
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        applicationId: defaultApplicationId,
        environment: "",
        link: "",
        name: "",
        ttlDays: "7",
      });
      setSubmitError("");
    }
  }, [defaultApplicationId, isOpen, reset]);

  const onSubmit = async (form: TestPlanCreateFormState) => {
    setSubmitError("");
    try {
      const result = await createTestPlan({
        applicationId: form.applicationId,
        environment: form.environment,
        expiresAt: expiresAtAfterDays(form.ttlDays),
        link: form.link.trim(),
        name: form.name.trim(),
      });
      onCreated(result.testPlan.id);
    } catch (cause) {
      setSubmitError(cause instanceof Error ? cause.message : "新建提测单失败");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? undefined : onClose}
      labelledBy="test-plan-create-title"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalHeader
          title="新建提测单"
          titleId="test-plan-create-title"
          description="一个需求一张提测单。建好后在详情页添加要测的模块分支和测试账号。"
        />
        <div className="mt-5 flex flex-col gap-4">
          <Field label="名称" required htmlFor="test-plan-name" error={errors.name?.message}>
            <Input
              id="test-plan-name"
              placeholder="例如：充电页改版"
              {...register("name", {
                validate: (value) => (value.trim() ? true : "请填写名称"),
              })}
            />
          </Field>
          <Field label="应用" required error={errors.applicationId?.message}>
            <Controller
              control={control}
              name="applicationId"
              rules={{ required: "请选择应用" }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择应用" />
                  </SelectTrigger>
                  <SelectContent>
                    {applications.map((application) => (
                      <SelectItem key={application.id} value={application.id}>
                        {application.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field
            label="环境"
            required
            error={errors.environment?.message}
            hint={
              environmentSnapshot && environments.length === 0
                ? "没有开启「允许提测单」的环境，请先在环境设置里开启"
                : "只列出开启了「允许提测单」的环境"
            }
          >
            <Controller
              control={control}
              name="environment"
              rules={{ required: "请选择环境" }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择环境" />
                  </SelectTrigger>
                  <SelectContent>
                    {environments.map((environment) => (
                      <SelectItem key={environment.id} value={environment.id}>
                        {environment.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="关联链接" htmlFor="test-plan-link" hint="需求单或文档地址，可不填">
              <Input id="test-plan-link" placeholder="https://" {...register("link")} />
            </Field>
            <Field label="有效期">
              <Controller
                control={control}
                name="ttlDays"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {testPlanTtlDayOptions.map((days) => (
                        <SelectItem key={days} value={days}>
                          {days} 天
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>
          {submitError ? <Alert variant="danger">{submitError}</Alert> : null}
        </div>
        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            取消
          </Button>
          <Button type="submit" loading={isSubmitting}>
            创建
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
