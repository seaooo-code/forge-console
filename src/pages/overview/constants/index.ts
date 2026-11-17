import type { APISchemas } from "@/api/client";

import type { ReleaseKind } from "../types";

type EnvironmentTone = APISchemas["Environment"]["tone"];

export const environmentDotClass: Record<EnvironmentTone, string> = {
  amber: "bg-amber-500",
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  rose: "bg-rose-500",
  sky: "bg-sky-500",
};

export const releaseKindLabels: Record<ReleaseKind, string> = {
  full: "全量",
  percentage: "比例灰度",
  targeted: "定向灰度",
};

export const releaseKindSubmitLabels: Record<ReleaseKind, string> = {
  full: "发布全量",
  percentage: "开始比例灰度",
  targeted: "开始定向灰度",
};

export const targetedExpiryDayOptions = [7, 15, 30] as const;

/** 定向灰度在这个时间内到期，就放进「需要处理」。 */
export const targetedExpiringWithinMs = 3 * 24 * 60 * 60 * 1000;

/** 代码源凭证在这个时间内到期，就放进「需要处理」。 */
export const credentialExpiringWithinMs = 14 * 24 * 60 * 60 * 1000;

/** 有排队或进行中的构建时，构建列表的刷新间隔。 */
export const activeBuildsRefetchIntervalMs = 5000;
