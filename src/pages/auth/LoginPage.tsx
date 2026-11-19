import { useQuery } from "@tanstack/react-query";
import { ArrowRight, GitCompare, Layers, Undo2 } from "lucide-react";
import { useEffect, useState } from "react";

import {
  beginFeishuAuthorization,
  clearPendingFeishuLogin,
  fetchLoginTenants,
  readLastLoginTenant,
  readPendingFeishuLogin,
} from "@/api/feishu-auth";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { fetchSetupRequired, setupStatusQueryKey } from "./api";
import { FeishuRedirectNotice } from "./components/FeishuRedirectNotice";

type LoginPageProps = {
  redirectPath: string;
};

const highlights = [
  { icon: Layers, text: "按模块和环境查看线上是哪个构建，全量与灰度一起看" },
  { icon: GitCompare, text: "发布前对比与当前全量的提交差异" },
  { icon: Undo2, text: "出问题时直接回退到更早的构建" },
];

export function LoginPage({ redirectPath }: LoginPageProps) {
  return (
    <main className="flex min-h-screen bg-shell p-2 text-foreground">
      <div className="grid w-full flex-1 overflow-hidden rounded-2xl bg-background shadow-edge lg:grid-cols-[minmax(0,1fr)_minmax(400px,0.8fr)]">
        <section className="flex min-w-0 flex-col px-8 py-8 sm:px-12 lg:py-10">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary font-semibold text-primary-foreground text-xs">
              RN
            </span>
            <span className="font-semibold text-sm">RN Bundle 平台</span>
          </div>

          <div className="my-auto max-w-xl py-12">
            <h1 className="m-0 font-semibold text-4xl leading-tight tracking-tight">
              构建、灰度发布和回退
              <br />
              RN 业务包
            </h1>
            <ul className="m-0 mt-8 flex list-none flex-col gap-3.5 p-0">
              {highlights.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-muted-foreground text-sm">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                    <Icon className="size-3.5" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>

            <RoutePreview />
          </div>
        </section>

        <section className="flex items-center justify-center bg-shell/60 px-8 py-12 lg:bg-transparent">
          <div className="w-full max-w-sm rounded-2xl bg-card p-8 shadow-raise">
            <h2 className="m-0 font-semibold text-xl tracking-tight">登录</h2>
            <p className="m-0 mt-2 text-muted-foreground text-sm leading-relaxed">
              使用飞书账号登录。能看到哪些应用、能否发布，跟随你在平台里的角色。
            </p>
            <LoginAction redirectPath={redirectPath} />
            <PendingLoginNotice />
            <p className="m-0 mt-4 text-faint text-xs leading-relaxed">
              登录后没有需要的权限，请联系平台管理员在应用成员里添加你。
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

/** 只有一个租户时直接登录；多个租户时先选租户，默认选中上次使用的租户。 */
function LoginAction({ redirectPath }: { redirectPath: string }) {
  const {
    data: tenants,
    error,
    isPending,
    refetch,
  } = useQuery({
    queryFn: fetchLoginTenants,
    queryKey: ["auth", "login-tenants"],
    staleTime: 60_000,
  });
  const [pickedTenantId, setPickedTenantId] = useState("");
  const lastTenantId = readLastLoginTenant();
  const selectedTenantId =
    [pickedTenantId, lastTenantId].find((id) => tenants?.some((tenant) => tenant.id === id)) ??
    tenants?.[0]?.id ??
    "";

  if (error) {
    return (
      <div className="mt-7 flex flex-col gap-3">
        <Alert variant="danger" className="rounded-xl px-4 py-3">
          读取登录租户失败：{error.message}
        </Alert>
        <Button className="w-full" variant="outline" type="button" onClick={() => void refetch()}>
          重试
        </Button>
      </div>
    );
  }
  if (tenants && tenants.length === 0) {
    return <NoTenantNotice />;
  }

  return (
    <div className="mt-7 flex flex-col gap-3">
      {tenants && tenants.length > 1 ? (
        <Select value={selectedTenantId} onValueChange={setPickedTenantId}>
          <SelectTrigger aria-label="选择飞书租户" className="h-11 w-full rounded-xl px-4">
            <SelectValue placeholder="选择飞书租户" />
          </SelectTrigger>
          <SelectContent>
            {tenants.map((tenant) => (
              <SelectItem key={tenant.id} value={tenant.id}>
                {tenant.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      <Button
        className="h-11 w-full justify-between rounded-xl px-4"
        disabled={isPending || !selectedTenantId}
        onClick={() => beginFeishuAuthorization(redirectPath, selectedTenantId)}
        type="button"
      >
        使用飞书账号登录
        <ArrowRight />
      </Button>
    </div>
  );
}

/** 上一次登录发起后没有回到回调页时，提示可能是当前域名不在飞书的重定向白名单里。 */
function PendingLoginNotice() {
  const [pending, setPending] = useState(readPendingFeishuLogin);

  // 从飞书的错误页点浏览器「后退」回来时，页面可能直接从 bfcache 恢复，不会重新渲染，这里重新读一次标记。
  useEffect(() => {
    const refresh = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setPending(readPendingFeishuLogin());
      }
    };
    window.addEventListener("pageshow", refresh);
    return () => window.removeEventListener("pageshow", refresh);
  }, []);

  if (!pending) {
    return null;
  }
  return (
    <FeishuRedirectNotice
      callbackUrl={pending.callbackUrl}
      onDismiss={() => {
        clearPendingFeishuLogin();
        setPending(null);
      }}
    />
  );
}

/** 没有可登录的租户：平台从未初始化时给出初始化入口，否则说明租户都被停用了。 */
function NoTenantNotice() {
  const { data: setupRequired } = useQuery({
    queryFn: fetchSetupRequired,
    queryKey: setupStatusQueryKey,
  });

  if (setupRequired) {
    return (
      <div className="mt-7 flex flex-col gap-4">
        <Alert variant="info" className="rounded-xl px-4 py-3">
          <div className="font-medium">平台还没有初始化</div>
          <p className="m-0 mt-0.5 text-sm leading-relaxed">
            用服务启动日志里的初始化令牌，配置第一个飞书租户。
          </p>
        </Alert>
        <Button
          className="h-11 w-full justify-between rounded-xl px-4"
          type="button"
          onClick={() => window.location.assign("/setup")}
        >
          初始化平台
          <ArrowRight />
        </Button>
      </div>
    );
  }
  return (
    <Alert variant="warning" className="mt-7 rounded-xl px-4 py-3">
      没有可登录的飞书租户，请联系管理员。
    </Alert>
  );
}

/** 一格「线上现状」的示意：全量、比例灰度、定向灰度同时生效。 */
function RoutePreview() {
  return (
    <div aria-hidden="true" className="mt-10 max-w-sm rounded-2xl bg-card p-1.5 shadow-edge">
      <div className="rounded-xl bg-primary-soft px-3.5 py-3 ring-2 ring-primary ring-inset">
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
          <i className="size-2 rounded-sm bg-rose-500" />
          car-home · 生产
        </div>
        <div className="mt-2 flex items-baseline gap-2 text-xs">
          <span className="font-medium text-foreground text-sm tabular-nums">#4201</span>
          <span className="text-primary-text">全量</span>
          <span className="ml-auto text-faint">3 天前</span>
        </div>
        <div className="my-1.5 flex h-1.5 gap-0.5">
          <i className="w-4/5 rounded-full bg-primary" />
          <i className="w-1/5 rounded-full bg-route-percentage" />
        </div>
        <div className="flex items-baseline gap-2 text-xs">
          <span className="font-medium text-foreground text-sm tabular-nums">#4215</span>
          <span className="text-route-percentage">比例 20%</span>
        </div>
        <div className="mt-0.5 flex items-baseline gap-2 text-xs">
          <span className="font-medium text-foreground text-sm tabular-nums">#4219</span>
          <span className="text-route-targeted">定向 qa-zhangwei</span>
        </div>
      </div>
    </div>
  );
}
