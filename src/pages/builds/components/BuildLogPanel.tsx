import { useQueryClient } from "@tanstack/react-query";
import { ArrowDownToLine, LoaderCircle, RefreshCw, ScrollText } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { buildDetailQueryKey } from "../api/builds-snapshot";
import { useBuildLogs } from "../hooks";

/** 距离底部小于该像素时视为停在底部，继续跟随新日志。 */
const followThresholdPx = 16;

export function BuildLogPanel({ buildId, isLive }: { buildId: string; isLive: boolean }) {
  const queryClient = useQueryClient();
  const { data, error, isError, isFetching, refetch } = useBuildLogs(buildId);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [isFollowing, setIsFollowing] = useState(true);
  const content = data?.content ?? "";
  const isFinished = Boolean(data?.finished);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (viewport && isFollowing && content) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [content, isFollowing]);

  // 日志读完说明构建已结束，立即刷新详情，不用等状态轮询的下一个周期。
  useEffect(() => {
    if (isFinished && isLive) {
      void queryClient.invalidateQueries({ queryKey: buildDetailQueryKey(buildId) });
    }
  }, [buildId, isFinished, isLive, queryClient]);

  return (
    <Card className="gap-0 rounded-lg py-0">
      <div className="flex min-h-12 flex-wrap items-center justify-between gap-2 border-border border-b px-4 py-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
            <ScrollText className="size-4 text-muted-foreground" />
            构建日志
            {isError ? (
              <Badge variant="warning" size="sm">
                已暂停
              </Badge>
            ) : isFinished ? (
              <Badge variant="neutral" size="sm">
                已结束
              </Badge>
            ) : (
              <Badge variant="info" size="sm">
                实时更新中
              </Badge>
            )}
          </div>
          <div className="text-muted-foreground text-xs">
            git 与 docker 的合并输出，凭证和密钥已脱敏；超过 5 MB 时，后半段在构建结束后才能看到
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isFollowing ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => setIsFollowing(true)}
            >
              <ArrowDownToLine className="size-3.5" />
              跟随最新
            </Button>
          ) : null}
          {isError ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5"
              disabled={isFetching}
              onClick={() => {
                void refetch();
              }}
            >
              <RefreshCw className="size-3.5" />
              重试
            </Button>
          ) : null}
        </div>
      </div>

      {isError ? (
        <div className="px-4 pt-3">
          <Alert variant="danger">
            {error instanceof Error ? error.message : "构建日志加载失败"}
          </Alert>
        </div>
      ) : null}

      <div
        ref={viewportRef}
        className="m-4 h-120 overflow-auto rounded-md border border-border bg-muted px-3 py-2"
        onScroll={(event) => {
          const viewport = event.currentTarget;
          const distanceToBottom =
            viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
          setIsFollowing(distanceToBottom < followThresholdPx);
        }}
      >
        {content ? (
          <pre className="whitespace-pre-wrap break-all font-mono text-foreground text-xs leading-5">
            {content}
          </pre>
        ) : (
          <div className="flex h-full items-center justify-center gap-2 text-muted-foreground text-sm">
            {!data && !isError ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                正在加载日志
              </>
            ) : isFinished ? (
              "该构建没有日志输出，或日志已超过保留期被清理"
            ) : (
              "等待构建输出日志"
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
