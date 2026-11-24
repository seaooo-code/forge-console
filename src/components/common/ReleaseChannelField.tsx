import { useQuery } from "@tanstack/react-query";

import { fetchReleaseChannels, releaseChannelsQueryKey } from "@/api/release-channels";
import { Field } from "@/components/common/Field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Radix Select 不接受空字符串作为选项值，默认渠道在下拉里用这个占位值表示。
const defaultChannelValue = "__default__";

/**
 * 发布弹窗里的「发布渠道」选择。应用没有注册渠道时不渲染，发布照常进入默认渠道。
 * value 为空字符串表示默认渠道。
 */
export function ReleaseChannelField({
  applicationSlug,
  id,
  onChange,
  value,
}: {
  applicationSlug: string;
  id: string;
  onChange: (channel: string) => void;
  value: string;
}) {
  const { data: channels = [] } = useQuery({
    enabled: Boolean(applicationSlug),
    queryFn: () => fetchReleaseChannels(applicationSlug),
    queryKey: releaseChannelsQueryKey(applicationSlug),
  });

  if (!applicationSlug || channels.length === 0) {
    return null;
  }

  return (
    <Field
      label="发布渠道"
      htmlFor={id}
      hint="渠道发布只对上报该渠道的客户端生效；渠道里没有发布的模块，客户端照常拿默认渠道的包。"
    >
      <Select
        value={value || defaultChannelValue}
        onValueChange={(next) => onChange(next === defaultChannelValue ? "" : next)}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder="选择发布渠道" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={defaultChannelValue}>默认渠道</SelectItem>
          {channels.map((channel) => (
            <SelectItem key={channel.code} value={channel.code}>
              {channel.name}（{channel.code}）
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
