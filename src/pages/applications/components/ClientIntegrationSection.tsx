import { CircleAlert, Code2, type LucideIcon } from "lucide-react";
import type { ClientIntegrationField, ClientIntegrationInfo } from "../types";

type ClientIntegrationSectionProps = {
  clientIntegration?: ClientIntegrationInfo;
};

export function ClientIntegrationSection({ clientIntegration }: ClientIntegrationSectionProps) {
  if (!clientIntegration) {
    return (
      <section className="overflow-hidden rounded-lg bg-card shadow-edge">
        <SectionHeader title="客户端接入信息" description="客户端获取 manifest 的接口说明" />
        <div className="flex items-start gap-3 p-4">
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
          <div>
            <div className="font-semibold text-foreground text-sm">暂无接入信息</div>
            <div className="mt-1 text-muted-foreground text-xs">
              应用详情接口返回 clientIntegration 后，这里会展示客户端请求 manifest
              的域名、路径、请求字段和响应字段。
            </div>
          </div>
        </div>
      </section>
    );
  }

  const { endpoint } = clientIntegration;

  return (
    <section className="overflow-hidden rounded-lg bg-card shadow-edge">
      <SectionHeader
        title="客户端接入信息"
        description={endpoint.description || "客户端获取 manifest 的接口说明"}
      />
      <div className="space-y-4 p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <InfoItem icon={Code2} label="接口域名" value={endpoint.baseUrl} />
          <InfoItem icon={Code2} label="接口路径" value={endpoint.path} />
          <InfoItem icon={Code2} label="请求方法" value={endpoint.method} />
        </div>
        {endpoint.exampleUrl ? (
          <div className="rounded-md bg-surface-2 px-3 py-3">
            <div className="font-medium text-muted-foreground text-xs">示例请求</div>
            <div className="mt-1 break-all font-mono text-foreground text-sm">
              {endpoint.exampleUrl}
            </div>
          </div>
        ) : null}
        <FieldDescriptionTable title="请求字段" fields={endpoint.requestFields} />
        <FieldDescriptionTable title="响应字段" fields={endpoint.responseFields} />
      </div>
    </section>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 gap-3 rounded-md bg-card shadow-edge px-3 py-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <div className="font-medium text-muted-foreground text-xs">{label}</div>
        <div className="mt-1 break-all font-semibold text-foreground text-sm">{value}</div>
      </div>
    </div>
  );
}

function FieldDescriptionTable({
  fields,
  title,
}: {
  fields: ClientIntegrationField[];
  title: string;
}) {
  return (
    <div className="overflow-hidden rounded-md shadow-edge">
      <div className="flex h-10 items-center bg-muted px-3 font-semibold text-foreground text-sm">
        {title}
      </div>
      {fields.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-180 table-fixed border-collapse text-left text-sm">
            <thead className="bg-card text-muted-foreground text-xs">
              <tr className="border-border border-b">
                <th className="w-52 px-3 py-2 font-medium">字段</th>
                <th className="w-24 px-3 py-2 font-medium">类型</th>
                <th className="w-20 px-3 py-2 font-medium">必填</th>
                <th className="px-3 py-2 font-medium">说明</th>
                <th className="w-56 px-3 py-2 font-medium">示例</th>
              </tr>
            </thead>
            <tbody className="flex flex-col gap-1 p-1">
              {fields.map((field) => (
                <tr key={`${title}-${field.name}`} className="bg-card">
                  <td className="break-all px-3 py-2 font-mono text-foreground">{field.name}</td>
                  <td className="break-all px-3 py-2 text-muted-foreground">{field.type || "-"}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {field.required === undefined ? "-" : field.required ? "是" : "否"}
                  </td>
                  <td className="px-3 py-2 text-foreground">{field.description}</td>
                  <td className="break-all px-3 py-2 font-mono text-muted-foreground">
                    {field.example || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-3 py-4 text-muted-foreground text-sm">后端未返回字段说明。</div>
      )}
    </div>
  );
}

function SectionHeader({ description, title }: { description: string; title: string }) {
  return (
    <div className="flex h-12 items-center justify-between px-4">
      <div>
        <div className="font-semibold text-foreground text-sm">{title}</div>
        <div className="text-muted-foreground text-xs">{description}</div>
      </div>
    </div>
  );
}
