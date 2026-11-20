import { CircleAlert, KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { RuntimeEnvironment } from "@/pages/environments";

import type { AttentionItem, CellKey } from "../types";
import { expiresInLabel, relativeTime } from "../utils";

type AttentionListProps = {
  canCreateBuild: boolean;
  environments: RuntimeEnvironment[];
  items: AttentionItem[];
  moduleName: (moduleId: string) => string;
  onOpenBuild: (buildId: string) => void;
  onOpenCodeSources: () => void;
  onRebuild: (input: { branch: string; environment: string; moduleId: string }) => void;
  onSelect: (key: CellKey) => void;
  isRebuilding: boolean;
};

const chip = "bg-card text-foreground shadow-edge hover:bg-hover";

export function AttentionList({
  canCreateBuild,
  environments,
  items,
  moduleName,
  onOpenBuild,
  onOpenCodeSources,
  onRebuild,
  onSelect,
  isRebuilding,
}: AttentionListProps) {
  const envName = (code: string) => environments.find((env) => env.id === code)?.name ?? code;

  return (
    <section aria-labelledby="attention-title" className="mt-6">
      <div className="mb-2.5 flex items-baseline gap-2">
        <h2 id="attention-title" className="m-0 font-medium text-sm">
          需要处理
        </h2>
        {items.length ? <span className="text-faint text-xs">{items.length} 项</span> : null}
      </div>
      {items.length === 0 ? (
        <p className="m-0 rounded-xl bg-card px-4 py-3.5 text-muted-foreground text-sm shadow-edge">
          没有需要处理的事。构建失败、代码源凭证即将过期都会出现在这里。
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 2xl:grid-cols-3">
          {items.map((item) => {
            if (item.kind === "build-failed") {
              const { build } = item;
              const key = { environment: build.environment, moduleId: build.moduleId };
              return (
                <Card
                  key={item.id}
                  icon={<CircleAlert />}
                  iconClass="bg-destructive-soft text-destructive"
                  meta={`${envName(build.environment)} · ${build.branch} · ${relativeTime(build.createdAtRaw)}`}
                  onSelect={() => onSelect(key)}
                  title={`${moduleName(build.moduleId)} #${build.number} 构建失败`}
                >
                  <Button
                    size="sm"
                    variant="ghost"
                    className={chip}
                    onClick={() => onOpenBuild(build.id)}
                  >
                    查看日志
                  </Button>
                  {canCreateBuild ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className={chip}
                      loading={isRebuilding}
                      onClick={() =>
                        onRebuild({
                          branch: build.branch === "-" ? "" : build.branch,
                          environment: build.environment,
                          moduleId: build.moduleId,
                        })
                      }
                    >
                      重新构建
                    </Button>
                  ) : null}
                </Card>
              );
            }
            const { connection } = item;
            return (
              <Card
                key={item.id}
                icon={<KeyRound />}
                iconClass="bg-muted text-muted-foreground"
                meta={`${connection.name} · ${connection.externalAccount || connection.webBaseUrl}`}
                title={`${connection.provider === "gitlab" ? "GitLab" : "GitHub"} 凭证 ${expiresInLabel(connection.credentialExpiresAt ?? "")}`}
              >
                <Button size="sm" variant="ghost" className={chip} onClick={onOpenCodeSources}>
                  更新凭证
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}

type CardProps = {
  children: React.ReactNode;
  icon: React.ReactNode;
  iconClass: string;
  meta: string;
  onSelect?: () => void;
  title: string;
};

function Card({ children, icon, iconClass, meta, onSelect, title }: CardProps) {
  const head = (
    <>
      <span
        className={`flex size-7.5 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4 ${iconClass}`}
      >
        {icon}
      </span>
      <span className="min-w-0 text-left">
        <span className="block font-normal text-foreground text-sm leading-snug">{title}</span>
        <span className="mt-0.5 block truncate font-normal text-faint text-xs">{meta}</span>
      </span>
    </>
  );

  return (
    <article className="flex min-h-28 flex-col gap-3 rounded-xl bg-card px-3.5 py-3 shadow-edge">
      {onSelect ? (
        <Button
          variant="ghost"
          onClick={onSelect}
          className="h-auto items-start justify-start gap-3 whitespace-normal p-0 hover:bg-transparent"
        >
          {head}
        </Button>
      ) : (
        <div className="flex items-start gap-3">{head}</div>
      )}
      <div className="mt-auto flex gap-1.5 pl-10.5">{children}</div>
    </article>
  );
}
