import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { FieldPath } from "react-hook-form";
import type { PaginationMeta, PaginationParams } from "@/types/pagination";

export type ApplicationStatus = "运行中" | "维护中" | "已下线";
export type ApplicationStatusCode = "running" | "maintenance" | "offline";

export type HostApplication = {
  id: string;
  name: string;
  slug: string;
  platform: string;
  owner: string;
  ownerEmail: string;
  ownerAvatarUrl: string;
  ownerDepartmentIds: string[];
  moduleCount: number;
  environmentCount: number;
  createdAt: string;
  status: ApplicationStatus;
};

export type ApplicationMetricTone = "blue" | "emerald" | "amber" | "rose" | "slate";

export type ApplicationDetailMetric = {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: ApplicationMetricTone;
};

export type ApplicationEnvironmentRecord = {
  id: string;
  environment: string;
  traffic: string;
  updatedAt: string;
  status: "健康" | "灰度中" | "维护中";
};

export type ApplicationModuleRecord = {
  commonModuleId: string;
  commonModuleName: string;
  id: string;
  name: string;
  kind: "Common" | "Feature";
  repository: string;
  owner: string;
};

export type ApplicationMemberRecord = {
  avatarUrl: string;
  email: string;
  id: string;
  name: string;
  role: "Owner" | "Developer" | "QA" | "Release";
  team: string;
  userId: string;
};

export type ApplicationCapabilities = {
  canEditApplication: boolean;
  canManageMembers: boolean;
  canUpdateStatus: boolean;
  canCreateBuild: boolean;
  canRelease: boolean;
};

export type ClientIntegrationField = {
  name: string;
  description: string;
  required?: boolean;
  type?: string;
  example?: string;
};

export type ClientIntegrationEndpoint = {
  baseUrl: string;
  path: string;
  method: string;
  requestFields: ClientIntegrationField[];
  responseFields: ClientIntegrationField[];
  description?: string;
  exampleUrl?: string;
};

export type ClientIntegrationInfo = {
  endpoint: ClientIntegrationEndpoint;
};

export type ApplicationDetail = {
  id: string;
  appKey: string;
  slug: string;
  name: string;
  description: string;
  owner: string;
  ownerEmail: string;
  ownerAvatarUrl: string;
  ownerDepartmentIds: string[];
  metrics: ApplicationDetailMetric[];
  environments: ApplicationEnvironmentRecord[];
  modules: ApplicationModuleRecord[];
  members: ApplicationMemberRecord[];
  capabilities: ApplicationCapabilities;
  clientIntegration?: ClientIntegrationInfo;
};

export type ApplicationSummary = {
  total: number;
  running: number;
  maintenance: number;
  offline: number;
};

export type ApplicationsSnapshot = {
  applications: HostApplication[];
  details: Record<string, ApplicationDetail>;
  pagination: PaginationMeta;
  summary: ApplicationSummary;
};

export type ApplicationDeleteDependency = {
  id: string;
  name: string;
  type: string;
  description?: string;
};

export type ApplicationDeleteCheck = {
  deletable: boolean;
  dependencies: ApplicationDeleteDependency[];
  message?: string;
};

export type ApplicationListFilters = {
  keyword: string;
  owner: string;
  platform: string;
  status: ApplicationStatusCode | "";
};

export type ApplicationListRequest = ApplicationListFilters & PaginationParams;

export type ApplicationEnvironmentInput = {
  environment: ApplicationEnvironmentRecord["environment"];
};

export type ApplicationMemberInput = {
  role: ApplicationMemberRecord["role"];
  userId: string;
};

export type ApplicationOption = {
  label: string;
  value: string;
};

export type ApplicationOptions = {
  applicationStatuses: ApplicationOption[];
  environments: ApplicationOption[];
  owners: ApplicationOption[];
  platforms: ApplicationOption[];
};

export type ApplicationMutationInput = {
  slug?: string;
  name: string;
  platform: string;
  owner: string;
  ownerEmail: string;
  ownerAvatarUrl: string;
  ownerDepartmentIds: string[];
  description: string;
  status: ApplicationStatusCode;
  environments: ApplicationEnvironmentInput[];
};

export type ApplicationCreatePageProps = {
  applicationSlug?: string;
  mode?: "create" | "edit";
  onBack: () => void;
  onSaved?: (applicationSlug: string) => void;
};

export type EnvironmentCode = ApplicationEnvironmentInput["environment"];

export type EnvironmentFormState = Record<string, boolean>;

export type ApplicationFormState = {
  description: string;
  environments: EnvironmentFormState;
  name: string;
  owner: string;
  ownerAvatarUrl: string;
  ownerDepartmentIds: string[];
  ownerEmail: string;
  platforms: string[];
  slug: string;
  status: ApplicationStatusCode | "";
};

export type ApplicationEditFormSource = {
  application: HostApplication;
  detail: ApplicationDetail;
};

export type ApplicationEnvironmentFieldPath = FieldPath<ApplicationFormState>;

export type ApplicationFormFeedbackProps = {
  onBack: () => void;
};

export type SectionHeaderProps = {
  description: string;
  icon: LucideIcon;
  title: string;
};

export type FieldProps = {
  children: ReactNode;
  className?: string;
  label: string;
};

export type CheckOptionProps = {
  checked?: boolean;
  label: string;
  onCheckedChange?: (checked: boolean) => void;
};

export type ApplicationMemberFormState = {
  memberName: string;
  role: ApplicationMemberRecord["role"];
  userId: string;
};
