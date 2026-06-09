# AGENTS.md

## 全局要求

- git 提交信息遵守现有项目要求，中文不超过 50 字。
- 后续 AI 开发必须先阅读并遵守 `docs/frontend-directory-standard.md`。
- 新增文件前先判断目录归属；若需要新增顶层目录，先更新目录规范文档。
- Biome 是本项目唯一格式化与基础 lint 工具，不新增 ESLint/Prettier，除非用户明确要求。
- 代码改动后至少运行 `bun run lint` 与 `bun run typecheck`；涉及 UI、构建配置或依赖时追加 `bun run build`。

## 前端边界

- `src/components/ui` 只放 shadcn/ui 原子组件，不写业务逻辑、请求、状态管理。
- 业务功能按 `src/features/<feature>` 收敛，跨功能只通过 feature 的公开出口引用。
- 全局应用装配只放 `src/app`，不要把页面业务堆在 `src/main.tsx`。
- 请求、Query key、Zustand store、复杂类型必须贴近所属 feature；只有真正跨功能复用时才放入 `src/lib`、`src/store` 或 `src/types`。

