import { ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GuideStep = {
  /** 当前步骤的入口按钮；没有入口的步骤只作说明。 */
  action?: { allowed: boolean; deniedHint: string; label: string; run: () => void };
  description: string;
  done: boolean;
  title: string;
};

type CreateApplicationGuideProps = {
  capabilities: { application: boolean; environment: boolean; storage: boolean };
  /** 存储和环境的数量还没读到时为 false，此时不判断进度，也不显示入口。 */
  isReady: boolean;
  onCreateApplication: () => void;
  onCreateEnvironment: () => void;
  onCreateStorage: () => void;
  progress: { environmentCount: number; storageCount: number };
};

/**
 * 平台里还没有任何应用时，线上现状没有内容可看。创建应用依赖环境，环境依赖存储，
 * 所以按依赖顺序列出起步清单，高亮第一个还没完成的步骤并给出入口。
 */
export function CreateApplicationGuide({
  capabilities,
  isReady,
  onCreateApplication,
  onCreateEnvironment,
  onCreateStorage,
  progress,
}: CreateApplicationGuideProps) {
  // 读不到存储列表的用户（没有存储权限）：已经有环境就说明存储一定配置过。
  const hasEnvironment = progress.environmentCount > 0;
  const hasStorage = progress.storageCount > 0 || hasEnvironment;

  const steps: GuideStep[] = [
    {
      action: {
        allowed: capabilities.storage,
        deniedHint: "需要存储管理权限，请联系平台管理员。",
        label: "添加存储",
        run: onCreateStorage,
      },
      description: "配置存放构建产物的 S3 兼容对象存储。",
      done: hasStorage,
      title: "添加存储",
    },
    {
      action: {
        allowed: capabilities.environment,
        deniedHint: "需要环境管理权限，请联系平台管理员。",
        label: "创建环境",
        run: onCreateEnvironment,
      },
      description: "环境必须绑定一个存储配置，构建产物会发布到这个存储里。",
      done: hasEnvironment,
      title: "创建环境",
    },
    {
      action: {
        allowed: capabilities.application,
        deniedHint: "你没有创建应用的权限，请联系平台管理员。",
        label: "创建应用",
        run: onCreateApplication,
      },
      description: "填写名称、标识和负责人，并接入至少一个环境。",
      done: false,
      title: "创建应用",
    },
    {
      description: "在应用下添加模块，绑定代码仓库和构建方式，触发构建后按全量或灰度发布。",
      done: false,
      title: "添加模块并发布",
    },
  ];
  const currentIndex = isReady ? steps.findIndex((step) => !step.done) : -1;

  return (
    <div className="mt-6 max-w-3xl rounded-2xl bg-card p-6 shadow-edge sm:p-8">
      <h2 className="m-0 font-semibold text-lg tracking-tight">还没有应用，先完成这几步</h2>
      <p className="m-0 mt-1.5 text-muted-foreground text-sm leading-relaxed">
        创建应用并发布第一个构建之后，线上现状才会有内容。应用依赖环境，环境依赖存储，按顺序来。
      </p>

      <ol className="m-0 mt-5 flex list-none flex-col gap-2 p-0">
        {steps.map((step, index) => {
          const isCurrent = index === currentIndex;
          const { action } = step;
          return (
            <li
              key={step.title}
              className={cn(
                "flex items-start gap-3 rounded-xl px-4 py-3.5",
                isCurrent ? "bg-primary-soft ring-1 ring-primary/40 ring-inset" : "bg-muted",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full font-medium text-xs tabular-nums",
                  step.done
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground shadow-edge",
                )}
              >
                {step.done ? <Check className="size-3.5" /> : index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className={cn("font-medium text-sm", step.done && "text-muted-foreground")}>
                  {step.title}
                  {step.done ? (
                    <span className="ml-2 font-normal text-faint text-xs">已完成</span>
                  ) : null}
                </div>
                <p className="m-0 mt-0.5 text-muted-foreground text-xs leading-relaxed">
                  {step.description}
                </p>
                {isCurrent && action && !action.allowed ? (
                  <p className="m-0 mt-1.5 text-faint text-xs">{action.deniedHint}</p>
                ) : null}
              </div>
              {isCurrent && action ? (
                <Button
                  className="h-8 shrink-0 gap-1.5 rounded-lg px-3"
                  disabled={!action.allowed}
                  onClick={action.run}
                  size="sm"
                  type="button"
                >
                  {action.label}
                  <ArrowRight />
                </Button>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
