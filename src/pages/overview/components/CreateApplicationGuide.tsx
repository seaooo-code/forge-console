import { ArrowRight, GitBranch, PackagePlus, Rocket } from "lucide-react";

import { Button } from "@/components/ui/button";

const steps = [
  {
    description: "填写名称、标识和负责人，选择要接入的环境。",
    icon: PackagePlus,
    title: "创建应用",
  },
  {
    description: "在应用下添加模块，绑定代码仓库和构建方式。",
    icon: GitBranch,
    title: "添加模块",
  },
  {
    description: "触发构建，把产物按全量或灰度发布到环境。",
    icon: Rocket,
    title: "构建并发布",
  },
];

type CreateApplicationGuideProps = {
  canCreate: boolean;
  onCreate: () => void;
};

/** 平台里还没有任何应用时，线上现状没有内容可看，引导用户创建第一个应用。 */
export function CreateApplicationGuide({ canCreate, onCreate }: CreateApplicationGuideProps) {
  return (
    <div className="mt-6 max-w-3xl rounded-2xl bg-card p-6 shadow-edge sm:p-8">
      <h2 className="m-0 font-semibold text-lg tracking-tight">还没有应用，先创建一个</h2>
      <p className="m-0 mt-1.5 text-muted-foreground text-sm leading-relaxed">
        创建应用并发布第一个构建之后，线上现状才会有内容。按下面三步开始。
      </p>

      <ol className="m-0 mt-6 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-3">
        {steps.map(({ description, icon: Icon, title }, index) => (
          <li key={title} className="flex flex-col gap-2.5 rounded-xl bg-muted px-4 py-4">
            <div className="flex items-center gap-2.5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-background text-foreground shadow-edge">
                <Icon className="size-3.5" />
              </span>
              <span className="font-medium text-sm">
                <span className="mr-1.5 text-faint tabular-nums">{index + 1}</span>
                {title}
              </span>
            </div>
            <p className="m-0 text-muted-foreground text-xs leading-relaxed">{description}</p>
          </li>
        ))}
      </ol>

      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button
          className="h-10 gap-2 rounded-xl px-4"
          disabled={!canCreate}
          onClick={onCreate}
          type="button"
        >
          创建应用
          <ArrowRight />
        </Button>
        {canCreate ? null : (
          <span className="text-faint text-xs">你没有创建应用的权限，请联系平台管理员。</span>
        )}
      </div>
    </div>
  );
}
