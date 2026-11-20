import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

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

import type { TestPlanRecord } from "../api";
import { testPlanTtlDayOptions } from "../constants";

export type TestPlanSettingsForm = {
  name: string;
  link: string;
  /** 为空表示不修改有效期。 */
  ttlDays: string;
};

type TestPlanSettingsDialogProps = {
  error: string;
  isOpen: boolean;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (form: TestPlanSettingsForm) => void;
  plan: TestPlanRecord;
};

const keepExpiry = "keep";

/** 修改名称、链接，以及把有效期改为从现在起若干天（最长 30 天）。 */
export function TestPlanSettingsDialog({
  error,
  isOpen,
  isPending,
  onClose,
  onSubmit,
  plan,
}: TestPlanSettingsDialogProps) {
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<TestPlanSettingsForm>({
    defaultValues: { link: plan.link, name: plan.name, ttlDays: keepExpiry },
  });

  useEffect(() => {
    if (isOpen) {
      reset({ link: plan.link, name: plan.name, ttlDays: keepExpiry });
    }
  }, [isOpen, plan.link, plan.name, reset]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={isPending ? undefined : onClose}
      labelledBy="test-plan-settings-title"
    >
      <form
        onSubmit={handleSubmit((form) =>
          onSubmit({ ...form, ttlDays: form.ttlDays === keepExpiry ? "" : form.ttlDays }),
        )}
      >
        <ModalHeader title="编辑提测单" titleId="test-plan-settings-title" />
        <div className="mt-5 flex flex-col gap-4">
          <Field
            label="名称"
            required
            htmlFor="test-plan-settings-name"
            error={errors.name?.message}
          >
            <Input
              id="test-plan-settings-name"
              {...register("name", { validate: (value) => (value.trim() ? true : "请填写名称") })}
            />
          </Field>
          <Field label="关联链接" htmlFor="test-plan-settings-link">
            <Input id="test-plan-settings-link" placeholder="https://" {...register("link")} />
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
                    <SelectItem value={keepExpiry}>不修改</SelectItem>
                    {testPlanTtlDayOptions.map((days) => (
                      <SelectItem key={days} value={days}>
                        从现在起 {days} 天
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          {error ? <Alert variant="danger">{error}</Alert> : null}
        </div>
        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            取消
          </Button>
          <Button type="submit" loading={isPending}>
            保存
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
