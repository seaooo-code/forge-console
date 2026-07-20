import { useQuery } from "@tanstack/react-query";
import { Smartphone } from "lucide-react";

import { applicationsAllQueryKey, fetchAllApplicationsSnapshot } from "@/pages/applications";

import { ConsoleClearableFilterSelect } from "./ConsoleControls";

type ApplicationScopeSelectProps = {
  onValueChange: (applicationId: string) => void;
  value: string;
};

export function ApplicationScopeSelect({ onValueChange, value }: ApplicationScopeSelectProps) {
  const { data: snapshot } = useQuery({
    queryFn: () => fetchAllApplicationsSnapshot(),
    queryKey: applicationsAllQueryKey,
  });

  const options =
    snapshot?.applications.map((application) => ({
      label: application.name,
      value: application.id,
    })) ?? [];

  return (
    <ConsoleClearableFilterSelect
      icon={Smartphone}
      label="当前应用"
      value={value}
      options={options}
      clearLabel="清空当前应用"
      onClear={() => onValueChange("")}
      onValueChange={onValueChange}
    />
  );
}
