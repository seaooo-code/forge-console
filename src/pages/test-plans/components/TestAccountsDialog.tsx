import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import { environmentsSnapshotQueryKey, fetchEnvironmentsSnapshot } from "@/pages/environments";

import {
  deleteMyTestAccount,
  fetchMyTestAccounts,
  saveMyTestAccount,
  testAccountsQueryKey,
} from "../api";
import type { TestAccountFormState } from "../types";

type TestAccountsDialogProps = {
  defaultEnvironment?: string;
  isOpen: boolean;
  onClose: () => void;
};

const userIdPattern = /^[A-Za-z0-9._-]{1,64}$/;

/**
 * 我的测试账号：按环境保存常用的客户端 userId，加入提测单时一键带上。
 * 不同环境的账号体系可能不同，同一个数值在两个环境里可能是两个人，所以按环境区分。
 */
export function TestAccountsDialog({
  defaultEnvironment = "",
  isOpen,
  onClose,
}: TestAccountsDialogProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const { data: accounts = [], isFetching } = useQuery({
    enabled: isOpen,
    queryFn: fetchMyTestAccounts,
    queryKey: testAccountsQueryKey,
  });
  const { data: environmentSnapshot } = useQuery({
    enabled: isOpen,
    queryFn: fetchEnvironmentsSnapshot,
    queryKey: environmentsSnapshotQueryKey,
  });
  const environments = environmentSnapshot?.environments ?? [];
  const environmentNames = useMemo(
    () => Object.fromEntries(environments.map((env) => [env.id, env.name])),
    [environments],
  );
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<TestAccountFormState>({
    defaultValues: { environment: defaultEnvironment, note: "", userId: "" },
  });

  useEffect(() => {
    if (isOpen) {
      reset({ environment: defaultEnvironment, note: "", userId: "" });
      setError("");
    }
  }, [defaultEnvironment, isOpen, reset]);

  const onChanged = () => void queryClient.invalidateQueries({ queryKey: testAccountsQueryKey });
  const save = useMutation({
    mutationFn: (form: TestAccountFormState) =>
      saveMyTestAccount({
        environment: form.environment,
        note: form.note.trim(),
        userId: form.userId.trim(),
      }),
    onError: (cause) => setError(cause instanceof Error ? cause.message : "保存测试账号失败"),
    onSuccess: (_, form) => {
      setError("");
      reset({ environment: form.environment, note: "", userId: "" });
      onChanged();
    },
  });
  const remove = useMutation({
    mutationFn: ({ environment, userId }: { environment: string; userId: string }) =>
      deleteMyTestAccount(environment, userId),
    onError: (cause) => setError(cause instanceof Error ? cause.message : "删除测试账号失败"),
    onSuccess: onChanged,
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} labelledBy="test-accounts-title" className="max-w-lg">
      <ModalHeader
        title="我的测试账号"
        titleId="test-accounts-title"
        description="保存你常用的客户端 userId。加入提测单时会用这些账号，只在同一环境生效。"
      />
      <div className="mt-4 flex max-h-64 flex-col gap-1.5 overflow-y-auto">
        {accounts.length === 0 ? (
          <p className="m-0 rounded-lg bg-muted px-3 py-3 text-muted-foreground text-sm">
            {isFetching ? "加载中" : "还没有测试账号"}
          </p>
        ) : (
          accounts.map((account) => (
            <div
              key={`${account.environment}-${account.userId}`}
              className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2 text-sm"
            >
              <span className="w-24 shrink-0 truncate text-muted-foreground text-xs">
                {environmentNames[account.environment] ?? account.environment}
              </span>
              <span className="font-mono">{account.userId}</span>
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{account.note}</span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-7"
                aria-label={`删除测试账号 ${account.userId}`}
                onClick={() =>
                  remove.mutate({ environment: account.environment, userId: account.userId })
                }
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))
        )}
      </div>
      <form
        className="mt-5 flex flex-col gap-3"
        onSubmit={handleSubmit((form) => save.mutate(form))}
      >
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Field label="环境" required error={errors.environment?.message}>
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
                    {environments.map((env) => (
                      <SelectItem key={env.id} value={env.id}>
                        {env.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="userId" required htmlFor="test-account-user" error={errors.userId?.message}>
            <Input
              id="test-account-user"
              className="font-mono"
              placeholder="例如：1001"
              {...register("userId", {
                validate: (value) =>
                  userIdPattern.test(value.trim()) ? true : "1 到 64 位字母、数字和 . _ -",
              })}
            />
          </Field>
        </div>
        <Field label="备注" htmlFor="test-account-note">
          <Input
            id="test-account-note"
            maxLength={64}
            placeholder="例如：测试号 2"
            {...register("note")}
          />
        </Field>
        {error ? <Alert variant="danger">{error}</Alert> : null}
        <ModalFooter className="mt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            完成
          </Button>
          <Button type="submit" loading={save.isPending}>
            保存账号
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
