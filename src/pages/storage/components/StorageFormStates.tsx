import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function StorageFormLoading({ onBack }: { onBack: () => void }) {
  return (
    <>
      <div className="bg-card px-6 py-5">
        <Button
          variant="ghost"
          type="button"
          className="-ml-2 mb-3 h-8 gap-2 px-2 text-muted-foreground"
          onClick={onBack}
        >
          <ArrowLeft className="size-4" />
          返回存储管理
        </Button>
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />
      </div>
      <div className="space-y-4 px-6 py-5">
        <Card className="h-48 animate-pulse rounded-lg bg-card" />
        <Card className="h-64 animate-pulse rounded-lg bg-card" />
      </div>
    </>
  );
}

export function StorageFormNotFound({ onBack }: { onBack: () => void }) {
  return (
    <div className="bg-card px-6 py-5">
      <Button
        variant="ghost"
        type="button"
        className="-ml-2 mb-3 h-8 gap-2 px-2 text-muted-foreground hover:bg-hover hover:text-foreground"
        onClick={onBack}
      >
        <ArrowLeft className="size-4" />
        返回存储管理
      </Button>
      <h1 className="font-semibold text-2xl text-foreground tracking-tight">存储配置不存在</h1>
      <p className="mt-2 text-muted-foreground text-sm">当前配置可能已被删除或路径无效。</p>
    </div>
  );
}
