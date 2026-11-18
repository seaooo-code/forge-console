import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from "@/components/common/Drawer";
import { FormSectionField, FormSectionHeader } from "@/components/common/FormSectionHeader";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createFeishuTenant, feishuTenantsQueryKey, updateFeishuTenant } from "./api";
import { defaultFeishuTenantForm, feishuTenantStatusLabels } from "./constants";
import type { FeishuTenant, FeishuTenantFormState, FeishuTenantStatus } from "./types";

type FeishuTenantFormDrawerProps = {
  /** 编辑的租户；undefined 表示新建。 */
  tenant?: FeishuTenant;
  onClose: () => void;
};

/** 新建、编辑飞书租户的右侧抽屉。App ID 创建后不能修改；编辑时 App Secret 留空表示沿用原值。 */
export function FeishuTenantFormDrawer({ tenant, onClose }: FeishuTenantFormDrawerProps) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(tenant);
  const [formError, setFormError] = useState("");
  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
    register,
    watch,
  } = useForm<FeishuTenantFormState>({
    defaultValues: tenant
      ? {
          appId: tenant.appId,
          appSecret: "",
          id: tenant.id,
          name: tenant.name,
          sortOrder: String(tenant.sortOrder),
          status: tenant.status,
        }
      : defaultFeishuTenantForm,
  });
  const disabling = tenant?.status === "active" && watch("status") === "disabled";

  const onSubmit = async (form: FeishuTenantFormState) => {
    const id = form.id.trim();
    const name = form.name.trim();
    const appId = form.appId.trim();
    const appSecret = form.appSecret.trim();
    const sortOrder = Number(form.sortOrder);
    if (!/^[a-z][a-z0-9-]{1,31}$/.test(id)) {
      setFormError("租户 ID 需以小写字母开头，只能包含小写字母、数字和中划线，长度 2～32");
      return;
    }
    if (!name) {
      setFormError("请填写租户名称");
      return;
    }
    if (!/^cli_[A-Za-z0-9]{8,64}$/.test(appId)) {
      setFormError("App ID 格式不正确，应以 cli_ 开头");
      return;
    }
    if (!isEdit && !appSecret) {
      setFormError("请填写 App Secret");
      return;
    }
    if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 10000) {
      setFormError("排序需为 0～10000 的整数");
      return;
    }

    setFormError("");
    try {
      if (tenant) {
        await updateFeishuTenant(tenant.id, { appSecret, name, sortOrder, status: form.status });
      } else {
        await createFeishuTenant({ appId, appSecret, id, name, sortOrder, status: form.status });
      }
      await queryClient.invalidateQueries({ queryKey: feishuTenantsQueryKey });
      onClose();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "保存失败，请稍后重试");
    }
  };

  return (
    <Drawer isOpen onClose={onClose} className="max-w-xl">
      <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit(onSubmit)}>
        <DrawerHeader
          title={isEdit ? "编辑飞书租户" : "新建飞书租户"}
          description="每个租户对应一个飞书自建应用，用户在登录页选择租户后用该应用授权"
          onClose={onClose}
        />
        <DrawerBody className="space-y-5">
          {formError ? <Alert variant="danger">{formError}</Alert> : null}
          {disabling ? (
            <Alert variant="warning">
              停用后，这个租户的所有用户会立即退出登录，登录页也不再显示它。
            </Alert>
          ) : null}

          <Card className="rounded-lg bg-card p-0">
            <FormSectionHeader title="基础信息" description="租户名称会显示在登录页" />
            <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2">
              <FormSectionField label="租户 ID" required>
                <Input
                  readOnly={isEdit}
                  className={isEdit ? "bg-muted text-muted-foreground" : undefined}
                  placeholder="例如：xiaomi"
                  {...register("id")}
                />
              </FormSectionField>
              <FormSectionField label="租户名称" required>
                <Input placeholder="例如：小米" {...register("name")} />
              </FormSectionField>
              <FormSectionField label="状态">
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => field.onChange(value as FeishuTenantStatus)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(["active", "disabled"] as const).map((status) => (
                          <SelectItem key={status} value={status}>
                            {feishuTenantStatusLabels[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormSectionField>
              <FormSectionField label="排序">
                <Input inputMode="numeric" placeholder="越小越靠前" {...register("sortOrder")} />
              </FormSectionField>
            </div>
          </Card>

          <Card className="rounded-lg bg-card p-0">
            <FormSectionHeader
              title="应用凭证"
              description="在飞书开放平台的应用「凭证与基础信息」页获取。App Secret 加密保存，保存后不再显示"
            />
            <div className="grid gap-4 px-5 pb-5">
              <FormSectionField label="App ID" required>
                <Input
                  readOnly={isEdit}
                  className={isEdit ? "bg-muted font-mono text-muted-foreground" : "font-mono"}
                  placeholder="cli_..."
                  autoComplete="off"
                  {...register("appId")}
                />
              </FormSectionField>
              <FormSectionField label="App Secret" required={!isEdit}>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder={isEdit ? "留空则沿用已保存的密钥" : "粘贴应用的 App Secret"}
                  {...register("appSecret")}
                />
              </FormSectionField>
              <p className="m-0 text-faint text-xs leading-relaxed">
                App ID 创建后不能修改：同一个人在不同应用下的身份不同，换应用请新建租户。
                应用的重定向 URL 白名单里需要加上本平台的登录回调地址。
              </p>
            </div>
          </Card>
        </DrawerBody>
        <DrawerFooter>
          <Button variant="outline" type="button" onClick={onClose}>
            取消
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? "保存修改" : "保存租户"}
          </Button>
        </DrawerFooter>
      </form>
    </Drawer>
  );
}
