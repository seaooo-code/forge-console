import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { CopyableCode } from "@/components/common/CopyableCode";
import { FormSectionField } from "@/components/common/FormSectionHeader";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { fetchSetupRequired, setupFirstFeishuTenant, setupStatusQueryKey } from "./api";

type SetupFormState = {
  appId: string;
  appSecret: string;
  id: string;
  name: string;
  token: string;
};

const callbackURL = `${window.location.origin}/login/feishu/callback`;

/**
 * 平台首次初始化：还没有任何飞书租户时，用服务启动日志里的初始化令牌创建第一个租户。
 * 之后第一个登录的用户成为 SuperAdmin，这个入口永久关闭。
 */
export function SetupPage() {
  const {
    data: setupRequired,
    error,
    refetch,
  } = useQuery({
    queryFn: fetchSetupRequired,
    queryKey: setupStatusQueryKey,
  });
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState("");
  const {
    formState: { isSubmitting },
    handleSubmit,
    register,
  } = useForm<SetupFormState>({
    defaultValues: { appId: "", appSecret: "", id: "", name: "", token: "" },
  });

  const onSubmit = async (form: SetupFormState) => {
    const input = {
      appId: form.appId.trim(),
      appSecret: form.appSecret.trim(),
      id: form.id.trim(),
      name: form.name.trim(),
      token: form.token.trim(),
    };
    if (!input.token || !input.id || !input.name || !input.appId || !input.appSecret) {
      setFormError("请填写全部字段");
      return;
    }
    setFormError("");
    try {
      await setupFirstFeishuTenant(input);
      setDone(true);
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "初始化失败，请稍后重试");
    }
  };

  // 整页跳转，让登录页重新读取租户列表。
  const goLogin = () => window.location.assign("/login");

  return (
    <main className="flex min-h-screen bg-shell p-2 text-foreground">
      <div className="flex flex-1 items-center justify-center rounded-2xl bg-background px-6 py-10 shadow-edge">
        <div className="w-full max-w-lg rounded-2xl bg-card p-8 shadow-raise">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary font-semibold text-primary-foreground text-xs">
              RN
            </span>
            <span className="font-semibold text-sm">RN Bundle 平台</span>
          </div>

          {error ? (
            <div className="mt-6 space-y-3">
              <Alert variant="danger">读取初始化状态失败：{error.message}</Alert>
              <Button variant="outline" type="button" onClick={() => void refetch()}>
                重试
              </Button>
            </div>
          ) : setupRequired === undefined ? (
            <div className="mt-6 h-64 animate-pulse rounded-xl bg-muted" />
          ) : done || !setupRequired ? (
            <div className="mt-6">
              <span className="flex size-9 items-center justify-center rounded-xl bg-success/12 text-success">
                <CheckCircle2 className="size-4.5" />
              </span>
              <h1 className="m-0 mt-5 font-semibold text-xl tracking-tight">
                {done ? "初始化完成" : "平台已经初始化"}
              </h1>
              <p className="m-0 mt-2 text-muted-foreground text-sm leading-relaxed">
                {done
                  ? "现在去登录。第一个登录的用户会成为 SuperAdmin，请你自己先完成登录。"
                  : "已经有飞书租户了，初始化入口已关闭。"}
              </p>
              <Button
                className="mt-6 h-11 w-full justify-between rounded-xl px-4"
                type="button"
                onClick={goLogin}
              >
                前往登录
                <ArrowRight />
              </Button>
            </div>
          ) : (
            <form className="mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <h1 className="m-0 font-semibold text-xl tracking-tight">初始化平台</h1>
                <p className="m-0 mt-2 text-muted-foreground text-sm leading-relaxed">
                  平台还没有可登录的飞书租户。填写第一个飞书自建应用的凭证，完成后第一个登录的用户成为
                  SuperAdmin。
                </p>
              </div>
              {formError ? <Alert variant="danger">{formError}</Alert> : null}

              <FormSectionField label="初始化令牌" required>
                <Input
                  type="password"
                  autoComplete="off"
                  placeholder="服务启动日志里 setupToken 的值"
                  {...register("token")}
                />
              </FormSectionField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormSectionField label="租户 ID" required>
                  <Input placeholder="例如：xiaomi" {...register("id")} />
                </FormSectionField>
                <FormSectionField label="租户名称" required>
                  <Input placeholder="例如：小米" {...register("name")} />
                </FormSectionField>
              </div>
              <FormSectionField label="App ID" required>
                <Input
                  className="font-mono"
                  autoComplete="off"
                  placeholder="cli_..."
                  {...register("appId")}
                />
              </FormSectionField>
              <FormSectionField label="App Secret" required>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="飞书应用的 App Secret，加密保存"
                  {...register("appSecret")}
                />
              </FormSectionField>
              <div className="rounded-xl bg-muted px-4 py-3 text-muted-foreground text-xs leading-relaxed">
                在飞书开放平台的应用「安全设置 → 重定向 URL」里添加：
                <CopyableCode className="my-1.5" label="回调地址" value={callbackURL} />
                并在「权限管理」开通：持续访问已授权数据、搜索用户、获取通讯录基本信息、获取用户邮箱。
              </div>

              <Button
                className="h-11 w-full justify-between rounded-xl px-4"
                loading={isSubmitting}
                type="submit"
              >
                完成初始化
                <ArrowRight />
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
