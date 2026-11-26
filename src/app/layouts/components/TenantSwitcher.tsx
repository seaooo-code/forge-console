import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

import { switchAuthSessionTenant } from "@/api/feishu-auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchTenants, tenantsQueryKey } from "@/pages/tenants/api";
import { useAuthStore } from "@/store/use-auth-store";

/**
 * SuperAdmin 切换当前租户。只对能管理租户的人显示：切换后清空所有查询缓存并回到首页，
 * 避免看到上一个租户的数据。
 */
export function TenantSwitcher() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const setSession = useAuthStore((state) => state.setSession);
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState("");

  const canSwitchTenant = Boolean(session?.capabilities.canManageTenants);
  const { data: tenants = [] } = useQuery({
    enabled: canSwitchTenant,
    queryFn: fetchTenants,
    queryKey: tenantsQueryKey,
  });

  if (!canSwitchTenant || !session) {
    return null;
  }

  const switchTenant = async (tenantId: string) => {
    if (tenantId === session.activeTenant.id) {
      return;
    }
    setIsSwitching(true);
    setError("");
    try {
      setSession(await switchAuthSessionTenant(tenantId));
      queryClient.clear();
      navigate("/", { replace: true });
    } catch (switchError) {
      setError(switchError instanceof Error ? switchError.message : "切换租户失败");
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div className="flex flex-col gap-1 px-0.5 pb-1">
      <Select value={session.activeTenant.id} onValueChange={switchTenant}>
        <SelectTrigger
          aria-label="切换租户"
          className="h-8 w-full gap-2 border-0 bg-transparent px-2 text-faint text-xs shadow-none hover:bg-hover"
          disabled={isSwitching}
        >
          <Building2 className="size-3.5 shrink-0" />
          <SelectValue placeholder="切换租户" />
        </SelectTrigger>
        <SelectContent>
          {tenants.map((tenant) => (
            <SelectItem key={tenant.id} value={tenant.id}>
              {tenant.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? <p className="px-2 text-destructive text-xs">{error}</p> : null}
    </div>
  );
}
