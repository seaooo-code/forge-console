import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Field } from "@/components/common/Field";
import { Modal, ModalFooter, ModalHeader } from "@/components/common/Modal";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type { TestPlanMemberFormState } from "../types";

type TestPlanMemberDialogProps = {
  error: string;
  isOpen: boolean;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (form: TestPlanMemberFormState) => void;
};

const userIdPattern = /^[A-Za-z0-9._-]{1,64}$/;

/** 添加成员：成员是客户端请求 manifest 时上报的 userId（例如登录账号 ID），不是 Forge 用户。 */
export function TestPlanMemberDialog({
  error,
  isOpen,
  isPending,
  onClose,
  onSubmit,
}: TestPlanMemberDialogProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<TestPlanMemberFormState>({ defaultValues: { note: "", userId: "" } });

  useEffect(() => {
    if (isOpen) {
      reset({ note: "", userId: "" });
    }
  }, [isOpen, reset]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={isPending ? undefined : onClose}
      labelledBy="test-plan-member-title"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalHeader
          title="添加成员"
          titleId="test-plan-member-title"
          description="填写客户端上报的 userId，例如测试账号的账号 ID。App 调试面板里可以看到当前 userId。"
        />
        <div className="mt-5 flex flex-col gap-4">
          <Field
            label="userId"
            required
            htmlFor="test-plan-member-user"
            error={errors.userId?.message}
          >
            <Input
              id="test-plan-member-user"
              className="font-mono"
              placeholder="例如：1001"
              {...register("userId", {
                validate: (value) =>
                  userIdPattern.test(value.trim()) ? true : "1 到 64 位字母、数字和 . _ -",
              })}
            />
          </Field>
          <Field label="备注" htmlFor="test-plan-member-note" hint="例如账号属于谁，可不填">
            <Input id="test-plan-member-note" maxLength={64} {...register("note")} />
          </Field>
          {error ? <Alert variant="danger">{error}</Alert> : null}
        </div>
        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            取消
          </Button>
          <Button type="submit" loading={isPending}>
            添加
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
