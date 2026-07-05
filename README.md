# Ascii Studio — Monorepo

Bun workspaces + Turborepo. Currently one deployable app; structured to add more (e.g. a backend) later.

## Structure

```
apps/
  landing/            # The whole product — single Next.js app, single deploy
    src/app/          #   marketing site: /, /showcase, /upload, /studio
    src/app/tool/     #   the ASCII studio tool: /tool, /tool/studio, ...
    src/tool/         #   tool components / lib / hooks (namespaced under @/tool)
packages/             # (future) shared ui / config / utils
```

The ASCII studio tool is served under **`/tool`** within the landing app, so the
whole product ships as **one Vercel deployment on one domain**:

- `asciistudio.space/` → landing
- `asciistudio.space/tool` → tool home
- `asciistudio.space/tool/studio` → the video → ASCII converter

## Getting started

```bash
bun install
bun run dev        # http://localhost:3000  (auto-picks a free port if busy)
```

## Tasks

```bash
bun run build      # production build (Turborepo)
bun run lint
```

## Deploy (Vercel)

One project, **Root Directory = `apps/landing`**. Vercel auto-detects Next.js +
Turborepo + Bun. Set the landing env vars (`DASHBOARD_PASSWORD`, `GITHUB_TOKEN`,
`GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH`) in the project settings.
