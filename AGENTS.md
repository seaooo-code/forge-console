# AGENTS.md

## 全局要求

- git 提交信息遵守现有项目要求，中文不超过 50 字。
- 后续 AI 开发必须先阅读并遵守 `docs/frontend-directory-standard.md`。
- 新增文件前先判断目录归属；若需要新增顶层目录，先更新目录规范文档。
- 表单类功能统一使用 React Hook Form，不再手写分散的表单状态。
- Biome 是本项目唯一格式化与基础 lint 工具，不新增 ESLint/Prettier，除非用户明确要求。
- 不为一两行表达式单独抽三行小函数；能内联的派生逻辑直接内联，复杂或复用逻辑放到所属业务目录的 `utils/index.ts`。
- 代码改动后至少运行 `bun run lint` 与 `bun run typecheck`；涉及 UI、构建配置或依赖时追加 `bun run build`。

## 前端边界

- `src/components/ui` 只放 shadcn/ui 原子组件，不写业务逻辑、请求、状态管理。
- 业务和布局代码优先使用 shadcn/ui 组件；已有对应组件时，不直接写原生 `button`、`input`、`select`、`textarea`、`checkbox` 等交互控件。
- 页面业务按 `src/pages/<page>` 收敛，跨页面只通过页面的公开出口引用。
- 全局应用装配只放 `src/app`，不要把页面业务堆在 `src/main.tsx`。
- 页面路由统一使用 React Router，禁止新增 `*-route-config.tsx` 或自定义 `PageRouteConfig` 路由层。
- 页面组件内非渲染必要的局部类型放到所属业务目录的 `types/index.ts`，页面业务常量放到所属业务目录的 `constants/index.ts`；`types/`、`constants/`、`hooks/` 和 `utils/` 目录优先只用一个 `index.ts`，需要拆成多文件时再拆。
- 请求、Query key、Zustand store、复杂类型必须贴近所属页面；类似 `searchFeishuUsers` 这种请求函数，只有被两个及以上页面复用时才提升到 `src/api`。跨页面复用的 `utils`、`types`、`hooks`、`constants` 等同理提升到 `src/utils`、`src/types`、`src/hooks`、`src/constants` 等对应目录。
