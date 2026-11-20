export type TestPlanStatusFilter = "" | "open" | "closed";

export type TestPlanListFilters = {
  applicationId: string;
  environment: string;
  status: TestPlanStatusFilter;
};

export type TestPlanCreateFormState = {
  applicationId: string;
  environment: string;
  name: string;
  link: string;
  ttlDays: string;
};

export type TestPlanItemFormState = {
  moduleId: string;
  branch: string;
  mode: "follow" | "pinned";
  buildRecordId: string;
};

export type TestPlanMemberFormState = {
  userId: string;
  note: string;
};

export type TestAccountFormState = {
  environment: string;
  userId: string;
  note: string;
};
