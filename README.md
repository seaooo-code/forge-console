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

Default API base URL:

```sh
http://127.0.0.1:8080
```

Override it with:

```sh
VITE_API_BASE_URL=http://127.0.0.1:8080 bun run dev
```
