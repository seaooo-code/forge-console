import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Field } from "@/components/common/Field";
import { SectionCard } from "@/components/layout";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

import {
  fetchReleaseHealthPolicies,
  type ReleaseHealthPolicy,
  releaseHealthPoliciesQueryKey,
  updateReleaseHealthPolicy,
} from "../api/release-health-policies";
import type { ReleaseHealthPolicyFormState } from "../types";

/**
 * 应用在各环境的发布健康策略。开启后每分钟按客户端启动上报判定生效发布，比例灰度异常时自动停用，
 * 规则见 forge-server/docs/release-health.md。
 */
export function ApplicationReleaseHealthSection({
  applicationSlug,
  canManage,
}: {
  applicationSlug: string;
  canManage: boolean;
}) {
  const { data: policies = [], error } = useQuery({
    queryFn: () => fetchReleaseHealthPolicies(applicationSlug),
    queryKey: releaseHealthPoliciesQueryKey(applicationSlug),
  });

  return (
    <SectionCard
      title="发布健康"
      description="客户端上报每个模块的启动结果后，Forge 按发布统计启动失败率。开启策略的环境里，比例灰度明显比全量差时会自动停用，全量只标记异常。客户端没有接入上报时，发布显示为「无上报」，不受保护。"
    >
      <div className="space-y-3">
        {error ? <Alert variant="danger">{error.message}</Alert> : null}
        {policies.map((policy) => (
          <PolicyForm
            key={policy.environment}
            applicationSlug={applicationSlug}
            canManage={canManage}
            policy={policy}
          />
        ))}
      </div>
    </SectionCard>
  );
}

function PolicyForm({
  applicationSlug,
  canManage,
  policy,
}: {
  applicationSlug: string;
  canManage: boolean;
  policy: ReleaseHealthPolicy;
}) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<{ text: string; tone: "danger" | "success" } | null>(null);
  const {
    control,
    formState: { errors, isDirty, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<ReleaseHealthPolicyFormState>({ defaultValues: toFormState(policy) });

  useEffect(() => {
    reset(toFormState(policy));
  }, [policy, reset]);

  const idPrefix = `release-health-${policy.environment}`;
  const numberRules = (min: number, max: number, label: string) => ({
    max: { message: `${label}不能大于 ${max}`, value: max },
    min: { message: `${label}不能小于 ${min}`, value: min },
    required: `请填写${label}`,
    valueAsNumber: true as const,
  });

  return (
    <form
      className="space-y-3 rounded-md bg-surface-2 px-3 py-3"
      onSubmit={handleSubmit(async (values) => {
        setMessage(null);
        try {
          const updated = await updateReleaseHealthPolicy(applicationSlug, policy.environment, {
            autoStopGray: values.autoStopGray,
            enabled: values.enabled,
            maxFailureRate: values.maxFailurePercent / 100,
            minDelta: values.minDeltaPercent / 100,
            minUsers: values.minUsers,
            windowMinutes: values.windowMinutes,
          });
          queryClient.setQueryData(releaseHealthPoliciesQueryKey(applicationSlug), updated);
          setMessage({ text: "已保存", tone: "success" });
        } catch (saveError) {
          setMessage({
            text: saveError instanceof Error ? saveError.message : "保存失败，请稍后重试",
            tone: "danger",
          });
        }
      })}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground text-sm">{policy.environmentName}</span>
          <code className="font-mono text-muted-foreground text-xs">{policy.environment}</code>
          {policy.configured ? null : (
            <Badge variant="outline" className="text-muted-foreground">
              默认值
            </Badge>
          )}
        </div>
        <Controller
          control={control}
          name="enabled"
          render={({ field }) => (
            // biome-ignore lint/a11y/noLabelWithoutControl: Checkbox 是 Radix 按钮，label 包住它即可关联
            <label className="flex items-center gap-2 text-foreground text-sm">
              <Checkbox
                checked={field.value}
                disabled={!canManage}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
              开启判定
            </label>
          )}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Field
          label="窗口（分钟）"
          htmlFor={`${idPrefix}-window`}
          error={errors.windowMinutes?.message}
        >
          <Input
            id={`${idPrefix}-window`}
            type="number"
            disabled={!canManage}
            {...register("windowMinutes", numberRules(5, 1440, "窗口"))}
          />
        </Field>
        <Field label="最少用户数" htmlFor={`${idPrefix}-users`} error={errors.minUsers?.message}>
          <Input
            id={`${idPrefix}-users`}
            type="number"
            disabled={!canManage}
            {...register("minUsers", numberRules(1, 1000000, "最少用户数"))}
          />
        </Field>
        <Field
          label="失败率阈值（%）"
          htmlFor={`${idPrefix}-rate`}
          error={errors.maxFailurePercent?.message}
        >
          <Input
            id={`${idPrefix}-rate`}
            type="number"
            step="0.1"
            disabled={!canManage}
            {...register("maxFailurePercent", numberRules(0.1, 100, "失败率阈值"))}
          />
        </Field>
        <Field
          label="高于全量（%）"
          htmlFor={`${idPrefix}-delta`}
          hint="比例灰度要比全量高出这么多才判为异常"
          error={errors.minDeltaPercent?.message}
        >
          <Input
            id={`${idPrefix}-delta`}
            type="number"
            step="0.1"
            disabled={!canManage}
            {...register("minDeltaPercent", numberRules(0, 100, "高于全量"))}
          />
        </Field>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Controller
          control={control}
          name="autoStopGray"
          render={({ field }) => (
            // biome-ignore lint/a11y/noLabelWithoutControl: Checkbox 是 Radix 按钮，label 包住它即可关联
            <label className="flex items-center gap-2 text-muted-foreground text-xs">
              <Checkbox
                checked={field.value}
                disabled={!canManage}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
              比例灰度异常时自动停用（全量只标记异常，不会自动改动）
            </label>
          )}
        />
        {canManage ? (
          <div className="flex items-center gap-2">
            {message ? (
              <span
                className={
                  message.tone === "success" ? "text-success text-xs" : "text-destructive text-xs"
                }
              >
                {message.text}
              </span>
            ) : null}
            <Button size="sm" type="submit" disabled={!isDirty} loading={isSubmitting}>
              保存
            </Button>
          </div>
        ) : null}
      </div>
    </form>
  );
}

function toFormState(policy: ReleaseHealthPolicy): ReleaseHealthPolicyFormState {
  return {
    autoStopGray: policy.autoStopGray,
    enabled: policy.enabled,
    // 换算成百分比后按 0.1 取整，避免浮点误差显示成 5.000000001。
    maxFailurePercent: Math.round(policy.maxFailureRate * 1000) / 10,
    minDeltaPercent: Math.round(policy.minDelta * 1000) / 10,
    minUsers: policy.minUsers,
    windowMinutes: policy.windowMinutes,
  };
}
