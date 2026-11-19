import { CircleHelp } from "lucide-react";
import { type Control, Controller, type UseFormRegister } from "react-hook-form";

import { FormSectionField, FormSectionHeader } from "@/components/common/FormSectionHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

import type { StorageFormState } from "../types";

type StorageConnectionSectionProps = {
  control: Control<StorageFormState>;
  isEditMode: boolean;
  register: UseFormRegister<StorageFormState>;
};

export function StorageConnectionSection({
  control,
  isEditMode,
  register,
}: StorageConnectionSectionProps) {
  return (
    <Card className="rounded-lg bg-card p-0">
      <FormSectionHeader title="接入配置" description="S3 兼容存储连接参数和公开访问地址" />
      <div className="grid gap-4 px-5 pb-5 xl:grid-cols-2">
        <FormSectionField label="Bucket" required>
          <Input placeholder="my-rn-bundles" {...register("bucket")} />
        </FormSectionField>
        <FormSectionField label={<RegionLabel />} required>
          <Input placeholder="例如 cn-beijing / ap-guangzhou" {...register("region")} />
        </FormSectionField>
        <FormSectionField label="Endpoint" required>
          <Input
            placeholder="https://s3.example.com（S3 兼容地址，需带协议）"
            {...register("endpoint")}
          />
        </FormSectionField>
        <FormSectionField label="publicBaseURL">
          <Input placeholder="https://cdn.example.com/rn/prod" {...register("publicBaseUrl")} />
        </FormSectionField>
        <Controller
          control={control}
          name="forcePathStyle"
          render={({ field }) => (
            <div className="flex items-start gap-2 xl:col-span-2">
              <Checkbox
                id="storage-force-path-style"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
              <label
                htmlFor="storage-force-path-style"
                className="cursor-pointer text-sm leading-5"
              >
                <span className="text-foreground">使用路径风格访问（path-style）</span>
                <span className="mt-0.5 block text-muted-foreground text-xs">{pathStyleHint}</span>
              </label>
            </div>
          )}
        />
        <FormSectionField label="Access Key ID" required={!isEditMode}>
          <Input
            placeholder={isEditMode ? "留空表示不更新" : "只保存到服务端密钥托管"}
            {...register("accessKeyId")}
          />
        </FormSectionField>
        <FormSectionField label="Secret Access Key" required={!isEditMode}>
          <Input
            type="password"
            placeholder={isEditMode ? "留空表示不更新" : "创建后不会明文展示"}
            {...register("secretAccessKey")}
          />
        </FormSectionField>
      </div>
    </Card>
  );
}

// 写成一个字符串，避免 JSX 换行在中文句子之间插入空格。
const pathStyleHint =
  "默认把 Bucket 拼进域名（bucket.endpoint）。MinIO、Ceph、FDS 内网域名等没有 Bucket 子域名的服务需要勾选，" +
  "改为 endpoint/bucket；测试连通性时报“无法解析 Endpoint 域名 bucket.xxx”通常就是这个原因。";

function RegionLabel() {
  return (
    <span className="inline-flex items-center gap-1">
      Region
      <span className="group relative inline-flex">
        <Button
          variant="ghost"
          size="icon"
          type="button"
          className="size-5 rounded-full p-0 text-muted-foreground hover:bg-hover hover:text-foreground"
          aria-label="Region 配置说明"
        >
          <CircleHelp className="size-3.5" />
        </Button>
        <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-80 -translate-x-1/2 rounded-md bg-card shadow-edge px-3 py-2 text-left font-normal text-muted-foreground text-xs leading-5 shadow-lg group-focus-within:block group-hover:block">
          AWS S3、阿里云 OSS、腾讯云 COS、华为云 OBS 填写服务商的 Region；MinIO、Ceph RGW
          等私有部署填写服务端配置的 Region，未单独配置时通常为 us-east-1。
        </span>
      </span>
    </span>
  );
}
