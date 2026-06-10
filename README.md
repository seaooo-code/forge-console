# Forge Console

React, TypeScript, Vite, Tailwind CSS, shadcn/ui, AG Grid, ECharts, TanStack Query, and Zustand.

## Scripts

```sh
bun run dev
bun run typecheck
bun run build
```

## Backend API

Environment management reads real data from `forge-server`.
Feishu login starts at `GET /api/v1/auth/feishu/authorize` and completes the callback through
`GET /api/v1/auth/feishu/callback`.

Default API base URL:

```sh
http://127.0.0.1:8080
```

Override it with:

```sh
VITE_API_BASE_URL=http://127.0.0.1:8080 bun run dev
```

For local Feishu OAuth, configure `forge-server` with:

```sh
FEISHU_REDIRECT_URI=http://127.0.0.1:5173/login/feishu/callback
HTTP_CORS_ALLOW_ORIGINS=http://127.0.0.1:5173,http://localhost:5173
HTTP_CORS_ALLOW_CREDENTIALS=true
```
