# 部署说明

Forge Console 是纯静态 SPA：Bun 构建出 `dist/`，用 Nginx 托管。登录和所有数据都依赖 forge-server，前端容器本身不保存状态，也不代理后端请求。

## 1. 镜像

根目录 [`Dockerfile`](../Dockerfile) 分两个阶段：

| 阶段 | 镜像 | 说明 |
| --- | --- | --- |
| 构建 | `micr.cloud.mioffice.cn/devx-build-image/nodejs:24-ubuntu2404-base` | DevX 推荐的 Node 24 镜像，已预置公司 npm 源。从公司源安装固定版本的 Bun，按 `bun.lock` 安装依赖后执行 `bun run build` |
| 运行 | `micr.cloud.mioffice.cn/devx-build-image/base:ubuntu-2404-mini` | 从内网 apt 源安装 Ubuntu 自带的 Nginx（1.24），加载 [`deploy/nginx.conf`](../deploy/nginx.conf) |

- 只使用标准 Dockerfile 语法，MIFLOW（kaniko）和本地 `docker build` 都能构建。
- 没有使用 Matrix 文档示例中的 `node:16` 和 `online-app:centos7.3-nginx-1.16.1`：Vite 8 要求 Node 20.19 以上；CentOS 7 已停止维护，DevX 也不推荐 centos 变体。
- 构建参数：

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/` | 后端地址，构建时写入产物。`/` 表示与后端同域（推荐）；不同域时传完整地址，例如 `https://forge-api.example.com` |
| `BUN_VERSION` | `1.4.3` | 与本地开发使用的 Bun 版本保持一致 |
| `NODE_IMAGE` / `RUNTIME_IMAGE` | 见上表 | 需要升级基础镜像时覆盖 |

本地构建并试运行（Apple Silicon 上需要 `--platform linux/amd64`）：

```bash
docker build --platform linux/amd64 -t forge-console:local .
docker run --rm -p 18081:80 forge-console:local
```

## 2. Nginx 行为

| 路径 | 行为 |
| --- | --- |
| `/_check_domain_health` | 返回 200 `OK`，供 Matrix 容器健康检查使用 |
| `/assets/*` | 带内容哈希的构建产物，`Cache-Control: public, max-age=31536000, immutable`，文件不存在时返回 404 |
| `/api/*`、`/healthz`、`/readyz`、`/metrics`、`/openapi.json` | 返回 404。这些路径应由负载均衡转发给 forge-server，落到前端容器说明转发规则没配好 |
| 其他路径 | 有对应文件就返回文件，否则回退到 `index.html`（`Cache-Control: no-cache`），由 React Router 处理 |

访问日志写 stdout，错误日志写 stderr。

## 3. 部署到 Matrix

### 3.1 平台准备

1. 在 IAM 资源树上建项目节点（或使用已有节点），Matrix 应用必须挂在项目节点下。
2. 在 MICR（IAM 版本）建命名空间，用于存放镜像。
3. 在 Matrix 创建应用，代码仓库选 `git.n.xiaomi.com/yangchenhui1/forge-console`，Dockerfile 路径为根目录 `Dockerfile`。
4. 创建部署空间：
   - 容器端口 `80`；
   - 健康检查方式 HTTP，路径 `/_check_domain_health`，端口 `80`；
   - 不同后端地址的环境各建一个部署空间，通过构建参数 `VITE_API_BASE_URL` 区分。同域部署时所有环境都用默认值 `/`，不需要区分。

### 3.2 域名与转发（推荐同域）

在 Matrix 的域名配置里，给同一个域名配两条转发规则：

| 路径 | 转发到 |
| --- | --- |
| `/api/` | forge-server |
| `/`（其余所有路径） | forge-console |

同域部署时浏览器请求都是同源的，不需要配 CORS，飞书登录的 session cookie 也不涉及跨站。Matrix 不能新建二级域名，只能使用已有域名或走集团审批申请。

如果前后端只能用不同域名：构建时传 `VITE_API_BASE_URL=https://<后端域名>`，并在 forge-server 配置 `HTTP_CORS_ALLOW_ORIGINS=https://<前端域名>`、`HTTP_CORS_ALLOW_CREDENTIALS=true`。两个域名要属于同一个站点（例如都在 `mioffice.cn` 下），否则 `SameSite=Lax` 的 session cookie 不会随请求发送。

### 3.3 后端配置

前端域名确定后，forge-server 需要同步修改：

- `FEISHU_REDIRECT_URI=https://<前端域名>/login/feishu/callback`，并把这个地址加进飞书开放平台应用的重定向 URL 白名单；
- 不同域部署时按 3.2 配置 CORS。

## 4. 验证

部署后依次检查：

1. `GET /_check_domain_health` 返回 `OK`；
2. 打开首页和任意深层路径（如 `/builds`）都能加载页面，刷新不出现 404；
3. `GET /api/v1/ping` 返回 forge-server 的 JSON，而不是 404，说明 `/api/` 转发规则生效；
4. 走一遍飞书登录，回到控制台后能看到用户信息。
