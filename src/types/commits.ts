/** 一次提交的展示信息。构建、发布、提测单、线上现状都用它展示代码版本。 */
export type CommitDetail = {
  authorName: string;
  /** RFC3339 提交时间，未知时为空字符串。 */
  committedAt: string;
  /** 完整 commit SHA，构建检出前为空字符串。 */
  sha: string;
  /** 提交说明第一行；旧构建或查询失败时为空字符串。 */
  title: string;
  /** 托管平台上的提交页，缺少仓库地址时为空字符串。 */
  url: string;
};
