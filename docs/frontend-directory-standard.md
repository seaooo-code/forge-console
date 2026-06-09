# 前端目录规范

本项目使用 React、TypeScript、Vite、Tailwind CSS、shadcn/ui、AG Grid、ECharts、Monaco、TanStack Query 和 Zustand。当前产品是一个 RN Bundle 管理后台，业务模块以页面为主要组织单位，因此采用 `src/pages/<page>` 作为业务代码默认归属。

## 目录结构

```text
src/
  app/                    # 应用级装配：根组件、Provider、路由、全局布局
    layouts/              # 后台壳层、侧边栏、顶部栏、导航状态
    navigation.ts         # 后台导航配置
  pages/
    <page>/
      api/                # 页面请求函数、Query key、数据适配
      components/         # 页面内专属组件
      hooks/              # 页面内专属 hook
      model/              # 页面内 Zustand store、派生状态
      <Page>.tsx          # 页面入口组件
      types.ts            # 页面领域类型
      index.ts            # 页面公开出口
  components/
    ui/                   # shadcn/ui 原子组件，只保留无业务语义的基础 UI
    common/               # 跨页面复用的轻业务组件
  hooks/                  # 真正全局复用的 hook
  lib/                    # 全局基础设施：query client、工具函数、适配器
  store/                  # 真正跨页面的全局 store
  types/                  # 全局共享类型
  assets/                 # 静态资源
  index.css               # Tailwind v4 入口、主题 token、全局基础样式
  main.tsx                # React 挂载入口，只做启动
```

## 分层规则

- `src/main.tsx` 只负责创建 React root 并渲染 `src/app`，不写业务 UI。
- `src/app` 负责 Query Provider、全局布局、路由和模块装配，不放具体页面 UI。
- `src/app/layouts` 放后台壳层、侧边栏、顶部栏、导航配置、壳层状态等跨页面结构。
- `src/pages/<page>` 是页面业务默认落点。新增后台页面、页面级面板、表格、图表、编辑器配置，优先放这里。
- `src/pages/<page>/components` 只放该页面专属组件。两个及以上页面复用后，再移动到 `src/components/common`。
- `src/components/ui` 只放 shadcn/ui 组件。这里的组件不得引用 `pages`、`app`、业务 store 或请求函数。
- `src/lib` 只放无业务语义的基础设施，例如 `queryClient`、`cn`、日期/数字通用格式化。
- `src/store` 只放跨多个页面的全局状态。页面内状态放 `src/pages/<page>/model`。
- `src/types` 只放跨多个页面的共享类型。页面内类型放 `src/pages/<page>/types.ts`。

## 页面内部约定

每个页面按需使用以下结构：

```text
pages/applications/
  api/applications-snapshot.ts
  components/
    ApplicationsGrid.tsx
    ApplicationsToolbar.tsx
  model/use-applications-store.ts
  ApplicationsPage.tsx
  types.ts
  index.ts
```

- `api/`：放请求函数、TanStack Query key、响应适配，不直接操作 UI 状态。
- `components/`：放页面内专属组件，可以组合 shadcn/ui、AG Grid、ECharts、Monaco。
- `hooks/`：放页面专属 hook。跨页面复用前不要移动到全局 `hooks/`。
- `model/`：放页面内 Zustand store、派生计算、状态转换。
- `types.ts`：放页面领域类型。
- `index.ts`：只导出外部需要使用的页面入口、Query key、请求函数和类型，避免外部深层路径依赖。

## 命名约定

- React 组件文件使用 `PascalCase.tsx`，例如 `ApplicationsPage.tsx`。
- 页面入口组件使用 `<PageName>Page.tsx`，例如 `DashboardPage.tsx`、`ApplicationsPage.tsx`。
- hook 文件使用 `use-*.ts` 或 `use-*.tsx`，导出名使用 `useXxx`。
- Zustand store 文件使用 `use-*-store.ts`，导出名使用 `useXxxStore`。
- 请求与数据适配文件使用页面业务名，例如 `applications-snapshot.ts`、`dashboard-snapshot.ts`。
- 类型集中到 `types.ts`；常量集中到 `constants.ts`；纯函数工具使用 `*.utils.ts`。
- 组件默认使用具名导出，入口文件可以按框架需要例外。

## 依赖与引用边界

- 允许：`app -> pages -> components/ui -> lib`。
- 允许：`app/layouts` 引用页面的 `index.ts` 公开出口来做路由装配，不直接深层引用页面内部组件。
- 允许：页面内部互相引用自己的 `api/components/hooks/model/types`。
- 允许：页面之间通过对方 `index.ts` 暴露的公开 API 引用。
- 禁止：`components/ui` 引用 `pages`、`app`、业务 store 或请求函数。
- 禁止：页面之间互相深层引用，例如 `@/pages/a/components/X`。
- 禁止：在组件中直接散落 fetch 细节；请求入口应放在页面的 `api/`。
- 禁止：为了方便把单页面代码放进全局 `lib`、`hooks`、`store`。

## 样式规范

- Tailwind utility 是默认样式方案。
- 主题 token、CSS 变量、基础 reset 只放 `src/index.css`。
- 字体使用 Google 开源字体自托管方案：UI 使用 `Roboto Flex Variable + Noto Sans SC Variable`，代码/等宽文本使用 `Roboto Mono`，通过 Fontsource 包在 `src/main.tsx` 引入。
- 不新增全局 CSS 文件，除非是第三方库必须要求，并在引入处说明用途。
- shadcn/ui 组件可按项目主题微调，但不得塞入业务文案或业务状态。
- 业务和布局代码优先使用 `src/components/ui` 中的 shadcn/ui 原子组件；已有对应组件时，不直接写原生 `button`、`input`、`select`、`textarea`、`checkbox` 等交互控件。
- Tailwind 类名优先使用 spacing scale 与语义色值，例如 `min-w-65`、`h-18`、`bg-slate-50`；视觉相近即可，不为像素级还原设计稿引入任意值。只有第三方状态选择器、无法替代的 CSS 变量等确实必要场景才使用中括号。
- 复杂数据界面优先使用紧凑、可扫描的布局，不做营销式 hero 或装饰性背景。

## 工具约束

- 使用 Biome 统一格式化与基础 lint。
- 使用 TypeScript 严格模式，避免 `any`；确需使用时必须在附近解释边界原因。
- 新增依赖前说明用途，优先复用现有栈。
- AG Grid、ECharts、Monaco 的初始化逻辑应封装在页面组件或专用适配器内。

## AI 开发流程

1. 先确认需求属于哪个页面，或是否需要新增页面目录。
2. 新增文件前按本规范选择目录；新增页面时必须创建 `src/pages/<page>/`。
3. 修改 shadcn/ui 时确认没有引入业务逻辑。
4. 修改完成后运行 `bun run lint` 和 `bun run typecheck`。
5. 涉及 UI、构建配置、依赖或打包行为时运行 `bun run build`。
6. 如果新增了目录类别或打破现有边界，先更新本规范再提交代码。
