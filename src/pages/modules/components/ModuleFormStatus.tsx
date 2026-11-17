import { ArrowLeft, GitFork, PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function ModuleFormLoading({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-4 px-6 py-5">
      <Button
        variant="ghost"
        type="button"
        className="-ml-2 h-8 gap-2 px-2 text-muted-foreground hover:bg-hover hover:text-foreground"
        onClick={onBack}
      >
        <ArrowLeft className="size-4" />
        返回模块管理
      </Button>
      <Card className="rounded-lg p-6">
        <div className="space-y-3">
          <div className="h-5 w-36 animate-pulse rounded bg-muted" />
          <div className="h-10 w-full animate-pulse rounded bg-muted" />
          <div className="h-40 w-full animate-pulse rounded bg-muted" />
        </div>
      </Card>
    </div>
  );
}

export function ModuleFormNotFound({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-4 px-6 py-5">
      <Button
        variant="ghost"
        type="button"
        className="-ml-2 h-8 gap-2 px-2 text-muted-foreground hover:bg-hover hover:text-foreground"
        onClick={onBack}
      >
        <ArrowLeft className="size-4" />
        返回模块管理
      </Button>
      <Card className="rounded-lg bg-card p-6">
        <div className="font-semibold text-foreground text-sm">模块不存在</div>
        <p className="mt-1 text-muted-foreground text-sm">当前模块可能已被删除或路径无效。</p>
      </Card>
    </div>
  );
}

export function ModuleCodeSourceRequired({
  onBack,
  onOpenCodeSources,
}: {
  onBack: () => void;
  onOpenCodeSources?: () => void;
}) {
  return (
    <>
      <div className="bg-card px-6 py-5">
        <Button
          variant="ghost"
          type="button"
          className="-ml-2 mb-3 h-8 gap-2 px-2 text-muted-foreground hover:bg-hover hover:text-foreground"
          onClick={onBack}
        >
          <ArrowLeft className="size-4" />
          返回模块管理
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <PackagePlus className="size-5" />
          </div>
          <div>
            <h1 className="font-semibold text-2xl text-foreground tracking-tight">新建模块</h1>
            <p className="mt-2 text-muted-foreground text-sm">
              登记新的模块仓库，配置构建方式，并绑定归属应用与负责人
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-5">
        <Card className="rounded-lg bg-warning/14 p-5 text-warning">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <GitFork className="size-4 shrink-0" />
                需要先配置代码源连接
              </div>
              <p className="mt-2 max-w-2xl text-warning text-sm leading-6">
                当前还没有可用的代码源连接。新建模块需要先选择连接、再从中搜索 Git
                仓库，请先到代码源管理安装 GitHub App 或添加 GitLab 连接。
              </p>
            </div>
            <Button
              type="button"
              className="shrink-0 bg-warning text-warning-foreground hover:bg-warning/90"
              onClick={onOpenCodeSources}
            >
              去代码源管理
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
