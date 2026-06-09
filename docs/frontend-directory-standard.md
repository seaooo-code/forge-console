# 前端目录规范

本项目使用 React、TypeScript、Vite、Tailwind CSS、shadcn/ui、AG Grid、ECharts、Monaco、TanStack Query 和 Zustand。目录规范的目标是让后续 AI 或人工开发能快速判断代码归属，避免业务逻辑散落到通用组件、入口文件或工具目录。

## 目录结构

```text
src/
  app/                    # 应用级装配：根组件、Provider、路由、全局布局
  components/
    ui/                   # shadcn/ui 原子组件，只保留无业务语义的基础 UI
    common/               # 跨 feature 复用的轻业务组件
  features/
    <feature>/
      api/                # 请求函数、Query key、数据适配
      components/         # 该 feature 专属组件
      hooks/              # 该 feature 专属 hook
      model/              # Zustand store、业务状态、领域计算
      types.ts            # 该 feature 对外类型
      index.ts            # 公开出口
  hooks/                  # 真正全局复用的 hook
  lib/                    # 全局基础设施：query client、工具函数、适配器
  store/                  # 真正跨 feature 的全局 store
  types/                  # 全局共享类型
  assets/                 # 静态资源
  index.css               # Tailwind v4 入口、主题 token、全局基础样式
  main.tsx                # React 挂载入口，只做启动
```

## 分层规则

- `src/main.tsx` 只负责创建 React root 并渲染 `src/app`，不写业务 UI。
- `src/app` 负责 Query Provider、全局布局、路由和模块装配，不放请求细节。
- `src/features/<feature>` 是业务功能默认落点。新增业务页面、面板、表格、图表、编辑器配置，应优先放这里。
- `src/components/ui` 只放 shadcn/ui 组件。这里的组件不得引用 `features`、`store`、请求函数或业务类型。
- `src/components/common` 只放两个及以上 feature 复用的组件。单 feature 使用的组件不要提前抽到这里。
- `src/lib` 只放无业务语义的基础设施，例如 `queryClient`、`cn`、日期/数字通用格式化。
- `src/store` 只放跨多个 feature 的全局状态。单 feature 状态放 `features/<feature>/model`。
- `src/types` 只放跨多个 feature 的共享类型。单 feature 类型放 `features/<feature>/types.ts`。

## Feature 内部约定

每个 feature 推荐按需使用以下文件：

```text
features/console/
  api/console-snapshot.ts
  components/DataGridPanel.tsx
  components/ChartPanel.tsx
  model/use-console-store.ts
  types.ts
  index.ts
```

- `api/`：放请求函数、TanStack Query key、响应适配，不直接操作 UI 状态。
- `components/`：放该 feature 的 React 组件，可以组合 shadcn/ui、AG Grid、ECharts、Monaco。
- `hooks/`：放该 feature 专属 hook。跨 feature 复用前不要移动到全局 `hooks/`。
- `model/`：放 Zustand store、派生计算、状态转换。
- `types.ts`：放 feature 的领域类型。
- `index.ts`：只导出外部需要使用的组件、hook、类型，避免外部深层路径依赖。

## 命名约定

- React 组件文件使用 `PascalCase.tsx`，例如 `DataGridPanel.tsx`。
- hook 文件使用 `use-*.ts` 或 `use-*.tsx`，导出名使用 `useXxx`。
- Zustand store 文件使用 `use-*-store.ts`，导出名使用 `useXxxStore`。
- 请求与数据适配文件使用业务名，例如 `console-snapshot.ts`。
- 类型集中到 `types.ts`；常量集中到 `constants.ts`；纯函数工具使用 `*.utils.ts`。
- 组件默认使用具名导出，入口文件可以按框架需要例外。

## 依赖与引用边界

- 允许：`app -> features -> components/ui -> lib`。
- 允许：feature 内部互相引用自己的 `api/components/hooks/model/types`。
- 允许：跨 feature 使用对方 `index.ts` 暴露的公开 API。
- 禁止：`components/ui` 引用 `features`、`app`、业务 store 或请求函数。
- 禁止：feature 之间互相深层引用，例如 `@/features/a/components/X`。
- 禁止：在组件中直接散落 fetch 细节；请求入口应放在 feature 的 `api/`。
- 禁止：为了方便把单 feature 代码放进全局 `lib`、`hooks`、`store`。

## 样式规范

- Tailwind utility 是默认样式方案。
- 主题 token、CSS 变量、基础 reset 只放 `src/index.css`。
- 不新增全局 CSS 文件，除非是第三方库必须要求，并在引入处说明用途。
- shadcn/ui 组件可按项目主题微调，但不得塞入业务文案或业务状态。
- 复杂数据界面优先使用紧凑、可扫描的布局，不做营销式 hero 或装饰性背景。

## 工具约束

- 使用 Biome 统一格式化与基础 lint。
- 使用 TypeScript 严格模式，避免 `any`；确需使用时必须在附近解释边界原因。
- 新增依赖前说明用途，优先复用现有栈。
- AG Grid、ECharts、Monaco 的初始化逻辑应封装在 feature 组件或专用适配器内。

## AI 开发流程

1. 先确认需求属于哪个 feature，或是否需要新增 feature。
2. 新增文件前按本规范选择目录；不确定时优先放到 feature 内部。
3. 修改 shadcn/ui 时确认没有引入业务逻辑。
4. 修改完成后运行 `bun run lint` 和 `bun run typecheck`。
5. 涉及 UI、构建配置、依赖或打包行为时运行 `bun run build`。
6. 如果新增了目录类别或打破现有边界，先更新本规范再提交代码。

