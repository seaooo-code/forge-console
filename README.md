# Forge Console

Forge Console 是 RN Bundle 交付平台的 Web 管理端，与 `forge-server` 配合完成应用、模块、构建、发布和平台资源管理。

## 功能概览

| 模块 | 主要能力 |
| --- | --- |
| 线上现状 | 按模块和环境查看当前生效的全量、比例灰度路由，以及可发布的新构建 |
| 应用管理 | 创建和维护应用、成员、运行环境及客户端接入信息 |
| 模块管理 | 管理 Common/Feature 模块，绑定 GitHub 或 GitLab 仓库，配置构建方式和自动构建分支 |
| 构建管理 | 按应用、模块、环境和状态筛选构建，创建构建并查看失败原因、产物树和执行节点 |
| 发布记录 | 基于构建产物创建全量或比例灰度发布，并维护生效状态 |
| 提测单 | 按需求组织模块构建和测试账号，成员用自己的账号拉到提测单里的包 |
| 代码源管理 | 创建和安装 GitHub App，新建和校验 GitLab 连接 |
| 构建适配器 | 维护可复用的构建配方，模块选用后无需在仓库里放 Dockerfile |
| 存储管理 | 维护 S3 兼容对象存储配置并测试连通性 |
| 环境管理 | 管理运行环境及其绑定的存储配置 |
| 访问令牌 | 生成、保存、启停和删除客户端读取产物 manifest 使用的令牌 |
| 飞书租户 | 维护登录使用的飞书应用（需要飞书租户管理权限） |

所有后台页面均受飞书登录会话保护；创建、编辑、构建、发布和平台配置操作会根据后端返回的全局角色与资源权限启用或禁用。

## 技术栈

- React 19、TypeScript 6、Vite 8
- React Router、TanStack Query、Zustand、React Hook Form
- Tailwind CSS 4、shadcn/ui、Lucide React
- AG Grid、ECharts
- Bun、Biome

## 本地开发

### 环境要求

- Bun
- 已启动的 `forge-server`
- 已在后端配置的飞书 OAuth 应用

### 安装和启动

```bash
bun install
bun run dev
```

Vite 默认监听 `0.0.0.0:5173`，浏览器访问：

```text
http://127.0.0.1:5173
```

本地联调统一使用 `127.0.0.1`，不要用 `localhost` 打开前端：飞书回调地址和后端默认地址都是 `127.0.0.1`，混用时 session cookie 可能无法携带，表现为登录后又回到登录页。

前端默认请求 `http://127.0.0.1:8080`。需要连接其他后端时，复制 `.env.example` 为 `.env.local` 并修改：

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:8080
```

也可以只对当前命令覆盖：

```bash
VITE_API_BASE_URL=http://127.0.0.1:8080 bun run dev
```

### 后端联调配置

本地联调时，`forge-server` 至少需要保持以下配置一致：

```dotenv
FEISHU_REDIRECT_URI=http://127.0.0.1:5173/login/feishu/callback
HTTP_CORS_ALLOW_ORIGINS=http://127.0.0.1:5173,http://localhost:5173
HTTP_CORS_ALLOW_CREDENTIALS=true
```

登录流程由前端跳转到 `GET /api/v1/auth/feishu/authorize` 发起，回调页面位于 `/login/feishu/callback`。后续请求通过服务端 session cookie 鉴权，因此本地 CORS 必须允许 credentials。

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `bun run dev` | 启动 Vite 开发服务器 |
| `bun run gen:api` | 从 `../forge-server/docs/openapi.json` 生成 `src/api/openapi.ts` 接口类型 |
| `bun run lint` | 使用 Biome 检查格式和基础规则 |
| `bun run lint:fix` | 自动修复 Biome 可处理的问题 |
| `bun run typecheck` | 执行 TypeScript 类型检查 |
| `bun run build` | 类型检查并生成生产产物到 `dist/` |
| `bun run preview` | 本地预览生产构建 |
| `bun run validate` | 依次执行 lint、typecheck 和 build |

## 项目结构

```text
src/
├── app/              # Provider、React Router、后台布局和导航装配
├── pages/            # 按业务页面收敛的组件、请求、类型和状态
├── components/
│   ├── ui/           # shadcn/ui 原子组件
│   ├── common/       # 跨页面复用的轻业务组件
│   └── layout/       # 页面壳层、筛选栏、表格和状态组件
├── api/              # 两个及以上页面复用的请求层
├── store/            # 登录、主题和应用范围等全局状态
├── types/            # 跨页面共享类型
├── lib/              # Query、AG Grid、ECharts 等基础设施
├── index.css         # Tailwind 入口和全局主题变量
└── main.tsx          # React 挂载入口
```

页面路由以 `src/app/App.tsx` 为准，侧边栏入口以 `src/app/navigation.ts` 为准。完整目录边界和开发规则见 [`docs/frontend-directory-standard.md`](docs/frontend-directory-standard.md) 与 [`AGENTS.md`](AGENTS.md)。

## 生产构建

```bash
bun run validate
```

构建成功后，静态文件输出到 `dist/`。部署时需要让 Web 服务器把 React Router 的未知路径回退到 `index.html`，并在构建阶段提供正确的 `VITE_API_BASE_URL`。

容器部署（Matrix 等）使用根目录的 `Dockerfile` 和 `deploy/nginx.conf`，步骤见 [`docs/deployment.md`](docs/deployment.md)。
