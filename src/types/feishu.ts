/** 飞书通讯录搜索结果。选中后要先换成当前租户的 Forge 用户再提交。 */
export type FeishuUserSearchResult = {
  id: string;
  unionId: string;
  openId: string;
  userId: string;
  name: string;
  enName: string;
  avatarUrl: string;
  email: string;
};

/** 当前租户里的 Forge 用户。表单里的负责人、成员只提交这个 ID。 */
export type ResolvedUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
};
