import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { FieldPath } from "react-hook-form";
import type { APISchemas } from "@/api/client";
import type { PaginationMeta, PaginationParams } from "@/types/pagination";

export type ApplicationStatus = "运行中" | "维护中" | "已下线";
export type ApplicationStatusCode = APISchemas["Application"]["status"];

export type HostApplication = Omit<APISchemas["Application"], "status"> & {
  status: ApplicationStatus;
};

export type ApplicationMetricTone = APISchemas["ApplicationMetric"]["tone"];

export type ApplicationDetailMetric = APISchemas["ApplicationMetric"];

export type ApplicationEnvironmentStatus = "健康" | "灰度中" | "维护中";
export type ApplicationEnvironmentStatusCode = APISchemas["ApplicationEnvironment"]["status"];

export type ApplicationEnvironmentRecord = Omit<APISchemas["ApplicationEnvironment"], "status"> & {
  status: ApplicationEnvironmentStatus;
};

export type ApplicationModuleRecord = APISchemas["ApplicationModule"];

export type ApplicationMemberRecord = APISchemas["ApplicationMember"];

export type ApplicationCapabilities = APISchemas["ApplicationCapabilities"];

export type ClientIntegrationField = APISchemas["ApplicationClientIntegrationField"];

export type ClientIntegrationEndpoint = APISchemas["ApplicationClientIntegrationEndpoint"];

export type ClientIntegrationInfo = APISchemas["ApplicationClientIntegration"];

export type ApplicationDetail = Omit<APISchemas["ApplicationDetail"], "environments"> & {
  environments: ApplicationEnvironmentRecord[];
};

export type ApplicationSummary = APISchemas["ApplicationSummary"];

export type ApplicationsSnapshot = {
  applications: HostApplication[];
  details: Record<string, ApplicationDetail>;
  pagination: PaginationMeta;
  summary: ApplicationSummary;
};

export type ApplicationDeleteDependency = APISchemas["ApplicationDeleteDependency"];

export type ApplicationDeleteCheck = APISchemas["ApplicationDeleteCheck"];

export type ApplicationListFilters = {
  keyword: string;
  owner: string;
  platform: string;
  status: ApplicationStatusCode | "";
};

export type ApplicationListRequest = ApplicationListFilters & PaginationParams;

export type ApplicationEnvironmentInput = APISchemas["ApplicationEnvironmentRequest"];

export type ApplicationMemberInput = APISchemas["ApplicationMemberRequest"];

export type ApplicationOption = APISchemas["ApplicationOption"];

export type ApplicationOptions = APISchemas["ApplicationOptions"];

export type ApplicationMutationInput = APISchemas["ApplicationCreateRequest"];

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
  ownerUserId: string;
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
