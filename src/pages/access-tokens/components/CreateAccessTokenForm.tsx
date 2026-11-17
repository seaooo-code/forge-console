import { Copy, KeyRound, Plus } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { type Control, Controller, type FieldErrors } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  onGenerate,
  onSubmit,
}: CreateAccessTokenFormProps) {
  return (
    <Card className="h-fit rounded-xl bg-card p-5">
      <div className="flex items-center gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-success/10 text-success">
          <Plus className="size-4" />
        </div>
        <div>
          <h2 className="font-semibold text-foreground text-sm">新增令牌</h2>
          <p className="text-muted-foreground text-xs">先生成明文令牌，再保存访问配置</p>
        </div>
      </div>

      <form className="mt-5 space-y-4" onSubmit={onSubmit}>
        <div className="rounded-lg border border-border bg-muted p-3">
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
              <code className="min-w-0 overflow-x-auto rounded-md border border-border bg-card px-3 py-2 font-mono text-foreground text-xs">
                {generatedToken}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => void navigator.clipboard?.writeText(generatedToken)}
              >
                <Copy className="size-4" />
                复制
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
        <Button
          type="submit"
          disabled={!canManageAccessTokens || isCreating || !generatedToken}
          className="w-full bg-primary hover:bg-primary/90"
        >
          <Plus className="size-4" />
          {isCreating ? "创建中" : "保存令牌"}
        </Button>
      </form>
    </Card>
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
