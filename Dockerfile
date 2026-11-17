# Forge Console 镜像：Bun 构建静态文件，Nginx 托管。用于 Matrix 等容器平台，部署说明见 docs/deployment.md。
# 只用标准 Dockerfile 语法（不依赖 BuildKit 扩展），MIFLOW/kaniko 可直接构建。

# DevX 推荐的 Node 构建镜像（Vite 8 要求 Node 20.19+），已预置公司 npm 源。
ARG NODE_IMAGE=micr.cloud.mioffice.cn/devx-build-image/nodejs:24-ubuntu2404-base
# DevX 精简运行镜像，apt 使用内网源 apt.sys.srv。
ARG RUNTIME_IMAGE=micr.cloud.mioffice.cn/devx-build-image/base:ubuntu-2404-mini

FROM ${NODE_IMAGE} AS build
ARG BUN_VERSION=1.4.3
WORKDIR /build
RUN npm install -g "bun@${BUN_VERSION}" && bun --version
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
# 接口地址在构建时写入产物。默认 "/" 表示与后端同域，由负载均衡把 /api 转发给 forge-server；
# 前后端不同域时传入完整地址，例如 --build-arg VITE_API_BASE_URL=https://forge-api.example.com。
ARG VITE_API_BASE_URL=/
RUN VITE_API_BASE_URL="${VITE_API_BASE_URL}" bun run build

FROM ${RUNTIME_IMAGE}
RUN apt-get update \
    && apt-get install -y --no-install-recommends nginx \
    && rm -rf /var/lib/apt/lists/* /etc/nginx/sites-enabled/* \
    && nginx -v
COPY deploy/nginx.conf /etc/nginx/conf.d/forge-console.conf
COPY --from=build /build/dist/ /usr/share/nginx/forge-console/
RUN nginx -t
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
