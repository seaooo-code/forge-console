import {
  ArrowLeft,
  Bell,
  GitBranch,
  Layers3,
  type LucideIcon,
  MonitorSmartphone,
  PackagePlus,
  ShieldCheck,
} from "lucide-react";
import type { ReactNode } from "react";

import { MockCard as Card } from "@/components/common/MockSurface";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ApplicationCreatePageProps = {
  onBack: () => void;
};

const platformOptions = ["iOS", "Android", "HarmonyOS", "Android TV"];

const environmentOptions = [
  { label: "dev", value: "dev" },
  { label: "staging", value: "staging" },
  { label: "preview", value: "preview" },
  { label: "preProduct", value: "preProduct" },
  { label: "product", value: "product" },
];

export function ApplicationCreatePage({ onBack }: ApplicationCreatePageProps) {
  return (
    <>
      <div className="border-slate-200 border-b bg-white px-6 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <Button
              variant="ghost"
              type="button"
              className="-ml-2 mb-3 h-8 gap-2 px-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              onClick={onBack}
            >
              <ArrowLeft className="size-4" />
              返回应用管理
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                <PackagePlus className="size-5" />
              </div>
              <div>
                <h1 className="font-semibold text-2xl text-slate-950 tracking-tight">新建应用</h1>
                <p className="mt-2 text-slate-600 text-sm">
                  接入新的宿主应用，初始化 RN Bundle 环境、模块仓库和发布策略
                </p>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" type="button" onClick={onBack}>
              取消
            </Button>
            <Button variant="outline" type="button">
              保存草稿
            </Button>
            <Button type="button" className="bg-blue-600 hover:bg-blue-700">
              创建应用
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 px-6 py-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <Card className="gap-0 rounded-lg border-slate-200 py-0 shadow-sm">
            <SectionHeader
              icon={MonitorSmartphone}
              title="基础信息"
              description="应用唯一标识、平台和负责人"
            />
            <div className="grid gap-4 p-4 md:grid-cols-2">
              <Field label="应用名称">
                <Input defaultValue="小米汽车海外版" placeholder="输入应用名称" />
              </Field>
              <Field label="应用标识">
                <Input defaultValue="mi-car-global" placeholder="例如 mi-car-global" />
              </Field>
              <Field label="负责人">
                <Input defaultValue="li.ming" placeholder="输入负责人账号" />
              </Field>
              <Field label="归属团队">
                <Input defaultValue="小米汽车 - RN 平台组" placeholder="输入团队名称" />
              </Field>
              <Field label="接入平台" className="md:col-span-2">
                <div className="grid gap-2 md:grid-cols-4">
                  {platformOptions.map((platform) => (
                    <CheckOption
                      key={platform}
                      checked={platform !== "Android TV"}
                      label={platform}
                    />
                  ))}
                </div>
              </Field>
            </div>
          </Card>

          <Card className="gap-0 rounded-lg border-slate-200 py-0 shadow-sm">
            <SectionHeader
              icon={GitBranch}
              title="仓库与命名空间"
              description="用于拉取模块代码、生成 Bundle 产物和隔离 CDN 路径"
            />
            <div className="grid gap-4 p-4 md:grid-cols-2">
              <Field label="Git 仓库组">
                <Input defaultValue="git@git.mi.com:mi-car-global-rn" />
              </Field>
              <Field label="默认分支">
                <Input defaultValue="main" />
              </Field>
              <Field label="Bundle Namespace">
                <Input defaultValue="com.xiaomi.micar.global.rn" />
              </Field>
              <Field label="包名">
                <Input defaultValue="com.xiaomi.micar.global" />
              </Field>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="gap-0 rounded-lg border-slate-200 py-0 shadow-sm">
            <SectionHeader
              icon={Layers3}
              title="环境接入"
              description="小米汽车当前支持的五套环境"
            />
            <div className="space-y-3 p-4">
              {environmentOptions.map((environment) => (
                <div
                  key={environment.value}
                  className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5"
                >
                  <CheckOption checked label={environment.label} />
                  <Select defaultValue={environment.value === "product" ? "approval" : "auto"}>
                    <SelectTrigger className="h-8 w-32 bg-white text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">自动部署</SelectItem>
                      <SelectItem value="approval">审批部署</SelectItem>
                      <SelectItem value="manual">手动部署</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </Card>

          <Card className="gap-0 rounded-lg border-slate-200 py-0 shadow-sm">
            <SectionHeader
              icon={ShieldCheck}
              title="发布策略"
              description="生产发布、灰度和回滚准入"
            />
            <div className="grid gap-4 p-4">
              <Field label="生产发布准入">
                <Select defaultValue="approval-gray">
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approval-gray">审批后灰度</SelectItem>
                    <SelectItem value="approval-full">审批后全量</SelectItem>
                    <SelectItem value="blocked">禁止生产发布</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="默认流水线模板">
                <Select defaultValue="rn-standard">
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rn-standard">RN Standard Pipeline</SelectItem>
                    <SelectItem value="vehicle">Vehicle Pipeline</SelectItem>
                    <SelectItem value="ai">AI Pipeline</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </Card>

          <Card className="gap-0 rounded-lg border-slate-200 py-0 shadow-sm">
            <SectionHeader
              icon={Bell}
              title="通知订阅"
              description="接入后默认订阅构建、发布和告警通知"
            />
            <div className="space-y-2 p-4">
              <CheckOption checked label="飞书机器人 release-notify" />
              <CheckOption checked label="钉钉群 RN 平台-发布" />
              <CheckOption checked label="企业邮件 rn-platform@xiaomi.com" />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function SectionHeader({
  description,
  icon: Icon,
  title,
}: {
  description: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="flex h-14 items-center gap-3 border-slate-200 border-b px-4">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-slate-900 text-sm">{title}</div>
        <div className="truncate text-slate-500 text-xs">{description}</div>
      </div>
    </div>
  );
}

function Field({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <div className={className}>
      <div className="mb-2 font-medium text-slate-600 text-xs">{label}</div>
      {children}
    </div>
  );
}

function CheckOption({ checked, label }: { checked?: boolean; label: string }) {
  return (
    <div className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-slate-700 text-sm">
      <Checkbox defaultChecked={checked} />
      <span>{label}</span>
    </div>
  );
}
