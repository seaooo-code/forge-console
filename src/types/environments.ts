export const miCarEnvironmentCodes = [
  "dev",
  "staging",
  "preview",
  "preProduct",
  "product",
] as const;

export type MiCarEnvironmentCode = (typeof miCarEnvironmentCodes)[number];

export const miCarEnvironmentLabels: Record<MiCarEnvironmentCode, string> = {
  dev: "dev",
  preProduct: "preProduct",
  preview: "preview",
  product: "product",
  staging: "staging",
};

export const miCarEnvironmentDisplayNames: Record<MiCarEnvironmentCode, string> = {
  dev: "开发环境",
  preProduct: "预生产环境",
  preview: "预览环境",
  product: "生产环境",
  staging: "联调环境",
};

export const miCarEnvironmentShortLabels: Record<MiCarEnvironmentCode, string> = {
  dev: "DEV",
  preProduct: "PREPRODUCT",
  preview: "PREVIEW",
  product: "PRODUCT",
  staging: "STAGING",
};

export const miCarEnvironmentFilterOptions = miCarEnvironmentCodes.map((value) => ({
  label: miCarEnvironmentLabels[value],
  value,
}));
