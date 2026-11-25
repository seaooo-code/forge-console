import type { CommitDetail } from "@/types/commits";

/** 是否包含换行等控制字符；构建适配器参数值和默认值都不允许，与后端校验一致。 */
export function hasControlCharacter(value: string) {
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (code < 0x20 || code === 0x7f) {
      return true;
    }
  }
  return false;
}

/** 拼出 CommitDetail。GitHub 和 GitLab 的提交页都是 {web}/commit/{sha}。 */
export function toCommitDetail({
  authorName,
  committedAt,
  repositoryWebUrl,
  sha,
  title,
}: {
  authorName?: string;
  committedAt?: string;
  repositoryWebUrl?: string;
  sha?: string;
  title?: string;
}): CommitDetail {
  const commitSha = sha?.trim() ?? "";
  const web = repositoryWebUrl?.trim().replace(/\/+$/, "") ?? "";
  return {
    authorName: authorName?.trim() ?? "",
    committedAt: committedAt?.trim() ?? "",
    sha: commitSha,
    title: title?.trim() ?? "",
    url: commitSha && web ? `${web}/commit/${encodeURIComponent(commitSha)}` : "",
  };
}

/**
 * 是否是可以发全量的主线分支：模块默认分支、main、master，或 release/、release- 开头的分支。
 * 功能分支一般先合入主线再发全量，发布时据此提醒，不拦截。
 */
export function isMainlineBranch(branch: string, defaultBranch: string) {
  const name = branch.trim();
  if (!name) return true;
  return (
    name === defaultBranch.trim() ||
    name === "main" ||
    name === "master" ||
    /^release[/-]/.test(name)
  );
}
