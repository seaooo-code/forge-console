import { Alert } from "@/components/ui/alert";
import { isMainlineBranch } from "@/utils";

/** 全量发布功能分支的构建时提醒：一般先合入默认分支或 release 分支再发全量。只提醒，不拦截。 */
export function MainlineReleaseNotice({
  branch,
  defaultBranch,
}: {
  branch: string;
  defaultBranch: string;
}) {
  if (isMainlineBranch(branch, defaultBranch)) {
    return null;
  }
  const mainline = defaultBranch.trim() || "main";
  return (
    <Alert variant="warning">
      {`这个构建来自功能分支 ${branch}。功能分支一般先合入 ${mainline} 或 release 分支再发全量，直接全量发布后，主线上有、这个分支没有的提交会从线上撤下。`}
    </Alert>
  );
}
