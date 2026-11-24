import { updateApplication } from "../api/applications-snapshot";
import { applicationStatusCodeByLabel, applicationStatusCodes } from "../constants";
import type {
  ApplicationDetail,
  ApplicationEditFormSource,
  ApplicationEnvironmentInput,
  ApplicationFormState,
  ApplicationMemberRecord,
  ApplicationMutationInput,
  ApplicationOption,
  ApplicationStatusCode,
  EnvironmentCode,
  EnvironmentFormState,
} from "../types";

export function parseApplicationStatusCode(
  value: string | undefined,
): ApplicationStatusCode | null {
  if (!value) {
    return null;
  }

  return applicationStatusCodes.has(value as ApplicationStatusCode)
    ? (value as ApplicationStatusCode)
    : null;
}

export function buildInitialForm(
  source?: ApplicationEditFormSource,
  environmentOptions: ApplicationOption[] = [],
  statusOptions: ApplicationOption[] = [],
): ApplicationFormState {
  if (!source) {
    return {
      description: "",
      environments: buildEnvironmentState(undefined, environmentOptions),
      name: "",
      owner: "",
      ownerAvatarUrl: "",
      ownerDepartmentIds: [],
      ownerEmail: "",
      ownerUserId: "",
      platforms: [],
      slug: "",
      status: parseApplicationStatusCode(statusOptions[0]?.value) ?? "",
    };
  }

  const { application, detail } = source;

  return {
    description: detail.description,
    environments: buildEnvironmentState(detail, environmentOptions),
    name: detail.name,
    owner: detail.owner,
    ownerAvatarUrl: detail.ownerAvatarUrl,
    ownerDepartmentIds: detail.ownerDepartmentIds,
    ownerEmail: detail.ownerEmail,
    ownerUserId: detail.ownerUserId,
    platforms: application.platform.split("/").map((item) => item.trim()),
    slug: detail.slug,
    status: applicationStatusCodeByLabel[application.status],
  };
}

export function buildEnvironmentState(
  detail?: ApplicationDetail,
  environmentOptions: ApplicationOption[] = [],
): EnvironmentFormState {
  const enabledEnvironments = new Map(
    detail?.environments.map((environment) => [environment.environment, environment]) ?? [],
  );

  return Object.fromEntries(
    environmentOptions.map((environment) => [
      environment.value,
      detail ? enabledEnvironments.has(environment.value) : true,
    ]),
  );
}

export function buildApplicationInput(
  form: ApplicationFormState,
  environmentOptions: ApplicationOption[],
  status: ApplicationStatusCode,
): ApplicationMutationInput {
  const environments: ApplicationEnvironmentInput[] = environmentOptions
    .filter((environment) => form.environments[environment.value])
    .map((environment) => ({
      environment: environment.value as EnvironmentCode,
    }));

  return {
    description: form.description.trim(),
    environments,
    name: form.name.trim(),
    owner: form.owner.trim(),
    ownerAvatarUrl: form.ownerAvatarUrl.trim(),
    ownerDepartmentIds: form.ownerDepartmentIds,
    ownerEmail: form.ownerEmail.trim(),
    ownerUserId: form.ownerUserId.trim(),
    platform: form.platforms.join(" / "),
    slug: form.slug.trim(),
    status,
  };
}

export async function updateExistingApplication(
  applicationSlug: string | undefined,
  input: ApplicationMutationInput,
) {
  if (!applicationSlug) {
    throw new Error("Application slug is required");
  }

  return updateApplication(applicationSlug, input);
}

export function memberDisplayName(member: ApplicationMemberRecord) {
  return member.name || member.email || member.userId || member.id;
}

export function upsertMemberInList(
  members: ApplicationMemberRecord[],
  nextMember: ApplicationMemberRecord,
) {
  const existingIndex = members.findIndex((member) => member.userId === nextMember.userId);
  if (existingIndex < 0) {
    return [...members, nextMember];
  }

  return members.map((member, index) => (index === existingIndex ? nextMember : member));
}

/** 把 RFC3339 时间格式化为本地时间的 YYYY-MM-DD HH:mm，空值或无法解析时返回 "-"。 */
export function formatMinuteTime(value: string) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) {
    return "-";
  }
  const pad = (part: number) => `${part}`.padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
