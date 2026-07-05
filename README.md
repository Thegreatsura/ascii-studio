# Ascii Studio — Monorepo

Bun workspaces + Turborepo monorepo for the Ascii Studio product.

## Structure

```
apps/
  landing/     # Marketing site: landing, showcase, upload + shadcn registry (Next.js)
  ascii-tool/  # The ASCII studio tool: video → ASCII converter (Next.js)
packages/      # (future) shared ui / config / utils
```

## Getting started

```bash
bun install        # install all workspaces
bun run dev        # run every app in parallel (Turborepo)
```

- Landing → http://localhost:3000
- Ascii tool → http://localhost:3001

## Run a single app

```bash
bun run landing    # just the landing site
bun run tool       # just the ascii tool
```

## Other tasks

```bash
bun run build      # build all apps
bun run lint       # lint all apps
```
