import type { CodeSourceConnectionProvider, GitLabConnectionFormValues } from "../types";

/** 凭证在该天数内过期时给出提示。 */
export const credentialExpiryWarningDays = 14;

export const connectionNameMaxLength = 100;

export const providerLabel: Record<CodeSourceConnectionProvider, string> = {
  github: "GitHub",
  gitlab: "GitLab",
};

export const providerToneClass: Record<CodeSourceConnectionProvider, string> = {
  github: "bg-foreground text-background",
  gitlab: "bg-warning/15 text-warning",
};

export const defaultGitLabConnectionForm: GitLabConnectionFormValues = {
  credential: "",
  name: "",
  webBaseUrl: "",
};
