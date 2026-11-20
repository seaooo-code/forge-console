import { Alert } from "@/components/ui/alert";

/**
 * 发布弹窗中的运行时版本说明。发布路由按 runtimeVersion 隔离，
 * 新发布只替换同一运行时版本下的同类路由，不影响其他客户端版本正在使用的包。
 */
export function ReleaseRuntimeVersionNotice({ runtimeVersion }: { runtimeVersion: string }) {
  if (!runtimeVersion) {
    return (
      <Alert variant="warning">
        该构建没有记录运行时版本，客户端拉包必须携带运行时版本，发布后不会被任何客户端命中。
      </Alert>
    );
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3 rounded-lg bg-surface-2 px-3 py-2">
        <span className="text-muted-foreground text-xs">运行时版本</span>
        <span className="truncate font-mono font-semibold text-foreground text-sm">
          {runtimeVersion}
        </span>
      </div>
      <Alert variant="info">
        只替换该运行时版本下的同类发布：全量替换全量，比例灰度替换比例灰度。其他运行时版本的发布不受影响。
      </Alert>
    </div>
  );
}
