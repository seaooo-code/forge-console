import { CircleHelp } from "lucide-react";
import type { UseFormRegister } from "react-hook-form";

import { FormSectionField, FormSectionHeader } from "@/components/common/FormSectionHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import type { StorageFormState } from "../types";

type StorageConnectionSectionProps = {
  isEditMode: boolean;
  register: UseFormRegister<StorageFormState>;
};

export function StorageConnectionSection({ isEditMode, register }: StorageConnectionSectionProps) {
  return (
    <Card className="rounded-lg border-border bg-card p-0 shadow-none">
      <FormSectionHeader title="接入配置" description="S3 兼容存储连接参数和公开访问地址" />
      <div className="grid gap-4 px-5 pb-5 xl:grid-cols-2">
        <FormSectionField label="Bucket" required>
          <Input placeholder="xiaomi-auto-rn-prod" {...register("bucket")} />
        </FormSectionField>
        <FormSectionField label={<RegionLabel />}>
          <Input placeholder="可选，例如 cn-beijing / ap-guangzhou" {...register("region")} />
        </FormSectionField>
        <FormSectionField label="Endpoint" required>
          <Input placeholder="oss-cn-beijing.aliyuncs.com" {...register("endpoint")} />
        </FormSectionField>
        <FormSectionField label="publicBaseURL">
          <Input placeholder="https://cdn.example.com/rn/prod" {...register("publicBaseUrl")} />
        </FormSectionField>
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

function RegionLabel() {
  return (
    <span className="inline-flex items-center gap-1">
      Region
      <span className="font-normal text-muted-foreground text-xs">可选</span>
      <span className="group relative inline-flex">
        <Button
          variant="ghost"
          size="icon"
          type="button"
          className="size-5 rounded-full p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Region 配置说明"
        >
          <CircleHelp className="size-3.5" />
        </Button>
        <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-80 -translate-x-1/2 rounded-md border border-border bg-card px-3 py-2 text-left font-normal text-muted-foreground text-xs leading-5 shadow-lg group-focus-within:block group-hover:block">
          AWS S3、阿里云 OSS、腾讯云 COS、华为云 OBS 通常需要填写 Region；MinIO、Ceph RGW
          等私有部署可按服务端配置填写或留空。
        </span>
      </span>
    </span>
  );
}
