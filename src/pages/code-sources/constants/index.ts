import type { CodeSourceAppStatus, CodeSourceProvider } from "../types";

export const providerToneClass: Record<CodeSourceProvider, string> = {
  github: "bg-foreground text-background",
};

export const statusClass: Record<CodeSourceAppStatus, string> = {
  installed: "border-success/30 bg-success/10 text-success",
  notInstalled: "border-border bg-muted text-muted-foreground",
};

export const statusLabel: Record<CodeSourceAppStatus, string> = {
  installed: "已安装",
  notInstalled: "未安装",
};
