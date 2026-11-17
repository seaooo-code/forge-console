import { Check, Copy, KeyRound } from "lucide-react";
import { type FormEvent, type ReactNode, useState } from "react";
import { type Control, Controller, type FieldErrors } from "react-hook-form";

import { DrawerBody, DrawerFooter, DrawerHeader } from "@/components/common/Drawer";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Input } from "@/components/ui/input";

import type { AccessTokenFormState } from "../utils";

type CreateAccessTokenFormProps = {
  canManageAccessTokens: boolean;
  control: Control<AccessTokenFormState>;
  errors: FieldErrors<AccessTokenFormState>;
  generatedToken: string;
  isCreating: boolean;
  isGenerating: boolean;
  onClose: () => void;
  onGenerate: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function CreateAccessTokenForm({
  canManageAccessTokens,
  control,
  errors,
  generatedToken,
  isCreating,
  isGenerating,
  onClose,
  onGenerate,
  onSubmit,
}: CreateAccessTokenFormProps) {
  const [copied, setCopied] = useState(false);
  const copyToken = () => {
    void navigator.clipboard?.writeText(generatedToken).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <form className="flex min-h-0 flex-1 flex-col" onSubmit={onSubmit}>
      <DrawerHeader
        title="新建访问令牌"
        description="先生成明文令牌，再填写名称和过期时间保存。"
        onClose={onClose}
      />
      <DrawerBody className="space-y-5">
        <div className="rounded-lg bg-surface-2 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-medium text-foreground text-xs">明文令牌</div>
              <div className="mt-1 text-muted-foreground text-xs">
                服务端生成，保存后只在弹窗中再次提示复制
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canManageAccessTokens || isGenerating || isCreating}
              onClick={onGenerate}
            >
              <KeyRound className="size-4" />
              {isGenerating ? "生成中" : "生成令牌"}
            </Button>
          </div>
          {generatedToken ? (
            <div className="mt-3 flex flex-col gap-2">
              <code className="min-w-0 overflow-x-auto rounded-md bg-card shadow-edge px-3 py-2 font-mono text-foreground text-xs">
                {generatedToken}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={copyToken}
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "已复制" : "复制"}
              </Button>
            </div>
          ) : null}
        </div>
        <Controller
          control={control}
          name="name"
          rules={{ required: "请输入令牌名称" }}
          render={({ field }) => (
            <Field id="access-token-name" label="名称" error={errors.name?.message}>
              <Input {...field} id="access-token-name" placeholder="Bundle 客户端" />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="expiresAt"
          render={({ field }) => (
            <Field id="access-token-expires-at" label="过期时间" error={errors.expiresAt?.message}>
              <DateTimePicker
                ref={field.ref}
                id="access-token-expires-at"
                value={field.value}
                invalid={Boolean(errors.expiresAt)}
                onBlur={field.onBlur}
                onChange={field.onChange}
              />
            </Field>
          )}
        />
      </DrawerBody>
      <DrawerFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          取消
        </Button>
        <Button
          type="submit"
          loading={isCreating}
          disabled={!canManageAccessTokens || !generatedToken}
        >
          保存令牌
        </Button>
      </DrawerFooter>
    </form>
  );
}

function Field({
  children,
  error,
  id,
  label,
}: {
  children: ReactNode;
  error?: string;
  id: string;
  label: string;
}) {
  return (
    <div className="block space-y-1.5">
      <label htmlFor={id} className="font-medium text-foreground text-xs">
        {label}
      </label>
      {children}
      {error ? <span className="text-destructive text-xs">{error}</span> : null}
    </div>
  );
}
